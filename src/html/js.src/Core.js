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
_NS_.version = '1.0'

/**
 * Let CVMWeb that the page is loaded (don't register page loaded)
 */
_NS_.markPageLoaded = function() {
    __pageLoaded = true;
};


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
		var instance = new _NS_.WebAPIPlugin();

		// Connect and wait for status
		var ignoreCallbacks = true;
		instance.connect(function( hasAPI ) {
			if (!ignoreCallbacks) return;
			if (hasAPI) {

				// We do have an API and we have a connection,
				// there will be more progress events.
				cbOK( instance );

			} else {

				// There is no API, ask the user to install the plug-in
				var cFrame = document.createElement('iframe');
				cFrame.src = "//cernvm-online.cern.ch";
				cFrame.width = "100%";
				cFrame.height = 400;
				cFrame.frameBorder = 0;

				// Show frame
				UserInteraction.createFramedWindow( cFrame );

				// Wait until the application is installed
				var schedule_timer = 0, recheck,
					schedule_recheck = function() {
						if (schedule_timer != 0) clearTimeout(schedule_timer);
						schedule_timer = setTimeout(recheck, 5000);
					};
					recheck = function() {
						instance.connect(function(hasAPI) {
							// Check if we have API
							alert("Bah:" + hasAPI);
							if (hasAPI) {
								clearTimeout(schedule_timer);
								cbOK( instance );
							} else {
								schedule_recheck();
							}
						});
					};

				// Ignore callbacks that are triggered from
				ignoreCallbacks = true;

				// Schedule first re-check
				schedule_recheck();

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

};