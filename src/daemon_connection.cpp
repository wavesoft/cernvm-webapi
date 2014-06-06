/**
 * This file is part of CernVM Web API Plugin.
 *
 * CVMWebAPI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * CVMWebAPI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CVMWebAPI. If not, see <http://www.gnu.org/licenses/>.
 *
 * Developed by Ioannis Charalampidis 2013
 * Contact: <ioannis.charalampidis[at]cern.ch>
 */

// Everything is included in daemon.h
// (Including cross-referencing)
#include "daemon.h"

#include <vector>

#include <json/json.h>

#include <CernVM/Hypervisor.h>
#include <CernVM/ProgressFeedback.h>

/**
 * Cleanup before destuction
 */
void DaemonConnection::cleanup() {
    CRASH_REPORT_BEGIN;

    // Abort and join all threads
    runningThreads.interrupt_all();
    runningThreads.join_all();

    // Release all sessions by this connection
    core.releaseConnectionSessions( *this );
    
    CRASH_REPORT_END;
}

/**
 * Handle incoming websocket action
 */
void DaemonConnection::handleAction( const std::string& id, const std::string& action, ParameterMapPtr parameters ) {
    CRASH_REPORT_BEGIN;
    Json::Value data;

    // Useful information for crash reporting
    crashReportAddInfo( "domain", domain );
    crashReportAddInfo( "web-action", action );

    // =============================
    //  Common actions
    // =============================

    // [Handshake] 
    //  Sent right after the connection is established
	if (action == "handshake") {

		// Reply the server information
		data["version"] = CERNVM_WEBAPI_VERSION;
		reply(id, data);

		// Check if we are privileged
		if (parameters->contains("auth")) {
			privileged = core.authKeyValid( parameters->get("auth") );

            // Let UI know about it's priviledges
            sendEvent("privileged", ArgumentList(privileged));

		}

    }

    // [Interation Callback] 
    //  Sent as a response to a user-interaction request
    else if (action == "interactionCallback") {

        // Fire result callback
        if (parameters->contains("result")) {
            interactionCallback( parameters->getNum<int>("result") );
        } else {
            sendError("Missing 'result' parameter", id);
        }

    }

    // =============================
    //  Session management
    // =============================

    // [Request Session] 
    //  A request to contact the specified VMCP and initialize the
    //  CernVM WebAPI Session.
	else if (action == "requestSession") {

        // Schedule the new session request on a new thread
        if (parameters->contains("vmcp")) {

            // Create the object where we can forward the events
            CVMCallbackFw cb( *this, id );

            // Block requests when reached throttled state
            if (this->throttleBlock) {
                cb.fire("failed", ArgumentList( "Request denied by throttle protection" )( HVE_ACCESS_DENIED ) );
                return;
            }

            // Check if a hypervisor is installed. If not,
            // use the installer thread.
            if (core.hypervisor) {

                // Try to open session
                boost::thread* t = NULL;
                t = new boost::thread( boost::bind( &DaemonConnection::requestSession_thread, this, &t, id, parameters->get("vmcp") ) );
                runningThreads.add_thread(t);

            } else {

                // If we are already installing, warn the user
                if (installInProgress) {
                    cb.fire("failed", ArgumentList( "A hypervisor installation is in progress please wait until it's finished and try again." )( HVE_USAGE_ERROR ));
                    return;
                }

                // Mark installation in progress
                installInProgress = true;

                // Try to install first and then open session
                boost::thread* t = NULL;
                t = new boost::thread( boost::bind( &DaemonConnection::installHV_andRequestSession_thread, this, &t, id, parameters->get("vmcp") ) );
                runningThreads.add_thread(t);

            }

        } else {
            sendError("Missing 'vmcp' parameter", id);
        }

    }

    // [Session commands]
    //  If there is a 'session_id' parameter in the request,
    //  forward the command to the appropriate action
    else if (parameters->contains("session_id")) {

        // Lookup session pointer
        int session_id = parameters->getNum<int>("session_id");
        parameters->erase("session_id");

        if (core.sessions.find(session_id) == core.sessions.end()) {
            sendError("Unable to find a session with the specified session id!", id);
        } else {
            // Handle session action in another thread
            boost::thread* t = NULL;
            t = new boost::thread( boost::bind( &DaemonConnection::handleAction_thread, this, &t, core.sessions[session_id], id, action, parameters ) );
            runningThreads.add_thread(t);
        }

    }

    // =============================
    //  Power-user commands
    // =============================

    else if (privileged) {

        // [Stop] 
        //  Shut down the CernVM WebAPI Daemon.
        if ( action == "stopService" ) {

            // Mark core for forced shutdown
            core.running = false;

        }
    }

    CRASH_REPORT_END;
}

