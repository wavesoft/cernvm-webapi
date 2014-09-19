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
	CRASH_REPORT_BEGIN;
	int ret;

	//////////////////////////////////
	if (action == "start") {
	//////////////////////////////////

		ret = hvSession->start( parameters );
		if (ret == HVE_SCHEDULED) {
	        cb.fire("succeed", ArgumentList("Session will start promptly"));
		} else if (ret == HVE_OK) {
	        cb.fire("succeed", ArgumentList("Session started successfully"));
		} else {
	        cb.fire("failed", ArgumentList( "Unable to start session" )( ret ) );
		}

		// Send state variables in case they were modified by hypervisor code
		sendStateVariables();

	//////////////////////////////////
	} else if (action == "stop") {
	//////////////////////////////////
        
		ret = hvSession->stop();
		if (ret == HVE_SCHEDULED) {
	        cb.fire("succeed", ArgumentList("Session will stop promptly"));
		} else if (ret == HVE_OK) {
	        cb.fire("succeed", ArgumentList("Session stoped successfully"));
		} else {
	        cb.fire("failed", ArgumentList( "Unable to stop session" )( ret ) );
		}

		// Send state variables in case they were modified by hypervisor code
		sendStateVariables();

	//////////////////////////////////
	} else if (action == "pause") {
	//////////////////////////////////
        
		ret = hvSession->pause();
		if (ret == HVE_SCHEDULED) {
	        cb.fire("succeed", ArgumentList("Session will pause promptly"));
		} else if (ret == HVE_OK) {
	        cb.fire("succeed", ArgumentList("Session paused successfully"));
		} else {
	        cb.fire("failed", ArgumentList( "Unable to pause session" )( ret ) );
		}

		// Send state variables in case they were modified by hypervisor code
		sendStateVariables();

	//////////////////////////////////
	} else if (action == "resume") {
	//////////////////////////////////
        
		ret = hvSession->resume();
		if (ret == HVE_SCHEDULED) {
	        cb.fire("succeed", ArgumentList("Session will resume promptly"));
		} else if (ret == HVE_OK) {
	        cb.fire("succeed", ArgumentList("Session resumed successfully"));
		} else {
	        cb.fire("failed", ArgumentList( "Unable to resume session" )( ret ) );
		}

		// Send state variables in case they were modified by hypervisor code
		sendStateVariables();

	//////////////////////////////////
	} else if (action == "hibernate") {
	//////////////////////////////////
        
		ret = hvSession->hibernate();
		if (ret == HVE_SCHEDULED) {
	        cb.fire("succeed", ArgumentList("Session will hibernate promptly"));
		} else if (ret == HVE_OK) {
	        cb.fire("succeed", ArgumentList("Session hibernated successfully"));
		} else {
	        cb.fire("failed", ArgumentList( "Unable to hibernate session" )( ret ) );
		}

		// Send state variables in case they were modified by hypervisor code
		sendStateVariables();

	//////////////////////////////////
	} else if (action == "reset") {
	//////////////////////////////////
        
		ret = hvSession->reset();
		if (ret == HVE_SCHEDULED) {
	        cb.fire("succeed", ArgumentList("Session will reset promptly"));
		} else if (ret == HVE_OK) {
	        cb.fire("succeed", ArgumentList("Session resetd successfully"));
		} else {
	        cb.fire("failed", ArgumentList( "Unable to reset session" )( ret ) );
		}

		// Send state variables in case they were modified by hypervisor code
		sendStateVariables();

	//////////////////////////////////
	} else if (action == "close") {
	//////////////////////////////////
        
		ret = hvSession->close();
		if (ret == HVE_SCHEDULED) {
	        cb.fire("succeed", ArgumentList("Session will close promptly"));
		} else if (ret == HVE_OK) {
	        cb.fire("succeed", ArgumentList("Session closed successfully"));
		} else {
	        cb.fire("failed", ArgumentList( "Unable to close session" )( ret ) );
		}

		// Send state variables in case they were modified by hypervisor code
		sendStateVariables();

	//////////////////////////////////
	} else if (action == "get") {
	//////////////////////////////////

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

        } else if (keyName == "ip") {
			keyValue = hvSession->parameters->get("ip", "");
		} else if (keyName == "cpus") {
			keyValue = hvSession->parameters->get("cpus", "1");
        } else if (keyName == "disk") {
			keyValue = hvSession->parameters->get("disk", "1024");
		} else if (keyName == "memory") {
			keyValue = hvSession->parameters->get("memory", "512");
		} else if (keyName == "cernvmVersion") {
			keyValue = hvSession->parameters->get("cernvmVersion", "1.17-11");
		} else if (keyName == "cernvmFlavor") {
			keyValue = hvSession->parameters->get("cernvmFlavor", "prod");
		} else if (keyName == "executionCap") {
			keyValue = hvSession->parameters->get("executionCap", "prod");
		} else if (keyName == "flags") {
			keyValue = hvSession->parameters->get("flags", "0");

		}

		// Return value
        cb.fire("succeed", ArgumentList(keyValue));

	//////////////////////////////////
	} else if (action == "set") {
	//////////////////////////////////

		std::string keyName = parameters->get("key", ""),
					keyValue = parameters->get("value", "");

		// Update only particular variables
		if (keyName == "cpus") {
			hvSession->parameters->set("cpus", keyValue);
        } else if (keyName == "disk") {
			hvSession->parameters->set("disk", keyValue);
		} else if (keyName == "memory") {
			hvSession->parameters->set("memory", keyValue);
		} else if (keyName == "cernvmVersion") {
			hvSession->parameters->set("cernvmVersion", keyValue);
		} else if (keyName == "cernvmFlavor") {
			hvSession->parameters->set("cernvmFlavor", keyValue);
		} else if (keyName == "executionCap") {
			hvSession->parameters->set("executionCap", keyValue);

			// Try to apply execution cap right-away
			hvSession->setExecutionCap( ston<int>(keyValue) );

		} else if (keyName == "flags") {
			hvSession->parameters->set("flags", keyValue);
		}

		// Notify success
        cb.fire("succeed", ArgumentList(1));

	//////////////////////////////////
	} else if (action == "setProperty") {
	//////////////////////////////////

		ParameterMapPtr properties = hvSession->parameters->subgroup("properties");
		std::string keyName = parameters->get("key", ""),
					keyValue = parameters->get("value", "");

		// Update property
		properties->set(keyName, keyValue);

		// Notify success
        cb.fire("succeed", ArgumentList(1));

	}
	CRASH_REPORT_END;
}

