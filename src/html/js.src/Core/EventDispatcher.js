
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