/**
 * Send confirm interaction event
 */
void DaemonConnection::__callbackConfim (const std::string& title, const std::string& body, const callbackResult& cb) {
    CRASH_REPORT_BEGIN;
    sendEvent("interact", ArgumentList("confirm")(title)(body));
    interactionCallback = cb;
    CRASH_REPORT_END;
}

/**
 * Send alert interaction event
 */
void DaemonConnection::__callbackAlert (const std::string& title, const std::string& body, const callbackResult& cb) {
    CRASH_REPORT_BEGIN;
    sendEvent("interact", ArgumentList("confirm")(title)(body));
    interactionCallback = cb;
    CRASH_REPORT_END;
}

/**
 * Send license interaction event
 */
void DaemonConnection::__callbackLicense (const std::string& title, const std::string& body, const callbackResult& cb) {
    CRASH_REPORT_BEGIN;
    sendEvent("interact", ArgumentList("confirm")(title)(body));
    interactionCallback = cb;
    CRASH_REPORT_END;
}

/**
 * Send license by URL interaction event
 */
void DaemonConnection::__callbackLicenseURL (const std::string& title, const std::string& url, const callbackResult& cb) {
    CRASH_REPORT_BEGIN;
    sendEvent("interact", ArgumentList("confirm")(title)(url));
    interactionCallback = cb;
    CRASH_REPORT_END;
}

/**
 * [Thread] Handle action for the given session in another thread
 */
void DaemonConnection::handleAction_thread( boost::thread** thread, CVMWebAPISession* session, const std::string& eventID, const std::string& action, ParameterMapPtr parameters ) {
    CRASH_REPORT_BEGIN;
    boost::thread *thisThread = *thread;
    CVMCallbackFw cb( *this, eventID );
    // Handle action
    session->handleAction(cb, action, parameters);
    // Remove this thread from the active threads
    runningThreads.remove_thread(thisThread);
    CRASH_REPORT_END;
}

/**
 * [Thread] Install hypervisor first, request session later
 */
void DaemonConnection::installHV_andRequestSession_thread( boost::thread ** thread, const std::string& eventID, const std::string& vmcpURL ) {
    CRASH_REPORT_BEGIN;
    boost::thread *thisThread = *thread;

    // Create a progress feedback
    CVMCallbackFw cb( *this, eventID );
    FiniteTaskPtr pTasks = boost::make_shared<FiniteTask>();
    cb.listen( pTasks );

    // Prompt the user first
    if (userInteraction->confirm("Hypervisor required", "For this website to work you must have a hypervisor installed in your system. Would you like us to install VirtualBox for you?") != UI_OK) {
        cb.fire("failed", ArgumentList( "You must have a hypervisor installed in your system to continue." )( HVE_USAGE_ERROR ));
        runningThreads.remove_thread(thisThread);
        installInProgress = false;
        return;
    }

    // Install hypervisor
    int ans = installHypervisor(
                core.downloadProvider,
                userInteraction,
                pTasks,
                2
            );

    // Check for error cases
    if (ans != HVE_OK) {
        cb.fire("failed", ArgumentList( "We were unable to install a hypervisor in your system. Please try again manually." )( HVE_USAGE_ERROR ));
        runningThreads.remove_thread(thisThread);
        installInProgress = false;
        return;
    }

    // Try to detecy hypervisor again
    core.hypervisor = detectHypervisor();

    // Was the installation successful? Start requestSession thread
    if (core.hypervisor) {
        boost::thread* t = NULL;
        t = new boost::thread( boost::bind( &DaemonConnection::requestSession_thread, this, &t, eventID, vmcpURL ) );
        runningThreads.add_thread(t);
    } else {
        cb.fire("failed", ArgumentList( "The hypervisor isntallation completed but we were not able to detect it! Please try again later or try to re-install it manually." )( HVE_USAGE_ERROR ));
        runningThreads.remove_thread(thisThread);
        installInProgress = false;
        return;
    }

    // Remove this thread from the active threads
    runningThreads.remove_thread(thisThread);
    installInProgress = false;

    CRASH_REPORT_END;
}

/**
 * [Thread] Request Session
 */
