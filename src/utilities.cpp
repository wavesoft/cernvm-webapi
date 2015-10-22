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

#include "utilities.h"

/**
 * Compile and return a Json::Value with all the state information
 * for the given session
 */
Json::Value sessionStateInfoToJSON( HVSessionPtr hvSession ) {
	CRASH_REPORT_BEGIN;
	Json::Value data, properties, config;

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

	// Get hypervisor version
	int hvType = hvSession->hypervisor->getType();
	config["hypervisor"] = "unknown";
	if (hvType == HV_NONE) {
		config["hypervisor"] = "none";
	} else if (hvType == HV_VIRTUALBOX) {
		config["hypervisor"] = "virtualbox-" + hvSession->hypervisor->version.verString;
	}

	// Update data field
	data.append(config);
	data.append(properties);

	// Return data
	return data;
	CRASH_REPORT_END;
}
