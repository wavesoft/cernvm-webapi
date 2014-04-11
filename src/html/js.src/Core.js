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
		instance.connect(function( hasAPI ) {
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
				var infiniteTimer;
				infiniteTimer = setInterval(function() {
					instance.connect(function(hasAPI) {

						// Check if we have API
						if (hasAPI) {
							clearInterval(infiniteTimer);
							cbOK( instance );
						}

					});
				}, 5000);

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