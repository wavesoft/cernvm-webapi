/**
 * Constants
 */
var HV_NONE = 0;
var HV_VIRTUALBOX = 1;

var HVE_ALREADY_EXISTS = 2;
var HVE_SCHEDULED = 1;
var HVE_OK = 0;
var HVE_CREATE_ERROR = -1;
var HVE_MODIFY_ERROR = -2;
var HVE_CONTROL_ERROR = -3;
var HVE_DELETE_ERROR = -4;
var HVE_QUERY_ERROR = -5;
var HVE_IO_ERROR = -6;
var HVE_EXTERNAL_ERROR = -7;
var HVE_INVALID_STATE = -8;
var HVE_NOT_FOUND = -9;
var HVE_NOT_ALLOWED = -10;
var HVE_NOT_SUPPORTED = -11;
var HVE_NOT_VALIDATED = -12;
var HVE_NOT_TRUSTED = -13;
var HVE_USAGE_ERROR = -99;
var HVE_NOT_IMPLEMENTED = -100;

var STATE_CLOSED = 0;
var STATE_OPPENING = 1;
var STATE_OPEN = 2;
var STATE_STARTING = 3;
var STATE_STARTED = 4;
var STATE_ERROR = 5;
var STATE_PAUSED = 6;

var HVF_SYSTEM_64BIT = 1; 
var HVF_DEPLOYMENT_HDD = 2; 
var HVF_GUEST_ADDITIONS = 4;
var HVF_FLOPPY_IO = 8;
var HVF_HEADFUL = 16;

var SS_MISSING = 0,
    SS_AVAILABLE = 1,
    SS_POWEROFF = 2,
    SS_SAVED = 3,
    SS_PAUSED = 4,
    SS_RUNNING = 5;

/* Daemon flags */
var DF_SUSPEND = 1;
var DF_AUTOSTART = 2;

/**
 * Convert state to string
 */
function state_string(state) {
    if (state == STATE_CLOSED)      return "Closed";
    if (state == STATE_OPPENING)    return "Oppening";
    if (state == STATE_OPEN)        return "Open";
    if (state == STATE_STARTING)    return "Starting";
    if (state == STATE_STARTED)     return "Started";
    if (state == STATE_ERROR)       return "Error";
    if (state == STATE_PAUSED)      return "Paused";
    return "Unknown state " + state;
};

/**
 * Convert error code to string
 */
function error_string(code) {
    if (code == HVE_ALREADY_EXISTS) return "Already exists";
    if (code == HVE_SCHEDULED) return "Scheduled";
    if (code == HVE_OK) return "No error";
    if (code == HVE_CREATE_ERROR) return "Creation Error";
    if (code == HVE_MODIFY_ERROR) return "Modification Error";
    if (code == HVE_CONTROL_ERROR) return "Control Error";
    if (code == HVE_DELETE_ERROR) return "Deletion Error";
    if (code == HVE_QUERY_ERROR) return "Query Error";
    if (code == HVE_IO_ERROR) return "I/O Error";
    if (code == HVE_EXTERNAL_ERROR) return "Server/Library Error";
    if (code == HVE_INVALID_STATE) return "Invalid state for such action";
    if (code == HVE_NOT_FOUND) return "The requested resource was not found";
    if (code == HVE_NOT_ALLOWED) return "Access denied";
    if (code == HVE_NOT_SUPPORTED) return "The requested action is not supported";
    if (code == HVE_NOT_VALIDATED) return "Unable to validate the resource";
    if (code == HVE_NOT_TRUSTED) return "The domain is not trusted";
    if (code == HVE_USAGE_ERROR) return "Usage error";
    if (code == HVE_NOT_IMPLEMENTED) return "The requested functionality is not implemented";
    return "Unknown error #" + code;
}