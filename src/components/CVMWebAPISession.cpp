/**
 * This file is part of CernVM Web API Plugin.
 *
 * CVMWebAPI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * CVMWebAPI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CVMWebAPI. If not, see <http://www.gnu.org/licenses/>.
 *
 * Developed by Ioannis Charalampidis 2013
 * Contact: <ioannis.charalampidis[at]cern.ch>
 */

// Everything is included in daemon.h
// (Including cross-referencing)
#include "daemon.h"

/**
 * Handle session commands
 */
void CVMWebAPISession::handleAction( CVMCallbackFw& cb, const std::string& action, ParameterMapPtr parameters ) {
	int ret;
	if (action == "start") {

		ParameterMapPtr startParm = parameters->subgroup("parameters");
		ret = hvSession->start( startParm );
		if (ret != HVE_OK) {
	        cb.fire("failed", ArgumentList( "Unable to start session" )( ret ) );
		} else {
	        cb.fire("succeed", ArgumentList("Session started successfully"));
		}

	} else if (action == "stop") {
        
		ret = hvSession->stop();
		if (ret != HVE_OK) {
	        cb.fire("failed", ArgumentList( "Unable to stop session" )( ret ) );
		} else {
	        cb.fire("succeed", ArgumentList("Session stopped successfully"));
		}

	} else if (action == "pause") {
        
		ret = hvSession->pause();
		if (ret != HVE_OK) {
	        cb.fire("failed", ArgumentList( "Unable to pause session" )( ret ) );
		} else {
	        cb.fire("succeed", ArgumentList("Session paused successfully"));
		}

	} else if (action == "resume") {
        
		ret = hvSession->resume();
		if (ret != HVE_OK) {
	        cb.fire("failed", ArgumentList( "Unable to resume session" )( ret ) );
		} else {
	        cb.fire("succeed", ArgumentList("Session resumed successfully"));
		}

	} else if (action == "hibernate") {
        
		ret = hvSession->hibernate();
		if (ret != HVE_OK) {
	        cb.fire("failed", ArgumentList( "Unable to hibernate session" )( ret ) );
		} else {
	        cb.fire("succeed", ArgumentList("Session hibernated successfully"));
		}

	} else if (action == "reset") {
        
		ret = hvSession->reset();
		if (ret != HVE_OK) {
	        cb.fire("failed", ArgumentList( "Unable to reset session" )( ret ) );
		} else {
	        cb.fire("succeed", ArgumentList("Session reseted successfully"));
		}

	} else if (action == "close") {
        
		ret = hvSession->close();
		if (ret != HVE_OK) {
	        cb.fire("failed", ArgumentList( "Unable to close session" )( ret ) );
		} else {
	        cb.fire("succeed", ArgumentList("Session closed successfully"));
		}

	} else if (action == "get") {
		std::string keyName = parameters->get("key", ""),
					keyValue = "";

		// Reply only to known key values
		if (keyName == "apiURL") {
			// Calculate the API URL
			std::string host = hvSession->local->get("apiHost",""),
						port = hvSession->local->get("apiPort", "");
			keyValue = "http://" + host + ":" + port + "/";

		} else if (keyName == "rdpURL") {
			// Calculate the VRDE path:port
			std::string resolution = hvSession->getExtraInfo(EXIF_VIDEO_MODE);
			keyValue = hvSession->getRDPAddress() + "@" + resolution;

		} else if (keyName == "cpus") {
			keyValue = hvSession->parameters->get("cpus", "1");
        } else if (keyName == "disk") {
			keyValue = hvSession->parameters->get("disk", "1024");
		} else if (keyName == "ram") {
			keyValue = hvSession->parameters->get("ram", "512");
		} else if (keyName == "cernvmVersion") {
			keyValue = hvSession->parameters->get("cernvmVersion", "1.17-8");
		} else if (keyName == "cernvmFlavor") {
			keyValue = hvSession->parameters->get("cernvmFlavor", "prod");
		} else if (keyName == "executionCap") {
			keyValue = hvSession->parameters->get("executionCap", "prod");
		} else if (keyName == "flags") {
			keyValue = hvSession->parameters->get("flags", "0");

		}

		// Return value
        cb.fire("succeed", ArgumentList(keyValue));

	} else if (action == "set") {
        
        hvSession->parameters->get("");
        
	}
}

/**
 * Handle timed event
 */
void CVMWebAPISession::processPeriodicJobs() {
	if (periodicsRunning) return;
	boost::thread( boost::bind( &CVMWebAPISession::periodicJobsThread, this ) );
}

/**
 * Handle timed event
 */
void CVMWebAPISession::periodicJobsThread() {

	// Mark the thread as running
	periodicsRunning = true;

	// Synchronize session state with VirtualBox (or file)
	CVMWA_LOG("Debug", "Syncing session");
	hvSession->update(false);

	// Check for API port state
    int sessionState = hvSession->local->getNum<int>("state", 0);
    std::string apiHost = hvSession->local->get("apiHost", "127.0.0.1");
    std::string apiPort = hvSession->local->get("apiPort", "80");
    std::string apiURL = "http://" + apiHost + ":" + apiPort;

	CVMWA_LOG("Debug", "Session state: " << sessionState);
    if (sessionState == SS_RUNNING) {
    	if (!apiPortOnline) {

    		// Check if API port has gone online
    		bool newState = hvSession->isAPIAlive();
    		if (newState) {
	    		connection.sendEvent( "apiStateChanged", ArgumentList(true)(apiURL) );
    			apiPortOnline = true;
    		}

    	} else {

    		// Still check for API port going offline
    		if (++apiPortCounter > 10) {

    			// Check for offline port
	    		if (!hvSession->isAPIAlive()) {
		    		connection.sendEvent( "apiStateChanged", ArgumentList(false)(apiURL) );
	    			apiPortOnline = true;
	    		}

	    		// Reset counter
	    		apiPortCounter=0;
    		}

    	}
    } else {
    	if (apiPortOnline) {
    		// In any other state, the port is just offline
    		connection.sendEvent( "apiStateChanged", ArgumentList(false)(apiURL) );
    		apiPortOnline = false;
    	}
    }

    // Mark the thread as completed
    periodicsRunning = false;

}

/**
 * Handle state changed events and forward them if needed to the UI
 */
void CVMWebAPISession::__cbStateChanged( VariantArgList& args ) {
	connection.sendEvent( "stateChanged", args, uuid_str );

	// Check if we switched to a state where API is not available any more
	int sessionState = boost::get<int>(args[0]);
    std::string apiHost = hvSession->local->get("apiHost", "127.0.0.1");
    std::string apiPort = hvSession->local->get("apiPort", "80");
    std::string apiURL = "http://" + apiHost + ":" + apiPort;

	if ((sessionState != SS_RUNNING) && apiPortOnline) {
		// In any other state, the port is just offline
		connection.sendEvent( "apiStateChanged", ArgumentList(false)(apiURL) );
		apiPortOnline = false;
	}

}

