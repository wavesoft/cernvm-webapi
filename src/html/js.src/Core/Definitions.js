/**
 * Constants
 */
var HV_NONE = 0;
var HV_VIRTUALBOX = 1;

/**
 * Websocket configuration
 */
var WS_ENDPOINT = "ws://127.0.0.1:5624",
    WS_URI = "cernvm-webapi://launch";

/**
 * Session bit flags
 */
var HVF_SYSTEM_64BIT = 1,
    HVF_DEPLOYMENT_HDD = 2,
    HVF_GUEST_ADDITIONS = 4,
    HVF_FLOPPY_IO = 8,
    HVF_HEADFUL = 16;

/**
 * Flags for the UserInteraction
 */
var UI_OK           = 0x01,
    UI_CANCEL       = 0x02,
    UI_NOTAGAIN     = 0x100;

/**
 * Critical failures
 */
var F_NO_VIRTUALIZATION = 1;

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
 * The unique iframe element ID for the launcher
 */
var DOM_ELEMENT_ID = 'cernvm-webapi-launcher-'+(Math.random().toString().substr(2));