/**
 * Enable or disable periodic jobs
 */
void CVMWebAPISession::enablePeriodicJobs( bool status ) {
	acceptPeriodicJobs = status;
}

/**
 * Handle timed event
 */
void CVMWebAPISession::processPeriodicJobs() {
	CRASH_REPORT_BEGIN;
	if (!acceptPeriodicJobs) return;
	if (periodicsRunning) return;

	// Delete previous thread instance
	if (periodicJobsThreadPtr != NULL)
		delete periodicJobsThreadPtr;

	// Create new periodic jobs thread
	periodicJobsThreadPtr = new boost::thread( boost::bind( &CVMWebAPISession::periodicJobsThread, this ) );

	CRASH_REPORT_END;
}

/**
 * Handle timed event
 */
void CVMWebAPISession::periodicJobsThread() {
	CRASH_REPORT_BEGIN;
	try {

		// Mark the thread as running
		periodicsRunning = true;

		// Synchronize session state with VirtualBox (or file)
		hvSession->update(false);

		// Check for API port state
	    int sessionState = hvSession->local->getNum<int>("state", 0);
	    std::string apiHost = hvSession->local->get("apiHost", "127.0.0.1");
	    std::string apiPort = hvSession->local->get("apiPort", "80");
	    std::string apiURL = "http://" + apiHost + ":" + apiPort;

	    if (sessionState == SS_RUNNING) {
	    	if (!apiPortOnline) {

	    		// Check if API port has gone online
	    		bool newState = hvSession->isAPIAlive(HSK_HTTP, 1);
	    		if (newState) {
		    		connection.sendEvent( "apiStateChanged", ArgumentList(true)(apiURL), uuid_str );
	    			apiPortOnline = true;
	    		}

	    	} else {

	    		// Still check for API port going offline
	    		if (++apiPortCounter > 10) {

	    			// Check for offline port
		    		if (!hvSession->isAPIAlive(HSK_HTTP, 10)) {
			    		connection.sendEvent( "apiStateChanged", ArgumentList(false)(apiURL), uuid_str );
		    			apiPortOnline = false;
		    		} else {
		    		}

		    		// Reset counter
		    		apiPortCounter=0;
	    		}

	    	}
	    } else {
	    	if (apiPortOnline) {
	    		// In any other state, the port is just offline
	    		connection.sendEvent( "apiStateChanged", ArgumentList(false)(apiURL), uuid_str );
	    		apiPortOnline = false;
	    	}
	    }

	    // Mark the thread as completed
	    periodicsRunning = false;

	} catch (boost::thread_interrupted &e) {
		
		// We are interrupted
		periodicsRunning = false;

	}

	CRASH_REPORT_END;
}