void DaemonConnection::requestSession_thread( boost::thread ** thread, const std::string& eventID, const std::string& vmcpURL ) {
	CRASH_REPORT_BEGIN;
    Json::Value data;
	HVInstancePtr hv = core.hypervisor;
    boost::thread *thisThread = *thread;

    // Create the object where we can forward the events
    CVMCallbackFw cb( *this, eventID );
    std::cout << "Thread: " << thisThread << std::endl;

    // Block requests when reached throttled state
    if (this->throttleBlock) {
        cb.fire("failed", ArgumentList( "Request denied by throttle protection" )( HVE_ACCESS_DENIED ) );
        runningThreads.remove_thread(thisThread);
        return;
    }

    try {

        // Create a progress feedback mechanism
        FiniteTaskPtr pTasks = boost::make_shared<FiniteTask>();
        pTasks->setMax( 2 );
        cb.listen( pTasks );

        // Create two sub-tasks that will be used for equally
        // dividing the progress into two tasks: validate and start
        FiniteTaskPtr pInit = pTasks->begin<FiniteTask>( "Preparing for session request" );
        pInit->setMax( 4 );

        // =======================================================================

        // Wait for delaied hypervisor initiation
        hv->waitTillReady( pInit->begin<FiniteTask>( "Initializing hypervisor" ), userInteraction );

        // =======================================================================

        // Try to update authorized keystore if it's in an invalid state
        pInit->doing("Initializing crypto store");
    
        // Trigger update in the keystore (if it's nessecary)
        core.keystore.updateAuthorizedKeystore( core.downloadProvider );

        // Still invalid? Something's wrong
        if (!core.keystore.valid) {
            cb.fire("failed", ArgumentList( "Unable to initialize cryptographic store" )( HVE_NOT_VALIDATED ) );
            runningThreads.remove_thread(thisThread);
            return;
        }

        // Block requests from untrusted domains
        if (!core.keystore.isDomainValid(domain)) {
            cb.fire("failed", ArgumentList( "The domain is not trusted" )( HVE_NOT_TRUSTED ) );
            runningThreads.remove_thread(thisThread);
            return;
        }
        
        pInit->done("Crypto store initialized");
    
        // =======================================================================

        // Validate arguments
        pInit->doing("Contacting the VMCP endpoint");
    
        // Put salt and user-specific ID in the URL
        std::string salt = core.keystore.generateSalt();
        std::string glueChar = "&";
        if (vmcpURL.find("?") == std::string::npos) glueChar = "?";
        std::string newURL = 
            vmcpURL + glueChar + 
            "cvm_salt=" + salt + "&" +
            "cvm_hostid=" + core.calculateHostID( domain );
    
        // Download data from URL
        std::string jsonString;
        int res = core.downloadProvider->downloadText( newURL, &jsonString );
        if (res < 0) {
            cb.fire("failed", ArgumentList( "Unable to contact the VMCP endpoint" )( res ) );
            runningThreads.remove_thread(thisThread);
            return;
        }

        pInit->doing("Validating VMCP data");

        // Try to parse the data
        Json::Value jsonData;
        Json::Reader jsonReader;
        try {
            bool parsingSuccessful = jsonReader.parse( jsonString, jsonData );
            if ( !parsingSuccessful ) {
                // report to the user the failure and their locations in the document.
                cb.fire("failed", ArgumentList( "Unable to parse response data as JSON" )( HVE_QUERY_ERROR ) );
                runningThreads.remove_thread(thisThread);
                return;
            }
        } catch (std::exception& e) {
            CVMWA_LOG("Error", "JSON Parse exception " << e.what());
            cb.fire("failed", ArgumentList( "Unable to parse response data as JSON" )( HVE_QUERY_ERROR ) );
            runningThreads.remove_thread(thisThread);
            return;
        }
    
        // Import response to a ParameterMap
        ParameterMapPtr vmcpData = ParameterMap::instance();
        CVMWA_LOG("Debug", "Parsing into data");
        vmcpData->fromJSON(jsonData);

        // Validate response
        if (!vmcpData->contains("name")) {
            cb.fire("failed", ArgumentList( "Missing 'name' parameter from the VMCP response" )( HVE_USAGE_ERROR ) );
            runningThreads.remove_thread(thisThread);
            return;
        };
        if (!vmcpData->contains("secret")) {
            cb.fire("failed", ArgumentList( "Missing 'secret' parameter from the VMCP response" )( HVE_USAGE_ERROR ) );
            runningThreads.remove_thread(thisThread);
            return;
        };
        if (!vmcpData->contains("signature")) {
            cb.fire("failed", ArgumentList( "Missing 'signature' parameter from the VMCP response" )( HVE_USAGE_ERROR ) );
            runningThreads.remove_thread(thisThread);
            return;
        };
        if (vmcpData->contains("diskURL") && !vmcpData->contains("diskChecksum")) {
            cb.fire("failed", ArgumentList( "A 'diskURL' was specified, but no 'diskChecksum' was found in the VMCP response" )( HVE_USAGE_ERROR ) );
            runningThreads.remove_thread(thisThread);
            return;
        }

        // Validate signature
        res = core.keystore.signatureValidate( domain, salt, vmcpData );
        if (res < 0) {
            cb.fire("failed", ArgumentList( "The VMCP response signature could not be validated" )( res ) );
            runningThreads.remove_thread(thisThread);
            return;
        }

        CVMWA_LOG("Debug", "Signature valid");

        pInit->done("Obtained information from VMCP endpoint");

        // =======================================================================

        CVMWA_LOG("Debug", "Validating session");
    
        // Check session state
        res = hv->sessionValidate( vmcpData );
        if (res == 2) { 
            // Invalid password
            cb.fire("failed", ArgumentList( "The password specified is invalid for this session" )( HVE_PASSWORD_DENIED ) );
            runningThreads.remove_thread(thisThread);
            return;
        }

        // =======================================================================

        CVMWA_LOG("Debug", "Validating request");
    
        /* Check if the session is new and prompt the user */
        pInit->doing("Validating request");
        if (res == 0) {
            pInit->doing("Session is new, asking user for confirmation");

            // Newline-specific split
            std::string msg = "The website " + domain + " is trying to allocate a " + core.get_hv_name() + " Virtual Machine \"" + vmcpData->get("name") + "\". This website is validated and trusted by CernVM." _EOL _EOL "Do you want to continue?";

            // Prompt user using the currently active userInteraction 
            if (userInteraction->confirm("New CernVM WebAPI Session", msg) != UI_OK) {
            
                // If we were aborted due to shutdown, exit
                if (core.hasExited()) {
                    runningThreads.remove_thread(thisThread);
                    return;
                }

                // Manage throttling 
                if ((getMillis() - this->throttleTimestamp) <= THROTTLE_TIMESPAN) {
                    if (++this->throttleDenies >= THROTTLE_TRIES)
                        this->throttleBlock = true;
                } else {
                    this->throttleDenies = 1;
                    this->throttleTimestamp = getMillis();
                }

                // Fire error
                cb.fire("failed", ArgumentList( "User denied the allocation of new session" )( HVE_ACCESS_DENIED ) );
                runningThreads.remove_thread(thisThread);
                return;
            
            } else {
            
                // Reset throttle
                this->throttleDenies = 0;
                this->throttleTimestamp = 0;
            
            }
        
        }
        pInit->done("Request validated");

        CVMWA_LOG("Debug", "Open session");

        // =======================================================================

        // Prepare a progress task that will be used by sessionOpen    
        FiniteTaskPtr pOpen = pTasks->begin<FiniteTask>( "Open session" );

        // Open/resume session
        HVSessionPtr session = hv->sessionOpen( vmcpData, pOpen );
        if (!session) {
            cb.fire("failed", ArgumentList( "Unable to open session" )( HVE_ACCESS_DENIED ) );
            runningThreads.remove_thread(thisThread);
            return;
        }

        // Wait until session FSM has routet itself accordingly
        session->wait();

        // We have everything. Prepare CVMWebAPI Session and fire success
        pTasks->complete( "Session open successfully" );

        // Check if we need a daemon for our current services
        hv->checkDaemonNeed();
        
        // Register session on store
        CVMWebAPISession* cvmSession = core.storeSession( *this, session );

        // Completed
        cb.fire("succeed", ArgumentList("Session open successfully")(cvmSession->uuid));

        // Send state variables
        cvmSession->sendStateVariables();

        // Send state changed message
        sendEvent("stateChanged", ArgumentList(session->local->getNum<int>("state", 0)), cvmSession->uuid_str);

        // Enable periodic jobs thread after stateChanged is sent
        // (This ensures that apiStateChanged is fired AFTER stateChanged event is sent)
        cvmSession->enablePeriodicJobs(true);

    } catch (...) {

        CVMWA_LOG("Error", "Exception occured!");

        // Raise failure
        cb.fire("failed", ArgumentList( "Unexpected exception occured while requesting session" )( HVE_EXTERNAL_ERROR ) );

    }

    runningThreads.remove_thread(thisThread);

    CRASH_REPORT_END;
}

