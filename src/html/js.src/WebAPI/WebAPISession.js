
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
 * WebAPI Socket handler
 */
_NS_.WebAPISession = function( socket, session_id, init_callback ) {

	// Superclass initialize
	_NS_.EventDispatcher.call(this);

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
_NS_.WebAPISession.prototype = Object.create( _NS_.EventDispatcher.prototype );

/**
 * Handle incoming event
 */
_NS_.WebAPISession.prototype.handleEvent = function(data) {

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
			_NS_.UserInteraction.alert(
				"Virtualization Failure",
				"<p>The hypervisor was unable to use your hardware's virtualization capabilities. This happens either if you have an old hardware (more than 4 years old) or if the <strong>Virtualization Technology</strong> features is disabled from your <strong>BIOS</strong>.</p>" +
				"<p>There are various articles on the internet on how to enable this option from your BIOS. <a target=\"_blank\" href=\"http://www.sysprobs.com/disable-enable-virtualization-technology-bios\">You can read this article for example.</a></p>"
				);
			
		}

	} else if (data['name'] == 'stateChanged') {

		this.__state = data['data'][0];

	} else if (data['name'] == 'lengthyTask') {

		// Control the occupied window
		_NS_.UserInteraction.controlOccupied( data['data'][1], data['data'][0] );

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

_NS_.WebAPISession.prototype.start = function( values ) {
	// Send a start message
	this.socket.send("start", {
		"session_id": this.session_id,
		"parameters": values || { }
	})
}

_NS_.WebAPISession.prototype.stop = function() {
	// Send a stop message
	this.socket.send("stop", {
		"session_id": this.session_id
	})
}

_NS_.WebAPISession.prototype.pause = function() {
	// Send a pause message
	this.socket.send("pause", {
		"session_id": this.session_id
	})
}

_NS_.WebAPISession.prototype.resume = function() {
	// Send a resume message
	this.socket.send("resume", {
		"session_id": this.session_id
	})
}

_NS_.WebAPISession.prototype.reset = function() {
	// Send a reset message
	this.socket.send("reset", {
		"session_id": this.session_id
	})
}

_NS_.WebAPISession.prototype.hibernate = function() {
	// Send a hibernate message
	this.socket.send("hibernate", {
		"session_id": this.session_id
	})
}

_NS_.WebAPISession.prototype.close = function() {
	// Send a close message
	this.socket.send("close", {
		"session_id": this.session_id
	})
}

_NS_.WebAPISession.prototype.getAsync = function(parameter, cb) {
	// Get a session parameter
	this.socket.send("get", {
		"session_id": this.session_id,
		"key": parameter
	},{
		onSucceed : function( value ) {
			if (cb) cb(value);
		}
	})
}

_NS_.WebAPISession.prototype.setAsync = function(parameter, value, cb) {
	// Update a session parameter
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
_NS_.WebAPISession.prototype.getProperty = function(name) {
    if (!name) return "";
    if (this.__properties[name] == undefined) return "";
    return this.__properties[name];
}

/**
 * Update local and remote properties
 */
_NS_.WebAPISession.prototype.setProperty = function(name, value) {
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

_NS_.WebAPISession.prototype.openRDPWindow = function(parameter, cb) {
	var self = this;

	// If we have the rdpURL in proerties, prefer that
	// because it's not going to trigger the pop-up blockers
	if (this.__config['rdpURL']) {

		// Open the RDP window
		var parts = this.__config['rdpURL'].split("@");
		this.__lastRDPWindow = _NS_.launchRDP( parts[0], parts[1] )

	} else {

		// Otherwise request asynchronously the rdpURL
		this.getAsync("rdpURL", function(info) {
			var parts = info.split("@");
			self.__lastRDPWindow = _NS_.launchRDP( parts[0], parts[1] )
		});		

	}

}