/**
 * A failure occured on hypervisor
 */
void CVMWebAPISession::__cbFailure( VariantArgList& args ) {
	CRASH_REPORT_BEGIN;

	// Check if we switched to a state where API is not available any more
	int failureFlags = boost::get<int>(args[0]);

	// Forward the failure to the UI
	connection.sendEvent( "failure", args, uuid_str );

	// Poweroff the vm in particular cases
	if ( (failureFlags & HFL_NO_VIRTUALIZATION != 0) ) {
		hvSession->stop();
	}

	CRASH_REPORT_END;
}

/**
 * Handle state changed events and forward them if needed to the UI
 */
void CVMWebAPISession::__cbStateChanged( VariantArgList& args ) {
	CRASH_REPORT_BEGIN;

	// Before sending stateChanged, send the updated state variables
	sendStateVariables();
	connection.sendEvent( "stateChanged", args, uuid_str );

	// Check if we switched to a state where API is not available any more
	int sessionState = boost::get<int>(args[0]);
    std::string apiHost = hvSession->local->get("apiHost", "127.0.0.1");
    std::string apiPort = hvSession->local->get("apiPort", "80");
    std::string apiURL = "http://" + apiHost + ":" + apiPort;

	if ((sessionState != SS_RUNNING) && apiPortOnline) {
		// In any other state, the port is just offline
		connection.sendEvent( "apiStateChanged", ArgumentList(false)(apiURL), uuid_str );
		apiPortOnline = false;
	}

	CRASH_REPORT_END;
}

/**
 * Handle resolution change
 */
void CVMWebAPISession::__cbResolutionChanged( VariantArgList& args ) {
	CRASH_REPORT_BEGIN;

	// Get resolution information
	int width = boost::get<int>(args[0]),
		height = boost::get<int>(args[1]),
		bpp = boost::get<int>(args[2]);

	// Send state variables
	connection.sendEvent( "resolutionChanged", ArgumentList(width)(height)(bpp), uuid_str );

	CRASH_REPORT_END;
}


/**
 * Compile and send all the required properties to the
 * remote endpoint. 
 */
void CVMWebAPISession::sendStateVariables() {
	CRASH_REPORT_BEGIN;

	Json::FastWriter writer;
	Json::Value root, data, properties, config;

	// Populate core protocol fields
	root["type"] = "event";
	root["name"] = "stateVariables";
	root["id"] = uuid_str;

	// --- Populate properties field ---

    std::vector<std::string> propKeys = hvSession->properties->enumKeys();
    for ( std::vector<std::string>::iterator it = propKeys.begin(); it != propKeys.end(); ++it ) {
    	std::string k = *it;
        properties[k] = hvSession->properties->get(k, "");
  	}

  	// --- Populate config field ---

	// Calculate api URL
    std::string apiHost = hvSession->local->get("apiHost", "127.0.0.1");
    std::string apiPort = hvSession->local->get("apiPort", "80");
    std::string apiURL = "http://" + apiHost + ":" + apiPort;
    config["apiURL"] = apiURL;

    // Calculate RDP URl
	std::string resolution = hvSession->getExtraInfo(EXIF_VIDEO_MODE);
	config["rdpURL"] = hvSession->getRDPAddress() + "@" + resolution;

	// Return only particular configuration variables
	config["ip"] = hvSession->parameters->get("ip", "");
	config["cpus"] = hvSession->parameters->getNum<int>("cpus", 1);
	config["disk"] = hvSession->parameters->getNum<int>("disk", 1024);
	config["memory"] = hvSession->parameters->getNum<int>("memory", 512);
	config["cernvmVersion"] = hvSession->parameters->get("cernvmVersion", "1.17-11");
	config["cernvmFlavor"] = hvSession->parameters->get("cernvmFlavor", "prod");
	config["executionCap"] = hvSession->parameters->getNum<int>("executionCap", 100);
	config["flags"] = hvSession->parameters->getNum<int>("flags", 0);


	// Update data field
	data.append(config);
	data.append(properties);
	root["data"] = data;

	// Send JSON response
	connection.sendRawData( writer.write(root) );

	CRASH_REPORT_END;
}
