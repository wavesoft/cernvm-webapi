
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
