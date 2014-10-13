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
 * Helper function to start RDP client using the flash API from CernVM
 */
_NS_.launchRDP = function( rdpURL, resolution ) {

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

    // Open web-RDP client from CernVM
    var w = window.open(
        'http://cernvm.cern.ch/releases/webapi/webrdp/webclient.html#' + rdpURL + ',' + width + ',' + height, 
        'WebRDPClient', 
        'width=' + width + ',height=' + (height+28)
    );

    // Align, center and focus
    w.moveTo( (screen.width - width)/2, (screen.height - (height+28))/2 );
    setTimeout(function() { w.focus() }, 100);
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
				cFrame.src = "http://labs.wavesoft.gr/webapi/install";
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
					instance = new _NS_.WebAPIPlugin();
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

};