
var EventDispatcher = function(e) {
    this.events = { };
};

/**
 * Fire an event to the registered handlers
 */
EventDispatcher.prototype.__fire = function( name, args ) {
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
EventDispatcher.prototype.addEventListener = function( name, listener ) {
    if (this.events[name] == undefined) this.events[name]=[];
    this.events[name].push( listener );
};

/**
 * Unregister a listener from the given event
 */
EventDispatcher.prototype.removeEventListener = function( name, listener ) {
    if (this.events[name] == undefined) return;
    var i = this.events[name].indexOf(listener);
    if (i<0) return;
    this.events.splice(i,1);
};
