
/**
 * WebAPI Socket handler
 */
_NS_.WebAPISession = function( socket, session_id ) {

	// Superclass initialize
	_NS_.EventDispatcher.call(this);

	// Keep references
	this.socket = socket;
	this.session_id = session_id;

    var u = undefined;
    Object.defineProperties(this, {
        "state"         :   {   get: function () { return u; } },
        "stateName"     :   {   get: function () { return u; } },
        "ip"            :   {   get: function () { return u; } },
        "ram"           :   {   get: function () { return u; } },
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

_NS_.WebAPISession.prototype.get = function(parameter, cb) {
	// Send a close message
	this.socket.send("get", {
		"session_id": this.session_id,
		"key": parameter
	},{
		onSucceed : function( value ) {
			cb(value);
		}
	})
}

_NS_.WebAPISession.prototype.openRDPWindow = function(parameter, cb) {
	this.get("rdpURL", function(info) {
		var parts = info.split("@");
		_NS_.launchRDP( parts[0], parts[1] )
	});
}
