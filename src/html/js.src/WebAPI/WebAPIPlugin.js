
/**
 * WebAPI Socket handler
 */
_NS_.WebAPIPlugin = function() {

	// Superclass constructor
	_NS_.Socket.call(this);
}

/**
 * Subclass event dispatcher
 */
_NS_.WebAPIPlugin.prototype = Object.create( _NS_.Socket.prototype );

/**
 * Stop the CernVM WebAPI Service
 */
_NS_.WebAPIPlugin.prototype.stopService = function() {
	this.send("stopService");
}

/**
 * Open a session and call the cbOk when ready
 */
_NS_.WebAPIPlugin.prototype.requestSession = function(vmcp, cbOk, cbFail) {
	var self = this;

	// Send requestSession
	this.send("requestSession", {
		"vmcp": vmcp
	}, {

		// Basic responses
		onSucceed : function( msg, session_id ) {

			// Create a new session object
			var session = new _NS_.WebAPISession( self, session_id, function() {
				
				// Fire the ok callback only when we are initialized
				if (cbOk) cbOk(session);

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
			_NS_.UserInteraction.controlOccupied( isLengthy, msg );

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
_NS_.WebAPIPlugin.prototype.enumSessions = function(callback) {
	var self = this;
	if (!callback) return;

	// Send requestSession
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
_NS_.WebAPIPlugin.prototype.controlSession = function(session_id, action, callback) {
	var self = this;
	if (!callback) return;

	// Send requestSession
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
