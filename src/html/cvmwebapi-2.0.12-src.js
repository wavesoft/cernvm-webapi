window.CVM={'version':'2.0.12'};(function(_NS_) {
var ICON_ALERT = "data:image/gif;base64,R0lGODlhIAAgALMAAGZmZnl5eczMzJ+fn////7Ozs4yMjGtra+Li4nFxcaampgAAAAAAAAAAAAAAAAAAACH5BAEHAAQALAAAAAAgACAAAASjkMhJq704681JKV04JYkYDgAwmBuSpgibGS9gyJdQpwJeBTtAwDcpBFMgYuJ1WKZKPlRqSACmVjLXK2l8xVi0raSbupl0Ne6uJ7K+zOEXtUOWS9zijrNGxT87UjtURyothAASh18YcUGJhGY5hzZ7R2wWfpNHcxR1lmiHSRSVQQoSCpNQE4GQEo1HWARamgcHmjCut7pvBKC7ugKZv4ecRMYsEQA7";
var ICON_CONFIRM = "data:image/gif;base64,R0lGODlhIAAgAMQAAGZmZnt7e8TExK2treXl5dXV1Wtra4qKivj4+L29vd7e3pGRke/v78zMzLW1tYSEhHR0dJmZmQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEHAAgALAAAAAAgACAAAAXUICKOZGmeKMoUguMIBZPOY3IAeI4fCX0KEJ0wBxH4RouhMrfwEQLLKCBAmEGl0UAqmRUQBsumSYBtjG5KYykoVYwiS0gpgQUsZAVp71zHsaMHIwx9hAAyCHmACQoEDn9RBSJkSweMI5NSag51VSJ1DiKbWJ0In5JYBiOJmSKrYSNgWJEIg3ojV1KHCGhLnbVSgTVRciINdXsjjzpaxVjEJJhDbiIKCrhCaiVcQwEJBAoJD68o14VTM0/mOFQ+231iR0B1RUdzvEI89SosLjC6+gBnhAAAOw==";
var ICON_INSTALL = "data:image/gif;base64,R0lGODlhIAAgALMAAGZmZpOTk93d3Wtra8zMzLW1tXNzc3p6eu/v78XFxYODg9bW1qWlpejo6Pj4+IqKiiH5BAEHAA4ALAAAAAAgACAAAATr0MlJq7046827p4QBGMTHicBoVohApTAlIN4yjE1TwGmRH4DBooMa3XipQXFA0wiQ0ChguAHyFCUJQYE8dBqogY8BPDB0R0Pje0zYkMJEcs3ZAQKII7zx6GlCPAsMKQcuC1YMBDwkF0UpDih0DgspBghIBhdQDjcDEgEOl0EOmxaOAJApLlqVojCZFoeBgwAHQ4AAiTy2GnZ4p619AAUdeSlupwYLckFNG2BJBQgMIgYMCAVpkhpWMFg0CFuYHE9S5lMnr3o8SjBM5DcHDdhI0g1AQh+rEkgyziupKgHMsKAalYEIEypcyHBDBAA7";
var ICON_LICENSE = "data:image/gif;base64,R0lGODlhIAAgANUAAPX19fT09PLy8vDw8O7u7uzs7OLi4tnZ2c/Pz83NzczMzMXFxby8vLKysqmpqZ+fn5iYmJWVlZKSkoyMjICAgHx8fHl5eXZ2dnR0dHBwcG9vb21tbWtra2pqamhoaGdnZ2ZmZkxMTEpKSv///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEHACMALAAAAAAgACAAAAauwJFwSCwaj8ikcln5OJ/QqFRKnFqv0OpnyR05tV3mdvgNC87GslCtFbnf7/R4PTfLwfYjm41I+P+AgYB7cyAZG4iJiouIdHh5RYSQd2R1Sg0RDwwAkXV8R5iGoguPXpZGDKKqIAeVpXqrqq6zSbGyjrSgtqO4vbq7rL5Ylbumhm0eycoSQ6GxfYqQD8+TqNMTDgXV23nY0A3cyMHhdBqG4OSmBgvj5BEGQgvo6WFBADs=";
/**
 * Private variables
 */
var __pluginSingleton = null,
    __pageLoaded = false,
    __loadHooks = [];

/**
 * Core namespace
 */
_NS_.debugLogging = true;

/**
 * Let CVMWeb that the page is loaded (don't register page loaded)
 */
_NS_.markPageLoaded = function() {
    __pageLoaded = true;
};

/**
 * Helper function to start RDP client using the flash API from CernVM
 */
var launchRDP = function( rdpURL, resolution ) {

    // Process resolution parameter
    var width=800, height=600, bpp=24;
    if (resolution != undefined ) {
        // Split <width>x<height>x<bpp> string into it's components
        var res_parts = resolution.split("x");
        width = parseInt(res_parts[0]);
        height = parseInt(res_parts[1]);
        if (res_parts.length > 2)
            bpp  = parseInt(res_parts[2]);
    }

    // Calculate position on screen
    var left = (screen.width - width)/2,
    	top = (screen.height - (height+100))/2;

    // Open web-RDP client from CernVM
    var w = window.open(
        'http://cernvm.cern.ch/releases/webapi/webrdp/webclient.html#' + rdpURL + ',' + width + ',' + height, 
        'WebRDPClient', 
        'width=' + width + ',height=' + (height+100),
        ',left=' + left + ',top=' + top
    );
    w.focus();

    // Return window for further processing
    return w;

}

/**
 * Global function to initialize the plugin and callback when ready
 *
 * @param cbOK              A callback function that will be fired when a plugin instance is obtained
 * @param cbFail            [Optional] A callback that will be fired when an error occurs
 * @param unused  			[Optional] Provided for backwards compatibility. We ALWAYS setup the environment
 */
_NS_.startCVMWebAPI = function( cbOK, cbFail, unused ) {

	// Function that actually does what we want
	var fn_start = function() {

		// Create a CernVM WebAPI Plugin Instance
		var instance = new WebAPIPlugin();

		// Connect and wait for status
		instance.connect(function( hasAPI ) {
			if (hasAPI) {

				// We do have an API and we have a connection,
				// there will be more progress events.
				cbOK( instance );

			} else {

				// There is no API, ask the user to install the plug-in
				var cFrame = document.createElement('iframe');
				cFrame.src = "http://cernvm.cern.ch/releases/webapi/install";
				cFrame.width = "100%";
				cFrame.height = 400;
				cFrame.frameBorder = 0;

				// Show frame
				UserInteraction.createFramedWindow({
					'body' 		 : cFrame,
					'icon' 		 : ICON_INSTALL,
					'disposable' : false
				});

				// Periodic polling, waiting for the installation to complete
				var pollFunction = function() {
					// Check if we have API now
					instance = new WebAPIPlugin();
					instance.connect(function(hasAPI) {
						if (hasAPI) {
							cbOK( instance );
							UserInteraction.hideInteraction();
						} else {
							// Infinite loop on polling for the socket
							setTimeout(function() {
								pollFunction();
							}, 1000);
						}
					}, false);		
				};

				// Start infinite poll
				pollFunction();

			}
		});

	};

    // If the page is still loading, request an onload hook,
    // otherwise proceed with verification
    if (!__pageLoaded) {
        __loadHooks.push( fn_start );
    } else {
        fn_start();
    }

};/**
 * Constants
 */
var HV_NONE = 0;
var HV_VIRTUALBOX = 1;

/**
 * Websocket configuration
 */
var WS_ENDPOINT = "ws://127.0.0.1:5624",
    WS_URI = "cernvm-webapi://launch",
    PROBE_ENDPOINT = "http://127.0.0.1:5624/info";

/**
 * Session bit flags
 */
var HVF_SYSTEM_64BIT = 1,
    HVF_DEPLOYMENT_HDD = 2,
    HVF_GUEST_ADDITIONS = 4,
    HVF_FLOPPY_IO = 8,
    HVF_HEADFUL = 16;

/**
 * Flags for the UserInteraction
 */
var UI_OK           = 0x01,
    UI_CANCEL       = 0x02,
    UI_NOTAGAIN     = 0x100;

/**
 * Critical failures
 */
var F_NO_VIRTUALIZATION = 1;

/**
 * Return the textual representation of the specified state
 */
function _stateNameFor(state) {
    var states = [
        'missing',
        'available',
        'poweroff',
        'saved',
        'paused',
        'running'
    ];

    // Validate state range
    if ((state < 0) || (state>=states.length))
        return 'unknown';
    return states[state];
}

/**
 * Compare versions
 */
function _verCompare(v1, v2) {
    var p1 = v1.split("."), d1 = p1[2] + p1[1]*100 + p1[0]*10000,
        p2 = v2.split("."), d2 = p2[2] + p2[1]*100 + p2[0]*10000;
    return d1 - d2;
}

/**
 * The unique iframe element ID for the launcher
 */
var DOM_ELEMENT_ID = 'cernvm-webapi-launcher-'+(Math.random().toString().substr(2));

var EventDispatcher = function(e) {
    this.events = { };
};

// Hint for minimization
var EventDispatcherPrototype = EventDispatcher.prototype;

/**
 * Fire an event to the registered handlers
 */
EventDispatcherPrototype.__fire = function( name, args ) {
    if (_NS_.debugLogging) console.log("Firing",name,"(", args, ")");
    if (this.events[name] == undefined) return;
    var callbacks = this.events[name];
    for (var i=0; i<callbacks.length; i++) {
        callbacks[i].apply( this, args );
    }
};

/**
 * Register a listener on the given event
 */
EventDispatcherPrototype.addEventListener = function( name, listener ) {
    if (this.events[name] == undefined) this.events[name]=[];
    this.events[name].push( listener );
};

/**
 * Unregister a listener from the given event
 */
EventDispatcherPrototype.removeEventListener = function( name, listener ) {
    if (this.events[name] == undefined) return;
    var i = this.events[name].indexOf(listener);
    if (i<0) return;
    this.events.splice(i,1);
};

/**
 * User-friendly interface to flags
 */
var parseSessionFlags = function( o ) {
    var val=0;
    if (o.use64bit) val |= HVF_SYSTEM_64BIT;
    if (o.useBootDisk) val |= HVF_DEPLOYMENT_HDD;
    if (o.useGuestAdditions) val |= HVF_GUEST_ADDITIONS;
    if (o.useFloppyIO) val |= HVF_FLOPPY_IO;
    if (o.headful) val |= HVF_HEADFUL;
    return val;
};
var SessionFlags = function( o ) {
    var vSet = function(v) { o.__config['flags']=v; o.setAsync("flags", v); },
        vGet = function()  { return o.__config['flags']; };
    Object.defineProperties(this, {
        
        /* If the value is updated, trigger callback */
        "value":    {   get: function() {
                            return vGet();
                        },
                        set: function(v) {
                            vSet(v);
                        }
                    },
                    
        /* HVF_SYSTEM_64BIT: Use 64 bit CPU */
        "use64bit": {   get: function () { 
                            return ((vGet() & HVF_SYSTEM_64BIT) != 0);
                        },
                        set: function(v) {
                            if (v) {
                                vSet( vGet() | HVF_SYSTEM_64BIT );
                            } else {
                                vSet( vGet() & ~HVF_SYSTEM_64BIT );
                            }
                        }
                    },
                    
        /* HVF_DEPLOYMENT_HDD: Use a bootable disk (specified by diskURL) instead of using micro-CernVM */
        "useBootDisk":{  get: function () { 
                            return ((vGet() & HVF_DEPLOYMENT_HDD) != 0);
                        },
                        set: function(v) {
                            if (v) {
                                vSet( vGet() | HVF_DEPLOYMENT_HDD );
                            } else {
                                vSet( vGet() & ~HVF_DEPLOYMENT_HDD );
                            }
                        }
                    },

        /* HVF_GUEST_ADDITIONS: Attach guest additions CD-ROM at boot */
        "useGuestAdditions":{  get: function () { 
                            return ((vGet() & HVF_GUEST_ADDITIONS) != 0);
                        },
                        set: function(v) {
                            if (v) {
                                vSet( vGet() | HVF_GUEST_ADDITIONS );
                            } else {
                                vSet( vGet() & ~HVF_GUEST_ADDITIONS );
                            }
                        }
                    },

        /* HVF_FLOPPY_IO: Use FloppyIO contextualization instead of CD-ROM contextualization */
        "useFloppyIO":{  get: function () { 
                            return ((vGet() & HVF_FLOPPY_IO) != 0);
                        },
                        set: function(v) {
                            if (v) {
                                vSet( vGet() | HVF_FLOPPY_IO );
                            } else {
                                vSet( vGet() & ~HVF_FLOPPY_IO );
                            }
                        }
                    },
        
        /* HVF_HEADFUL: Use GUI window instead of headless */
        "headful": {  get: function () { 
                            return ((vGet() & HVF_HEADFUL) != 0);
                        },
                        set: function(v) {
                            if (v) {
                                vSet( vGet() | HVF_HEADFUL );
                            } else {
                                vSet( vGet() & ~HVF_HEADFUL );
                            }
                        }
                    }

    });
};

/**
 * WebAPI Socket handler
 */
var ProgressFeedback = function() {
	
};

/**
 * WebAPI Socket handler
 */
var Socket = function() {

	// Superclass constructor
	EventDispatcher.call(this);

	// The user interaction handler
	this.interaction = new UserInteraction(this);

	// Status flags
	this.connecting = false;
	this.connected = false;
	this.socket = null;

	// Event ID and callback tracking
	this.lastID = 0;
	this.responseCallbacks = {};

	// Parse authentication token from URL hash
	this.authToken = "";
	if (window.location.hash)
		this.authToken = window.location.hash.substr(1);

}

/**
 * Subclass event dispatcher
 */
Socket.prototype = Object.create( EventDispatcher.prototype );

// Hint for minimization
var SocketPrototype = Socket.prototype;

/**
 * Forward function for WebAPIPlugin : Reheat a connection
 */
SocketPrototype.__reheat = function( socket ) {

}

/**
 * Cleanup after shutdown/close
 */
SocketPrototype.__handleClose = function() {

	// Fire the disconnected event
	this.__fire("disconnected", []);

	// Hide any active user interaction - it's now useless
	UserInteraction.hideInteraction();

}

/**
 * Handle connection acknowlegement
 */
SocketPrototype.__handleOpen = function(data) {
	this.__fire("connected", data['version']);
}

/**
 * Handle raw incoming data
 */
SocketPrototype.__handleData = function(data) {
	var o = JSON.parse(data);

	// Forward all the frames of the given ID to the
	// frame-handling callback.
	if (o['id']) {
		var cb = this.responseCallbacks[o['id']];
		if (cb != undefined) cb(o);
	}

	// Fire event if we got an event response
	else if (o['type'] == "event") {
		var data = o['data'];

		// [Event] User Interaction
		if (o['name'] == "interact") {
			// Forward to user interaction controller
			this.interaction.handleInteractionEvent(o['data']);

		} else {
			this.__fire(o['name'], o['data']);

		}

	}

}

/**
 * Send a JSON frame
 */
SocketPrototype.send = function(action, data, responseEvents, responseTimeout) {
	var self = this;
	var timeoutTimer = null;

	// Calculate next frame's ID
	var frameID = "a-" + (++this.lastID);
	var frame = {
		'type': 'action',
		'name': action,
		'id': frameID,
		'data': data || { }
	};

	// Register generic reply callback
	if (typeof(responseEvents) == 'function') {

		// Register a timeout timer
		// unless the responseTimeout is set to 0
		if (responseTimeout !== 0) {
			timeoutTimer = setTimeout(function() {

				// Remove slot
				delete self.responseCallbacks[frameID];

				// Send error event
				responseEvents(null, "Response timeout");

			}, responseTimeout || 10000);
		}

		// Register a callback that will be fired when we receive
		// a frame with the specified ID.
		this.responseCallbacks[frameID] = function(data) {

			// We got a response, reset timeout timer
			if (timeoutTimer!=null) clearTimeout(timeoutTimer);

			// Wait for a result event
			if (data['type'] == 'result') {
				// Delete callback slot
				delete self.responseCallbacks[frameID];
				// Fire callback
				responseEvents(data['data']);
			}

		};

	// Register event listeners callbacks
	} else if (typeof(responseEvents) == 'object') {
		var eventify = function(name) {
				if (!name) return "";
				return "on" + name[0].toUpperCase() + name.substr(1);
			}

		// Register a timeout timer
		// unless the responseTimeout is set to 0
		if (responseTimeout !== 0) {
			timeoutTimer = setTimeout(function() {

				// Remove slot
				delete self.responseCallbacks[frameID];

				// Send error event
				if (responseEvents['onError'])
					responseEvents['onError']("Response timeout");

			}, responseTimeout || 10000);
		}

		// Register a callback that will be fired when we receive
		// a frame with the specified ID.
		this.responseCallbacks[frameID] = function(data) {

			// We got a response, reset timeout timer
			if (timeoutTimer!=null) clearTimeout(timeoutTimer);

			// Cleanup when we received a 'succeed' or 'failed' event
			if ((data['name'] == 'succeed') || (data['name'] == 'failed')) {
				delete self.responseCallbacks[frameID];
			}

			// Pick and fire the appropriate event response
			var evName = eventify(data['name']);
			if (responseEvents[evName]) {

				// Fire the function with the array list as arguments
				responseEvents[evName].apply(
						self, data['data'] || []
					);

			}

		};
	}

	// Send JSON Frame
	this.socket.send(JSON.stringify(frame));
}

/**
 * Close connection
 */
SocketPrototype.close = function() {
	if (!this.connected) return;

	// Disconnect
	this.socket.close();
	this.connected = false;

	// Handle disconnection
	this.__handleClose();

}

/**
 * Establish connection
 */
SocketPrototype.connect = function( cbAPIState, autoLaunch ) {
	var self = this;
	if (this.connected) return;

	// Defaults
	if (autoLaunch == undefined)
		autoLaunch = false;

	// Concurrency-check
	if (this.connecting) return;
	this.connecting = true;

	/**
	 * Lightweight probing, using HTTP GET on the /info endpoint
	 * instead of WebSockets. This is practical on Firefox, where
	 * each websocket attempt causes a blocking delay
	 */
	var light_probe = function(cb) {

		// Send request
		XHRequest.request(
			PROBE_ENDPOINT,
			function(data, error) {
				if (data == null) {
					// Fire error callback
					cb(false);
				} else {
					// Fire success callback
					cb(true);
				}	
			}
		);

	}

	/**
	 * Socket probing function
	 *
	 * This function tries to open a websocket and fires the callback
	 * when a status is known. The first parameter to the callback is a boolean
	 * value, wich defines if the socket could be oppened or not.
	 *
	 * The second parameter is the websocket instance.
	 */
	var probe_socket = function(cb, timeout) {
		try {

			// Calculate timeout
			if (!timeout) timeout=500;

			// Safari bugfix: When everything else fails
			var timedOut = false,
				timeoutCb = setTimeout(function() {
					timedOut = true;
					cb(false);
				}, timeout);

			// Setup websocket & callbacks
			var socket = new WebSocket(WS_ENDPOINT);
			socket.onerror = function(e) {
				if (timedOut) return;
				clearTimeout(timeoutCb);
				if (!self.connecting) return;
				socket.close();
				cb(false);
			};
			socket.onopen = function(e) {
				if (timedOut) return;
				clearTimeout(timeoutCb);
				if (!self.connecting) return;
				cb(true, socket);
			};

		} catch(e) {
			console.warn("[socket] Error setting up socket! ",e);
			if (timedOut) return;
			clearTimeout(timeoutCb);
			if (!self.connecting) return;
			socket.close();
			cb(false);
		}
	};

	/**
	 * Socket check loop
	 */
	var check_loop = function( cb, timeout, _retryDelay, _startTime) {

		// Get current time
		var time = new Date().getTime();
		if (!_startTime) _startTime=time;
		if (!_retryDelay) _retryDelay=500;

		// Calculate how many milliseconds are left until we 
		// reach the timeout.
		var msLeft = timeout - (time - _startTime);

		// Register a callback that will be fired when we reach
		// the timeout defined
		var timedOut = false,
			timeoutTimer = setTimeout(function() {
				timedOut = true;
				cb(false);
			}, msLeft);

		// Setup probe callback
		var probe_cb = function( state, socket ) {
			if (timedOut) return;
			// Don't fire timeout callback
			if (state) {
				clearTimeout(timeoutTimer);
				cb(true, socket); // We found an open socket
			} else {
				// If we don't have enough time to retry,
				// just wait for the timeoutTimer to kick-in
				if (msLeft < _retryDelay) return;
				// Otherwise clear timeout timer
				clearTimeout(timeoutTimer);
				// And re-schedule websocket poll
				setTimeout(function() {
					check_loop( cb, timeout, _retryDelay, _startTime );
				}, _retryDelay);
			}
		};

		// Calculate timeout allowance for the probe socket
		var probeTimeout = 500;
		if (msLeft < probeTimeout)
			probeTimeout = msLeft;

		// And send probe
		probe_socket( probe_cb, probeTimeout );

	};

	/**
	 * Callback to handle a successful pick of socket
	 */
	var socket_success = function( socket, reheat ) {
		self.connecting = false;
		self.connected = true;

		// Bind extra handlers
		self.socket = socket;
		self.socket.onclose = function() {
			console.warn("Socket disconnected");

			// Hide any active user interaction - it's now useless
			UserInteraction.hideInteraction();

			// Some times (for example when you close the lid) the daemon
			// might be disconnected. Start a quick retry loop for 2 seconds
			// and try to resume the connection.
			self.connecting = true;
			check_loop(function(status, socket) {

				// If we really couldn't resume the connection, die
				if (!status) {
					console.error("Connection with CernVM WebAPI interrupted");
					self.__handleClose();
				} else {
					// Otherwise replace the socket with the new version
					socket_success( socket, true );
				}

			}, 2000);

		};
		self.socket.onmessage = function(e) {
			self.__handleData(e.data);
		};

		// Send handshake and wait for response
		// to finalize the connection
		self.send("handshake", {
			"version": _NS_.version,
			"auth": self.authToken
		}, function(data, type, raw) {
			console.info("Successful handshake with CernVM WebAPI v" + data['version']);
			// Keep version information
			self.version = data['version'];
			// Check if the library is newer and prompt for update
			if (_verCompare(_NS_.version, self.version) > 0) {
				UserInteraction.alertUpgrade("You are using an old version of CernVM WebAPI. Click here to upgrade to <strong>" + _NS_.version + "</strong>.");
			}
			// Check for newer version message
			self.__handleOpen(data);
			// If we are reheating, handle reheat now
			if (reheat) self.__reheat(socket);
		});

		// We managed to connect, we do have an API installed
		if (cbAPIState) cbAPIState(true);

	};

	/**
	 * Callback to handle a failure to open a socket
	 */
	var socket_failure = function( socket ) {
		console.error("Unable to contact CernVM WebAPI");
		if (!self.connecting) return;
		self.connecting = false;
		self.connected = false;

		// We could not connect nor launch the plug-in, therefore
		// we are missing API components.
		if (cbAPIState) cbAPIState(false);

	};

	/**
	 * Callback function from check_loop to initialize
	 * the websocket and to bind it with the rest of the
	 * class instance.
	 */
	var checkloop_cb = function( state, socket ) {

		// Check state
		if (!state) {
			socket_failure();

		} else {
			// We got a socket!
			socket_success(socket);
		}

	};

	/**
	 * Lightweight probing with retries
	 */
	var light_probe_with_retries = function( probe_timeout, retries, callback ) {
		var tries = 1,
			do_retry = function() {
				// Check if we ran out of retries
				if (++tries > retries) {
					console.log("[socket] Ran out of retries");
					callback(false);
					return;
				} else {
					// Otherwise schedule another try
					console.log("[socket] Scheduling retry in 100ms");
					setTimeout(do_try, 100);
				}
			},
			do_try = function() {
			console.log("[socket] Probe try");

			// Perform a lightweight probe
			light_probe(function(status) {
				// If we got a socket, perform a socket probe
				if (status) {
					// Probe for connection
					probe_socket(function(state, socket) {
						if (state) {
							// If we got a socket, we are done
							callback(state, socket);
						} else {
							// Otherwise retry
							do_retry();
						}
					}, probe_timeout);
				} else {
					// Otherwise retry
					do_retry();
				}
			});

		}

		console.log("[socket] Trying socket probe with ",retries," retries");
		do_try();
	}

	// First, check if we can directly contact a socket
	// (Probe a socket with 4 retries before reaching a decision of launching
	//  the plug-in via URL)
	console.log("[socket] Starting probe with 4 retries");
	light_probe_with_retries( 500, 4, function(state, socket) {
		if (state) {
			// A socket is directly available
			console.log("[socket] Got socket");
			socket_success(socket);
		} else {

			// We ned to do a URL launch
			if (autoLaunch) {
				console.log("[socket] Auto-launching");

				// Create a tiny iframe for triggering the launch
				var e = document.getElementById(DOM_ELEMENT_ID);
				if (!e) {
					e = document.createElement('iframe'); 
					e.style.width = "1";
					e.style.height = "1";
					e.style.position = "absolute";
					e.style.left = "-1000px";
					e.style.top = "-1000px";
					e.id = DOM_ELEMENT_ID;
					document.body.appendChild(e);
				}

				// Try again to get element (IE.11 bug)
				var e = document.getElementById(DOM_ELEMENT_ID);
				e.src = WS_URI;

				// And start loop for 5 sec
				check_loop(checkloop_cb, 5000);

			} else {

				// Otherwise just fail
				socket_failure();

			}

		}
	});	

}
/**
 * Private variables
 */
var occupiedWindow = null;

/**
 * The private WebAPI Interaction class
 */
var UserInteraction = function( socket ) {
	var self = this;
	this.socket = socket;
	this.onResize = null;
	window.addEventListener('resize', function() {
		if (self.onResize) self.onResize();
	});
};

/**
 * Hide a particular interaction scren
 */
UserInteraction.hideScreen = function(elm) {
	try {
		document.body.removeChild(elm);
	} catch(e) { }
}

/**
 * Hide the active interaction screen
 */
UserInteraction.hideInteraction = function() {
	if (UserInteraction.activeScreen != null) {
		try {
			document.body.removeChild(UserInteraction.activeScreen);
		} catch(e) { }
		UserInteraction.activeScreen = null;
	}
}

/**
 * Create a framed button
 */
UserInteraction.createButton = function( title, baseColor ) {
	var button = document.createElement('button');

	// Place tittle
	button.innerHTML = title;

	// Style button
	button.style.display = 'inline-block';
	button.style.marginBottom = '0';
	button.style.textAlign = 'center';
	button.style.verticalAlign = 'middle';
	button.style.borderStyle = 'solid';
	button.style.borderWidth = '1px';
	button.style.borderRadius 
		= button.style.webkitBorderRadius 
		= button.style.mozBorderRadius 
		= "4px";
	button.style.userSelect 
		= button.style.webkitUserSelect 
		= button.style.mozUserSelect 
		= button.style.msUserSelect 
		= "none";
	button.style.margin = '5px';
	button.style.padding = '6px 12px';
	button.style.cursor = 'pointer';

	// Setup color
	var shadeColor = function(color, percent) {
			var num = parseInt(color.slice(1),16), amt = Math.round(2.55 * percent), R = (num >> 16) + amt, G = (num >> 8 & 0x00FF) + amt, B = (num & 0x0000FF) + amt;
			return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
		},
		yiqColor = function (bgColor) {
			var num = parseInt(bgColor.slice(1), 16),
				r = (num >> 16), g = (num >> 8 & 0x00FF), b = (num & 0x0000FF),
				yiq = (r * 299 + g * 587 + b * 114) / 1000;
			return (yiq >= 128) ? 'black' : 'white';
		};

	// Lighten for background
	button.style.backgroundColor = baseColor;
	button.style.borderColor = shadeColor(baseColor, -20);

	// Hover
	button.onmouseover = function() {
		button.style.backgroundColor = shadeColor(baseColor, -10);
	}
	button.onmouseout = function() {
		button.style.backgroundColor = baseColor;
	}

	// Pick foreground color according to the intensity of the background
	button.style.color = yiqColor( baseColor );

	// Return button
	return button;

}

/**
 * Style the specified frame
 */
UserInteraction.styleFrame = function( frame ) {
	frame.style.backgroundColor = "#FCFCFC";
	frame.style.border = "solid 1px #E6E6E6";
	frame.style.borderRadius 
		= frame.style.webkitBorderRadius 
		= frame.style.mozBorderRadius 
		= "5px";
	frame.style.boxShadow 
		= frame.style.webkitBoxShadow 
		= frame.style.mozBoxShadow 
		= "1px 2px 4px 1px rgba(0,0,0,0.2)";
	frame.style.padding = "10px";
	frame.style.fontFamily = "Verdana, Geneva, sans-serif";
	frame.style.fontSize = "14px";
	frame.style.color = "#666"
}

/**
 * Create a framed growl, used for version upgrade notification
 */
UserInteraction.createGrowlWindow = function( config ) {

	if (!config) config={};
	var body    	= config['body']    || "",
		href 		= config['href'] 	|| "",
		target 		= config['target'] 	|| "",
		iconSrc    	= config['icon']    || false, 
		cbClick 	= config['onClick'] || false;

	var growl = document.createElement('a'),
		icon = document.createElement('img'),
		content = document.createElement('div')

	// Setup icon
	growl.appendChild(icon);
	icon.style.position = "absolute";
	icon.style.left = "6px";
	icon.style.top = "12px";
	icon.src = iconSrc || ICON_ALERT;

	// Setup content
	growl.appendChild(content);
	content.style.position = "absolute";
	content.style.left = "45px";
	content.style.top = "8px";
	content.style.width = "300px";
	content.style.height = "42px";
	content.style.fontSize = "14px";
	content.style.color = "#333"
	content.innerHTML = body;

	// Setup frame
	growl.style.position = "absolute";
	growl.style.display = "block";
	growl.style.top = "10px";
	growl.style.right = "10px";
	growl.style.zIndex = 60000;
	growl.style.width = "350px";
	growl.style.height = "60px";
	growl.style.backgroundImage = ICON_INSTALL;
	growl.style.backgroundPosition = "bottom left";
	growl.style.textDecoration = "none";
	growl.href = href;
	growl.target = target;

	// Frame style
	UserInteraction.styleFrame(growl);

	// Setup callbacks
	growl.onclick = function() {
	   document.body.removeChild(growl);
		if (cbClick) cbClick();
	}

	// Place element on body
	document.body.appendChild(growl);
	return growl;

}

/**
 * Create a framed window, used for various reasons
 */
UserInteraction.createFramedWindow = function( config ) {

	if (!config) config={};
	var body    	= config['body']    || "", 
		header  	= config['header']  || false, 
		footer  	= config['footer']  || false, 
		icon    	= config['icon']    || false, 
		cbClose 	= config['onClose'] || false,
		disposable  = (config['disposable'] != undefined) ? config['disposable'] : true;

	var floater = document.createElement('div'),
		content = document.createElement('div'),
		cHeader = document.createElement('div'),
		cFooter = document.createElement('div'),
		cBody = document.createElement('div');

	// Make floater full-screen overlay
	floater.style.position = "absolute";
	floater.style.left = "0";
	floater.style.top = "0";
	floater.style.right = "0";
	floater.style.bottom = "0";
	floater.style.zIndex = 60000;
	floater.style.backgroundColor = "rgba(255,255,255,0.5)";
	floater.appendChild(content);

	// Prepare vertical-centering
	content.style.marginLeft = "auto";
	content.style.marginRight = "auto";
	content.style.marginBottom = 0;
	content.style.marginTop = 0;

	// Frame style
	UserInteraction.styleFrame(content);
	content.style.width = "70%";

	// Style header
	cHeader.style.color = "#333"
	cHeader.style.marginBottom = "8px";

	// Style footer
	cFooter.style.textAlign = "center";
	cFooter.style.color = "#333"
	cFooter.style.marginTop = "8px";

	// Append header
	content.appendChild(cHeader);
	if (header) {

		// Setup header
		if (typeof(header) == "string") {

			// Prepare icon
			var elmIcon;
			if (icon) {
				elmIcon = document.createElement('img');
				elmIcon.src = icon;
				elmIcon.style.verticalAlign = '-8px';
				elmIcon.style.marginRight = '6px';
			} else {
				elmIcon = document.createElement('span');
			}

			// Prepare body
			var headerBody = document.createElement('span');
			headerBody.innerHTML = header;
			headerBody.style.fontSize = "1.6em";
			headerBody.style.marginBottom = "8px";

			// Nest
			cHeader.appendChild(elmIcon);
			cHeader.appendChild(headerBody);

		} else {
			cHeader.appendChild(header);
		}
	}

	// Append body
	if (body) {
		cBody.style.overflow = "auto";
		cBody.appendChild(body);
	}
	content.appendChild(cBody);

	// Append footer
	content.appendChild(cFooter);
	if (footer) {
		if (typeof(footer) == "string") {
			cFooter.innerHTML = footer;
		} else {
			cFooter.appendChild(footer);
		}
	}

	// Update vertical-centering information
	var updateMargin = function() {

		// Calculate outer-body dimentions
		var outerBodyHeight = cHeader.offsetHeight + cFooter.offsetHeight + 50;

		// Calculate max-height
		var bodyHeight = window.innerHeight - outerBodyHeight;
		cBody.style.maxHeight = bodyHeight + "px";

		// Calculate vertical position
		var top = (window.innerHeight-content.offsetHeight)/2;
		if (top < 0) top = 0;
		content.style.marginTop = top + "px";

	}

	// Close when clicking the floater
	floater.onclick = function() {
		if (!disposable) return;
		if (cbClose) {
			cbClose();
		} else {
			UserInteraction.hideInteraction();
		}
	}

	// Stop propagation in content
	content.onclick = function(event) {
		event.stopPropagation();
	}

	// Remove previous element
	UserInteraction.hideInteraction();

	// Append element in the body
	document.body.appendChild(floater);
	UserInteraction.activeScreen = floater;
	updateMargin();

	// Register updateMargin on resize
	this.onResize = updateMargin;

	// Return root element
	return floater;

}

/**
 * Create a license window
 */
UserInteraction.displayLicenseWindow = function( title, body, isURL, cbAccept, cbDecline ) {
	var cControls = document.createElement('div'),
		lnkSpacer = document.createElement('span'),
		cBody;

	// Prepare elements
	lnkSpacer.innerHTML = "&nbsp;";

	// Prepare iFrame or div depending on if we have URL or body
	if (isURL) {
		cBody = document.createElement('iframe'),
		cBody.src = body;
		cBody.width = "100%";
		cBody.height = 450;
		cBody.frameBorder = 0;
	} else {
		cBody = document.createElement('div');
		cBody.width = "100%";
		cBody.style.height = '450px';
		cBody.style.display = 'block';
		cBody.innerHTML = body.replace( /\n/g, "<br/>\n" );
	}

	// Prepare buttons
	var	lnkOk = UserInteraction.createButton('Accept License', '#E1E1E1');
		lnkCancel = UserInteraction.createButton('Decline License', '#FAFAFA');

	// Style controls
	cControls.style.padding = '6px';
	cControls.appendChild(lnkOk);
	cControls.appendChild(lnkSpacer);
	cControls.appendChild(lnkCancel);

	// Create framed window
	var elm;
	elm = UserInteraction.createFramedWindow({
		'body'  : cBody, 
		'header': title, 
		'footer': cControls, 
		'icon'  : ICON_LICENSE, 
		onClose : function() {
		   document.body.removeChild(elm);
		   if (cbDecline) cbDecline();
		}
	});

	// Bind link callbacks
	lnkOk.onclick = function() {
	   document.body.removeChild(elm);
	   if (cbAccept) cbAccept();
	};
	lnkCancel.onclick = function() {
	   document.body.removeChild(elm);
	   if (cbDecline) cbDecline();
	};
	
	// Return window
	return win;
}

/** 
 * Display a growl message
 */
UserInteraction.alertUpgrade = function( body, callback ) {

	// Create growl frame
	UserInteraction.createGrowlWindow({
		'body' 	 : body,
		'icon' 	 : ICON_INSTALL,
		'cbClick': callback,
		'target' : '_blank',
		'href' 	 : 'http://cernvm.cern.ch/releases/webapi/install'
	});

}

/** 
 * Confirm function
 */
UserInteraction.confirm = function( title, body, callback ) {
	var cBody = document.createElement('div'),
		cButtons = document.createElement('div');

	// Prepare body
	cBody.innerHTML = body;
	cBody.style.width = '100%';

	// Prepare buttons
	var	win,
		lnkOk = UserInteraction.createButton('Ok', '#E1E1E1'),
		lnkCancel = UserInteraction.createButton('Cancel', '#FAFAFA');

	lnkOk.onclick = function() {
		document.body.removeChild(win);
		callback(true);
	};
	lnkCancel.onclick = function() {
		document.body.removeChild(win);
		callback(false);
	};

	// Nest
	cButtons.appendChild(lnkOk);
	cButtons.appendChild(lnkCancel);

	// Display window
	win = UserInteraction.createFramedWindow({
		'body'  : cBody, 
		'header': title, 
		'footer': cButtons, 
		'icon'  : ICON_CONFIRM, 
		onClose : function() {
			document.body.removeChild(win);
			callback(false);
		}
	});

	// Return window
	return win;

}

/** 
 * Alert function
 */
UserInteraction.alert = function( title, body, callback ) {
	var cBody = document.createElement('div'),
		cButtons = document.createElement('div');

	// Prepare body
	cBody.innerHTML = body;
	cBody.style.width = '100%';

	// Prepare button
	var win, lnkOk = UserInteraction.createButton('Ok', '#FAFAFA');
	lnkOk.onclick = function() {
		document.body.removeChild(win);
	};
	cButtons.appendChild(lnkOk);

	// Display window
	win = UserInteraction.createFramedWindow({
		'body'  : cBody, 
		'header': title, 
		'footer': cButtons, 
		'icon'  : ICON_ALERT
	});

	// Return window
	return win;

}

/** 
 * Display occupied status message
 */
UserInteraction.occupied = function( title, body ) {
	var cBody = document.createElement('div');

	// Prepare body
	cBody.innerHTML = body;
	cBody.style.width = '100%';

	// Display window
	var win = UserInteraction.createFramedWindow({
		'body'  		: cBody, 
		'header'		: title, 
		'icon'  		: ICON_INSTALL,
		'disposable'	: false
	});

	// Return window instance
	return win;

}

/** 
 * License confirm (by buffer) function
 */
UserInteraction.confirmLicense = function( title, body, callback ) {
	UserInteraction.displayLicenseWindow(title, body, false, function(){
		callback(true);
	}, function() {
		callback(false);
	});
}

/** 
 * License confirm (by URL) function
 */
UserInteraction.confirmLicenseURL = function( title, url, callback ) {
	UserInteraction.displayLicenseWindow(title, url, true, function(){
		callback(true);
	}, function() {
		callback(false);
	});
}

/**
 * Hide/show lengthy task placeholder
 */
UserInteraction.controlOccupied = function( isLengthy, msg ) {

	// Handle lenghy progress
	if (isLengthy) {

		// Display occupied window
		if (!occupiedWindow)
			occupiedWindow = UserInteraction.occupied(
				"Installation in progress",
				"<p>Pay attention on the the pop-up windows and follow the on-screen instructions.</p>"+
				"<p>When completed, please close any open installation window in order to continue.</p>"
				);

	} else {

		// Hide occupied window
		if (occupiedWindow) {
			UserInteraction.hideScreen(occupiedWindow);
			occupiedWindow = null;
		}

	}

}

/**
 * Handle interaction event
 */
UserInteraction.prototype.handleInteractionEvent = function( data ) {
	var socket = this.socket;

	// Confirmation window
	if (data[0] == 'confirm') {

		// Fire the confirmation function
		UserInteraction.confirm( data[1], data[2], function(result, notagain) {

			// Send back interaction callback response
			if (result) {
				socket.send("interactionCallback", {"result": UI_OK | (notagain ? UI_NOTAGAIN : 0) });
			} else {
				socket.send("interactionCallback", {"result": UI_CANCEL | (notagain ? UI_NOTAGAIN : 0) });
			}

		});

	}

	// Alert window
	else if (data[0] == 'alert') {

		// Fire the confirmation function
		UserInteraction.alert( data[1], data[2], function(result) { });

	}

	// License confirmation with buffer
	else if (data[0] == 'confirmLicense') {

		// Fire the confirmation function
		UserInteraction.confirmLicense( data[1], data[2], function(result, notagain) {

			// Send back interaction callback response
			if (result) {
				socket.send("interactionCallback", {"result": UI_OK | (notagain ? UI_NOTAGAIN : 0) });
			} else {
				socket.send("interactionCallback", {"result": UI_CANCEL | (notagain ? UI_NOTAGAIN : 0) });
			}

		});

	}

	// License confirmation with URL
	else if (data[0] == 'confirmLicenseURL') {

		// Fire the confirmation function
		UserInteraction.confirmLicenseURL( data[1], data[2], function(result, notagain) {

			// Send back interaction callback response
			if (result) {
				socket.send("interactionCallback", {"result": UI_OK | (notagain ? UI_NOTAGAIN : 0) });
			} else {
				socket.send("interactionCallback", {"result": UI_CANCEL | (notagain ? UI_NOTAGAIN : 0) });
			}

		});

	}


}
/**
 * Cross-browser implementation of XML HTTP Request
 */
var XHRequest = {

	/**
	 * Cross-browser XML HTTP factory objects
	 */
	XMLHttpFactories:  [
	    function () {return new XMLHttpRequest()},
	    function () {return new ActiveXObject("Msxml2.XMLHTTP")},
	    function () {return new ActiveXObject("Msxml2.XMLHTTP.3.0")},
	    function () {return new ActiveXObject("Msxml2.XMLHTTP.6.0")},
	    function () {return new ActiveXObject("Msxml3.XMLHTTP")},
	    function () {return new ActiveXObject("Microsoft.XMLHTTP")}
	],

	/**
	 * Send an XML HTTP Request
	 */
	request: function(url,callback,postData) {
	    var req = this.createXMLHTTPObject();
	    if (!req) return;
	    var method = (postData) ? "POST" : "GET";
	    req.open(method,url,true);
	    if (postData)
	        req.setRequestHeader('Content-type','application/x-www-form-urlencoded');
	    req.onreadystatechange = function () {
	        if (req.readyState != 4) return;
	        if (req.status != 200 && req.status != 304) {
	        	callback(null, req.status);
	            return;
	        }
	        callback(req.responseText);
	    }
	    req.ontimeout = function() {
	    	callback(null, false);
	    }
	    if (req.readyState == 4) return;
	    req.send(postData);
	},

	/**
	 * XML HTTP Object fractory for the different cases
	 */
	createXMLHTTPObject: function() {
	    var xmlhttp = false;
	    for (var i=0;i<this.XMLHttpFactories.length;i++) {
	        try {
	            xmlhttp = this.XMLHttpFactories[i]();
	        }
	        catch (e) {
	            continue;
	        }
	        break;
	    }
	    return xmlhttp;
	}


};
/**
 * WebAPI Socket handler
 */
var WebAPIPlugin = function() {

	// Superclass constructor
	Socket.call(this);

	// Open sessions
	this._sessions = [];

}

/**
 * Subclass event dispatcher
 */
WebAPIPlugin.prototype = Object.create( Socket.prototype );

// Hint for minimization
var WebAPIPluginPrototype = WebAPIPlugin.prototype;

/**
 * Attempt to reheat the connection if it went offline
 */
WebAPIPluginPrototype.__reheat = function( socket ) {
	var self = this,
		already_closed = false;

	// Reset response callbacks
	this.responseCallbacks = {};

	// Reopen valid connections
	for (var i=0; i<this._sessions.length; i++) {
		var session = this._sessions[i].ref,
			vmcp = this._sessions[i].vmcp;

		if (session.__valid) {

			// Send requestSession
			this.send("requestSession", {
				"vmcp": vmcp
			}, {
				onSucceed : function( msg, session_id ) {
					console.log("Session ", session_id, " reheated");

					// Update session ID reference
					session.session_id = session_id;

					// Receive events with id=session_id
					self.responseCallbacks[session_id] = function(data) {
						session.handleEvent(data);
					}
					
					// Send sync message
					setTimeout(function() {
						session.sync();
					}, 100);

				},
				onFailed: function( msg, code ) {
					console.warn("Unable to reheat a saved session!");

					// If a single vmcp failed to re-open after
					// a re-heat, consider the connection closed,
					// so the handling application has to restart,

					if (already_closed) return;
					self.__handleClose();
					already_closed = true;

				},
				// Progress feedbacks
				onLengthyTask: function( msg, isLengthy ) {
					// Control the occupied window
					UserInteraction.controlOccupied( isLengthy, msg );
				},
				onProgress: function( msg, percent ) {
					self.__fire("progress", [msg, percent]);
				},
				onStarted: function( msg ) {
					self.__fire("started", [msg]);
				},
				onCompleted: function( msg ) {
					self.__fire("completed", [msg]);
				}

			});

		}
	}

}

/**
 * Stop the CernVM WebAPI Service
 */
WebAPIPluginPrototype.stopService = function() {
	this.send("stopService");
}

/**
 * Open a session and call the cbOk when ready
 */
WebAPIPluginPrototype.requestSession = function(vmcp, cbOk, cbFail) {
	var self = this;

	// Send requestSession
	this.send("requestSession", {
		"vmcp": vmcp
	}, {

		// Basic responses
		onSucceed : function( msg, session_id ) {

			// Create a new session object
			var session = new WebAPISession( self, session_id, function() {
				
				// Fire the ok callback only when we are initialized
				if (cbOk) cbOk(session);

			});

			self._sessions.push({
				'vmcp': vmcp,
				'ref': session
			});

			// Receive events with id=session_id
			self.responseCallbacks[session_id] = function(data) {
				session.handleEvent(data);
			}

		},
		onFailed: function( msg, code ) {

			console.error("Failed to request session! "+msg);

			// Fire the failed callback
			self.__fire("failed", [msg]);
			if (cbFail) cbFail(msg, code);

		},
		onLengthyTask: function( msg, isLengthy ) {

			// Control the occupied window
			UserInteraction.controlOccupied( isLengthy, msg );

		},

		// Progress feedbacks
		onProgress: function( msg, percent ) {
			self.__fire("progress", [msg, percent]);
		},
		onStarted: function( msg ) {
			self.__fire("started", [msg]);
		},
		onCompleted: function( msg ) {
			self.__fire("completed", [msg]);
		}

	});


};

/**
 * Enumerate the running vitual machines
 * (Available only if the session is privileged)
 */
WebAPIPluginPrototype.enumSessions = function(callback) {
	var self = this;
	if (!callback) return;

	// Send enumSessions
	this.send("enumSessions", { }, {

		// Basic responses
		onSucceed : function( vm_list ) {
			callback(vm_list);
		},
		onFailed: function( msg, code ) {
			callback(null, msg, code);
		}

	});

};

/**
 * Control a session with the given ID
 * (Available only if the session is privileged)
 */
WebAPIPluginPrototype.controlSession = function(session_id, action, callback) {
	var self = this;
	if (!callback) return;

	// Send controlSession
	this.send("controlSession", {
		"session_id" : session_id,
		"action" : action
	}, {

		// Basic responses
		onSucceed : function( vm_list ) {
			callback(vm_list);
		},
		onFailed: function( msg, code ) {
			callback(null, msg, code);
		}

	});

};


/**
 * WebAPI Socket handler
 */
var WebAPISession = function( socket, session_id, init_callback ) {

	// Superclass initialize
	EventDispatcher.call(this);

	// Keep references
	this.socket = socket;
	this.session_id = session_id;

	// Local variables
	this.__state = 0;
	this.__apiState = false;
	this.__properties = {};
	this.__config = {};
	this.__valid = true;

	// The last RDP window
	this.__lastRDPWindow = null;

	// Init handler
	this.__initCallback = init_callback;

    // Connect plugin properties with this object properties using getters/setters
    var u = undefined;
    Object.defineProperties(this, {
        "state"         :   {   get: function () { if (!this.__valid) return u; return this.__state;                 		 } },
        "stateName"     :   {   get: function () { if (!this.__valid) return u; return _stateNameFor(this.__state );  		 } },
        "ip"            :   {   get: function () { if (!this.__valid) return u; return this.__config['ip'];                  } },
        "memory"        :   {   get: function () { if (!this.__valid) return u; return this.__config['memory'];              } },
        "cpus"          :   {   get: function () { if (!this.__valid) return u; return this.__config['cpus'];                } },
        "disk"          :   {   get: function () { if (!this.__valid) return u; return this.__config['disk'];                } },
        "apiURL"        :   {   get: function () { if (!this.__valid) return u; return this.__config['apiURL'];              } },
        "apiAvailable"  :   {   get: function () { if (!this.__valid) return u; return this.__apiState;     		         } },
        "rdpURL"        :   {   get: function () { if (!this.__valid) return u; return this.__config['rdpURL'];              } },
        "executionCap"  :   {   get: function () { if (!this.__valid) return u; return this.__config['executionCap'];          }, 
                                set: function(v) { this.__config['executionCap']=v; this.setAsync('executionCap', v);        } },

        /* Version/DiskURL switching */
        "version"       :     {   get: function () {
                                        if (!this.__valid) return u; 
                                        return this.__config['cernvmVersion'];
                                  },
                                  set: function(v) {
                                        if (!this.__valid) return; 
                                        this.__config['cernvmVersion']=v;
                                        this.setAsync('cernvmVersion', v);
                                  }
                              }, 
        "flavor "       :     {   get: function () {
                                        if (!this.__valid) return u; 
                                        return this.__config['cernvmFlavor'];
                                  },
                                  set: function(v) {
                                        if (!this.__valid) return; 
                                        this.__config['cernvmFlavor']=v;
                                        this.setAsync('cernvmFlavor', v);
                                  }
                              }, 
        "diskURL"       :     {   get: function () {
                                        if (!this.__valid) return u; 
                                        return this.__config['diskURL'];
                                  },
                                  set: function(v) {
                                        if (!this.__valid) return; 
                                        this.__config['diskURL']=v;
                                        this.setAsync('diskURL', v);
                                  }
                              }, 
        "diskChecksum"       :     {   get: function () {
                                        if (!this.__valid) return u; 
                                        return this.__config['diskChecksum'];
                                  },
                                  set: function(v) {
                                        if (!this.__valid) return; 
                                        this.__config['diskChecksum']=v;
                                        this.setAsync('diskChecksum', v);
                                  }
                              }, 
        
        /* A smarter way of accessing flags */
        "flags"         :   {   get: function () {
                                    // Return a smart object with properties that when changed
                                    // they automatically update the session object.
                                    if (!this.__valid) return u; 
                                    return new SessionFlags(this);
                                  },
                                  set: function(v) {
                                    // If the user is setting a number, update the flags object directly
                                    if (typeof(v) == 'number') {
                                        this.__config['flags'] = v;

                                    // Otherwise parse the flags from an object
                                    } else if (typeof(v) == 'object') {
                                        this.__config['flags'] = parseSessionFlags(v);
                                    }
                                  } 
                              }

    });

}

/**
 * Subclass event dispatcher
 */
WebAPISession.prototype = Object.create( EventDispatcher.prototype );

// Hint for minimization
var WebAPISessionPrototype = WebAPISession.prototype;

/**
 * Handle incoming event
 */
WebAPISessionPrototype.handleEvent = function(data) {

	// Take this opportunity to update some of our local cached data
	if (data['name'] == 'stateVariables') {

		// Convert JSON string to object
		data = data['data'];
		if (!data) {
			return; // Invalid
		} else {
			if (data.length >= 1)
				this.__config = data[0] || { };
			if (data.length >= 2)
				this.__properties = data[1] || { };
		}

		// Fire init callback
		if (this.__initCallback) {
			this.__initCallback();
			this.__initCallback = null;
		}

		// Don't forward
		return;

	} else if (data['name'] == 'failure') {

		// Handle serious failures
		var flags = data['data'][0];

		// Check for missing virtualization
		if (flags & F_NO_VIRTUALIZATION != 0) {

			// Display some information to the user
			UserInteraction.alert(
				"Virtualization Failure",
				"<p>The hypervisor was unable to use your hardware's virtualization capabilities. This happens either if you have an old hardware (more than 4 years old) or if the <strong>Virtualization Technology</strong> features is disabled from your <strong>BIOS</strong>.</p>" +
				"<p>There are various articles on the internet on how to enable this option from your BIOS. <a target=\"_blank\" href=\"http://www.sysprobs.com/disable-enable-virtualization-technology-bios\">You can read this article for example.</a></p>"
				);
			
		}

	} else if (data['name'] == 'stateChanged') {

		this.__state = data['data'][0];

	} else if (data['name'] == 'lengthyTask') {

		// Control the occupied window
		UserInteraction.controlOccupied( data['data'][1], data['data'][0] );

	} else if (data['name'] == 'apiStateChanged' ) {

		// Update api state property
		this.__apiState = (data['data'][0] == 1);

	} else if (data['name'] == 'resolutionChanged') {

		// Update resolution in the RDP URL
		if (this.__config["rdpURL"] != undefined) {
			var parts = this.__config["rdpURL"].split("@");

			// Update the RDP URL compnents
			this.__config["rdpURL"] = 
				parts[0] + "@" + 
				data['data'][0] + "x" + data['data'][1] + "x" + data['data'][2];

			// Resize the window
			if (this.__lastRDPWindow) {
				try {

					// Resize the RDP window when host is resized
					this.__lastRDPWindow.resizeTo(
						parseInt( data['data'][0] ),
						parseInt( data['data'][1] )
					);

				} catch (e) {
				}
			}

		}

	}

	// Also fire the raw event
	this.__fire(data['name'], data['data']);
}

WebAPISessionPrototype.start = function( values ) {
	// Send a start message
	if (!this.__valid) return;
	this.socket.send("start", {
		"session_id": this.session_id,
		"parameters": values || { }
	})
}

WebAPISessionPrototype.stop = function() {
	// Send a stop message
	if (!this.__valid) return;
	this.socket.send("stop", {
		"session_id": this.session_id
	})
}

WebAPISessionPrototype.pause = function() {
	// Send a pause message
	if (!this.__valid) return;
	this.socket.send("pause", {
		"session_id": this.session_id
	})
}

WebAPISessionPrototype.resume = function() {
	// Send a resume message
	if (!this.__valid) return;
	this.socket.send("resume", {
		"session_id": this.session_id
	})
}

WebAPISessionPrototype.reset = function() {
	// Send a reset message
	if (!this.__valid) return;
	this.socket.send("reset", {
		"session_id": this.session_id
	})
}

WebAPISessionPrototype.hibernate = function() {
	// Send a hibernate message
	if (!this.__valid) return;
	this.socket.send("hibernate", {
		"session_id": this.session_id
	})
}

WebAPISessionPrototype.close = function() {
	// Send a close message
	this.socket.send("close", {
		"session_id": this.session_id
	});
	// Mark session as invalid
	//this.__valid = false;
}

WebAPISessionPrototype.sync = function() {
	// Send a sync message
	if (!this.__valid) return;
	this.socket.send("sync", {
		"session_id": this.session_id
	})
}

WebAPISessionPrototype.getAsync = function(parameter, cb) {
	// Get a session parameter
	if (!this.__valid) return;
	this.socket.send("get", {
		"session_id": this.session_id,
		"key": parameter
	},{
		onSucceed : function( value ) {
			if (cb) cb(value);
		}
	})
}

WebAPISessionPrototype.setAsync = function(parameter, value, cb) {
	// Update a session parameter
	if (!this.__valid) return;
	this.socket.send("set", {
		"session_id": this.session_id,
		"key": parameter,
		"value": value
	},{
		onSucceed : function() {
			if (cb) cb();
		}
	})
}

/**
 * Return the cached value of the property specified
 */
WebAPISessionPrototype.getProperty = function(name) {
	if (!this.__valid) return;
    if (!name) return "";
    if (this.__properties[name] == undefined) return "";
    return this.__properties[name];
}

/**
 * Update local and remote properties
 */
WebAPISessionPrototype.setProperty = function(name, value) {
	if (!this.__valid) return;
    if (!name) return "";

    // Update cache
    this.__properties[name] = value;

	// Send update event (without feedback)
	this.socket.send("setProperty", {
		"session_id": this.session_id,
		"key": name,
		"value": value
	});

}

WebAPISessionPrototype.openRDPWindow = function(parameter, cb) {
	if (!this.__valid) return;
	var self = this;

	// If we have the rdpURL in proerties, prefer that
	// because it's not going to trigger the pop-up blockers
	if (this.__config['rdpURL']) {

		// Open the RDP window
		var parts = this.__config['rdpURL'].split("@");
		this.__lastRDPWindow = launchRDP( parts[0], parts[1] )

	} else {

		// Otherwise request asynchronously the rdpURL
		this.getAsync("rdpURL", function(info) {
			var parts = info.split("@");
			self.__lastRDPWindow = launchRDP( parts[0], parts[1] )
		});		

	}

}

/**
 * This file is always included last in the build chain. 
 * Here we do the static initialization of the plugin
 */
 
/**
* By default use 'load' handler, unless user has jQuery loaded
*/
if (window['jQuery'] == undefined) {
	if (__pageLoaded) return;
	window.addEventListener('load', function(e) {
	    __pageLoaded = true;
	    for (var i=0; i<__loadHooks.length; i++) {
	        __loadHooks[i]();
	    }
	});
} else {
	jQuery(function(){
		if (__pageLoaded) return;
		__pageLoaded = true;
	    for (var i=0; i<__loadHooks.length; i++) {
	        __loadHooks[i]();
	    }
	});
}

})(window.CVM);
