
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
