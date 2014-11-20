r
# CernVM WebAPI Components

The following diagram displays the various components taking place in a typical CernVM WebAPI usage scenario:

![](https://github.com/wavesoft/cernvm-webapi/blob/master/doc/components.jpg)

 * The **Application Website** is the website that wants to use the CernVM WebAPI. The application logic is written in javascript. For all the high-level operations it uses the `cernvm-webapi.js` library.
 * The **Application Webserver** (in addition to serving the website) provides the Virtual Machine Configuration Point (VMCP), which is used to provide the configuration information for the virtual machine.
 * The **CernVM WebAPI Daemon** is the binary application installed in the user's computer and is the one the javascript library interfaces with.
 * The **CernVM Webserver** is the webserver inside CERN from which required information and data regarding CernVM WebAPI are stored. That's currently http://cernvm.cern.ch/releases/ .
 * The **Hypervisor Website** is the website from which an appropriate hypervisor is downloaded from. Currently that's https://www.virtualbox.org/ .
 * The **Hypervisor** is an application installed in the user's computer and is the one where Virtual Machines will run.

# Trace of actions of a typical scenario

In this paragraph we are going to describe step by step the actions that take place when the user visits the *Application Website* and requests to start a *Virtual Machine*.

## Interfacing with the daemon

The javascript library takes care of abstracting everything for the ease of use of the interface developer. Therefore, upon request:

 - **(1)** The *Application Website* calls `CVM.startCVMWebAPI`. This triggers the initiation sequence in the javascript library. During this sequence the library will:
    - Try to open a websocket connection to `127.0.0.1:5624`
    - If it fails, it tries again after a short delay for a finite number of retries.
    - If all the retries fail, the installation logic starts.
 - **(2)** When the installation logic begins, the user is prompted to install the application, while a polling loop starts. The latter attempts to connect to the `127.0.0.1:5624` websocket every five seconds.
 - **(3)** For the installation to begin, an iframe is shown to the user, with the contents of the installation website (http://cernvm.cern.ch/releases/webapi/install)
 - **(4)** The installation website, checks the `User-Agent` header of the user's browser and picks the appropriate binary for the user's computer.
 - **(5)** After the installation is completed, the *CernVM WebAPI Daemon* will be started. The polling loop of the installation logic will eventually realize that a connection is available and will call back to the initiator logic.
 - **(6)** The initiator logic will create an instance of the `CVM.WebAPIPlugin ` class, passing the successful socket connection as parameter.
 - **(7)** Upon a successful connection and websocket protocol negotiation, the *CernVM WebAPI Daemon* has created a new `DaemonConnection` instance and stored it in the `CVMWebserver::connections` map. This instance will remain in memory as long as the connection is alive. 
 - **(8)** This concludes the initialization sequence and therefore the `CVM.startCVMWebAPI` function fires the callback, passing the `CVM.WebAPIPlugin` instance as a first argument.

## Requesting a session

Now that we have the high-level interface to the Daemon, we can request a *Session*. For more information regarding the terminology have a look at the  [Terminology](Tutorial-01-Terminology) tutorial.

 - **(9)** Right after the user has a plugin instance, a session can be requested. To do this, the *Application Website* calls the `.requestSession` function on the plugin instance. The first argument to this function is the URL to contact in order to obtain the VM configuration information. This places a session request to the daemon.
 - **(10)** The *CernVM WebAPI Daemon* will first make sure that a hypervisor is installed and it's integrity is validated by calling `core.syncHypervisorReflection()`. 
 - **(11)** If a hypervisor has to be installed, it begins the installation process.
 - **(12)** The installation is performed by calling the `VBoxCommon::vboxInstall()` function and is platform dependnant. The common steps are:
    - Download the *hypervisor configuration* from http://cernvm.cern.ch/releases/webapi/hypervisor.config
    - Find the appropriate version to install according to the host OS
    - Wait until the process is completed
    - Wait until the hypervisor becomes available
 - **(13)** The daemon performs an HTTP GET request, appending [two additional](VMCP-Reference) GET parameters in order to prevent replay attacks.
 - **(14)** The *Application Webserver* compiles a JSON response with the configuration information for the VM and then signs it with it's private domain key (as explained in the [[Calculating VMCP Signature]] document).
 - **(15)** The *CernVM WebAPI Daemon* parses the reponse to a `ParameterMap` key/value dictionary and forwards it to an instance of the `DomainKeystore` class in order to validate the signature.
 - **(16)** The `DomainKeystore` class will:
    - Fetch the list of trusted domains and their respective public key from http://cernvm.cern.ch/releases/webapi/keystore/domainkeys.lst . 
    - Fetch the signature of the `domainkeys.lst` from http://cernvm.cern.ch/releases/webapi/keystore/domainkeys.sig .
    - Validate the signature of the `domainkeys.sig` using the hard-coded maintenr's public key and the contents of `domainkeys.lst` . 
    - Identify the domain from which the request was performed, by parsing the `Referer` header of the WebSocket connection.
    - Pick the respective public key and validate the signature given
 - **(17)** The result is a validated dictionary of the virtual machine configuration.
 - **(18)** This information is passed to the `HVInstance::sessionOpen()` function.
 - **(19)** This function will resume a previous session or allocate a new one and return an instance of `HVSession`. (In VirtualBox case that's a `VBoxSession` instance).
 - **(20)** The *CernVM WebAPI Daemon* will then create a new instance of the `CVMWebAPISession` class and store it in the `DaemonCore::sessions` map. A unique ID is allocated to this session and will be used to address it for further requests by the browser. This class is just a wrapper of the  *libCernVM* hypervisor session (`HVSession`), that translates the requests and events to JSON messages.
 - **(21)** The session ID is returned to the javascript WebSocket. The `WebAPIPlugin` instance will create a `CVM.WebAPISession` class instance, passing the session ID to it's parameters.

At this point, the `CVM.WebAPISession` can communicate with the `CVMWebAPISession` class instance of *CernVM WebAPI Daemon*, which will forward the requests to the `HVinstance` of *libCernVM*.

## Controlling the session

Upon a successfuly request of a session, the user can create and control the Virtual Machine. Let's take the case of a user requesting a `.start()` of a session.

 - **(22)** The user calls the `WebAPISession.start()` function on the session instance that was obtained in the previous step.
 - **(23)** This request is forwarded to the `DaemonConnection`, that forwards it to `CVMWebAPISession`, that eventually forwards it to the `HVSession` (`VBoxSession` in our case) instance. This will start the Finite State Machine in the `VBoxSession` (implemented using the `SimpleFSM` class) which will handle the request.
 - **(24)** At some point, the FSM will reach the `VBoxSession::DownloadMedia` state, where the VM media will be downloaded. This function reads the VMCP configuration, fetches the appropriate binary disk, validates it's ingergrity against a given SHA512 checksum and then places it in a cache storage. If the file already exists in cache it just picks it up from there. This cache has no expiry time.
 - **(25)** At some point, the FSM will have to issue commands to the VirtualBox installation. This is implemented using a sophisticated subprocess management function the `Utilities::sysExec()`. In order to avoid repeatability, there is one wrapper of this function in the hypervisor instance (`HVInstance::exec`) that pre-populates the full-path to the `VBoxManage` executable, and a second in the session instance (`HVSession::wrapExec`), that adds an interlock mechanism.
 - **(26)** Periodically, the *CernVM WebAPI Daemon* checks the Virtual Machine logfiles in order to detect state changes. The class `VBoxLobProbe` is responsible for analysing the results.
 - **(27)** Possible events regarding state change or parameter change are forwarded back to the javascript library in the form of "event" messages.
 - **(28)** The javascript library will fire the appropriate callback function when received.

# User Input Code Location

User provides input in various locations, both in in the *CernVM WebAPI* daemon and the `libCernVM` library. There are sanitization routines for every single point of input and listed below.

## User Input Sources

 * **HTTP Socket** - There is a web server running in the endpoint `127.0.0.1:5624`, listening for user input. They are handled either as regular HTTP requests or as WebSocket data. All socket input is handled by the function `CVMWebserver::api_handler`. All the HTTP-Protocol-Level sanitization happens by the *Mongoose* library.
     - Websocket data are handled by the `WebsocketAPI::handleRawData` function.
     - Hard-coded static resources are served by the `find_embedded_file` function, generated at build time by the `tools/mkdata.pl` script.
     - Additional URLs are handled by a staticURLHandler, such as `WebRPCHandler`.
 * **Websocket Protocol** - The function `handleRawData` handles incoming command frames from the WebSocket in form of JSON messages. The input is parsed by the `jsoncpp` library and the sanitization and validation is handled by it.
 * **VMCP Protocol** - The function `DaemonConnection::requestSession_thread` fetches the information from the VMCP endpoint, using the `DownloadProvider::downloadText` function. It then parses the input using the `jsoncpp` library. Simiilarly, the sanitization and validation is handled by the library.

## Critical Points

The following are the most critical parts where user input reaches the system:

 * **Configuration Files** - The configuration file is allocated for every session. This is stored on `<AppData>/CernVM/WebAPI/cache/run/*.conf`. The user-provider name never reaches the file name, but rather a UUID is allocated for each session. 
 * **System Command Execution** - The `VBoxSession` class call system commands in order to control the instance. Only one user-defined alphanumeric parameter reahes the `sysExec()` function: the `name` parameter from the VMCP responder (in the `VBoxSession::CreateVM` function). The sanitization check is performed in the `HVInstance::sessionOpen` function.

# The VBoxSession Finite State Machine

The following diagram shows the states of the VBoxSession Finite-State machine:

![](https://github.com/wavesoft/cernvm-webapi/blob/master/doc/vboxsession-fsm.jpg)
