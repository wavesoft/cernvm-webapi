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

#include <cstdlib>
#include <openssl/rand.h>
#include <boost/make_shared.hpp>
 
#include <CernVM/Utilities.h>
#include <CernVM/CrashReport.h>

/**
 * Initialize daemon code
 */
DaemonCore::DaemonCore(): authKeys(), sessions(), keystore(), config(), installInProgress(false) {
    CRASH_REPORT_BEGIN;

	// Initialize local config
    config = LocalConfig::global();

	// Detect and instantiate hypervisor
	hypervisor = detectHypervisor();
    if (hypervisor) {

        // Load stored sessions
        hypervisor->loadSessions();

    }

    // Initialize download provider
    downloadProvider = DownloadProvider::Default();

	// The daemon is running
	running = true;

    CRASH_REPORT_END;
}

/**
 * Check if daemon has exited
 */
bool DaemonCore::hasExited() {
    CRASH_REPORT_BEGIN;
	return !running;
    CRASH_REPORT_END;
}


/**
 * Check if a hypervisor was detected
 */
bool DaemonCore::hasHypervisor() {
    CRASH_REPORT_BEGIN;
    return (hypervisor->getType() != HV_NONE);
    CRASH_REPORT_END;
};

/**
 * Check for hypervisor if it was not installed
 */
void DaemonCore::syncHypervisorReflection() {
    CRASH_REPORT_BEGIN;
    // If things look good, check if they are not any more
    if (hypervisor && (hypervisor->getType() != HV_NONE)) {
        // Check instance integrity
        if (!hypervisor->validateIntegrity()) {

            // Hypervisor has gone away. Let all sessions know and dispose...
            for (std::map<int, CVMWebAPISession* >::iterator it = sessions.begin(); it != sessions.end(); ++it) {
                CVMWebAPISession * session = (*it).second;

                // Let session know that a hypervisor is uninstalled
                session->sendFailure("Hypervisor was uninstalled");

                // Disconnect socket
                session->connection.disconnect();

                // Dispose
                session->abort();
                delete session;
            }
                
            // Remove all sessions
            sessions.clear();

            // Release hypervisor pointer
            hypervisor = NULL;

        }
    } else {
        // Detect hypervisor
        hypervisor = detectHypervisor();
    }
    CRASH_REPORT_END;
};

/**
 * Return the hypervisor name
 */
std::string DaemonCore::get_hv_name() {
    CRASH_REPORT_BEGIN;
    if (!hypervisor) {
        return "";
    } else {
        if (hypervisor->getType() == HV_VIRTUALBOX) {
            return "virtualbox";
        } else {
            return "unknown";
        }
    }
    CRASH_REPORT_END;
}

/**
 * Return hypervisor version
 */
std::string DaemonCore::get_hv_version() {
    CRASH_REPORT_BEGIN;
    if (!hypervisor) {
        return "";
    } else {
        return hypervisor->version.verString;
    }
    CRASH_REPORT_END;
}

/**
 * Allocate new authenticatino key
 */
std::string DaemonCore::newAuthKey() {
    CRASH_REPORT_BEGIN;
	AuthKey key;

	// The key lasts 5 minutes
	key.expireTime = getMillis() + 300000;
	// Allocate new UUID
	key.key = newGUID();
	// Store on list
	authKeys.push_back( key );

	// Return the key
	return key.key;

    CRASH_REPORT_END;
}

/**
 * Validate authentication key
 */
bool DaemonCore::authKeyValid( const std::string& key ) {
    CRASH_REPORT_BEGIN;

    // If we are empty, forget about it
    if (authKeys.empty()) {
        return false;
    }
    
	// Expire past keys
	bool found = false;
	unsigned long ts = getMillis();
	for (std::list< AuthKey >::iterator it = authKeys.begin(); it != authKeys.end(); ++it) {
		AuthKey k = *it;
		if (ts >= k.expireTime) {
			it = authKeys.erase(it);
            if (authKeys.empty())
                break;
		} else if (k.key == key) {
			found = true;
		}
	}

	// Check if we found it
	return found;

    CRASH_REPORT_END;
}

/**
 * Calculate the domain ID using user's unique ID plus the domain name
 * specified.
 */
std::string DaemonCore::calculateHostID( std::string& domain ) {
    CRASH_REPORT_BEGIN;
    
    /* Fetch/Generate user UUID */
    std::string machineID = config->get("local-id");
    if (machineID.empty()) {
        machineID = keystore.generateSalt();
        config->set("local-id", machineID);
    }

    /* When we use the local-id, update the crash-reporting utility config */
    crashReportAddInfo("Machine UUID", machineID);
    
    /* Create a checksum of the user ID + domain and use this as HostID */
    std::string checksum = "";
    sha256_buffer( machineID + "|" + domain, &checksum );
    return checksum;

    CRASH_REPORT_END;
}

/**
 * Store the given session and return it's unique ID
 */
CVMWebAPISession* DaemonCore::storeSession( DaemonConnection& connection, HVSessionPtr hvSession ) {
    CRASH_REPORT_BEGIN;

    // Create a random int that does not exist in the sessions
    int uuid;
    while (true) {
        
        // Create a positive random number
        RAND_bytes( (unsigned char*)&uuid, 4 );
        uuid = abs(uuid);

        // Make sure we have no collisions
        if (sessions.find(uuid) == sessions.end())
            break;
            
    }

    // Create CVMWebAPISession wrapper and store it on sessionss
    CVMWebAPISession * cvmSession = new CVMWebAPISession( this, connection, hvSession, uuid );
    sessions[uuid] = cvmSession;

    // Return session
    return cvmSession;

    CRASH_REPORT_END;
}

/**
 * Unregister all sessions launched from the given connection
 */
void DaemonCore::releaseConnectionSessions( DaemonConnection& connection ) {
    CRASH_REPORT_BEGIN;
    CVMWA_LOG("Debug", "Releasing connection sessions");
    std::map<int, CVMWebAPISession* >::iterator it = sessions.begin();
    for (; it != sessions.end(); ++it) {
        CVMWebAPISession* sess = (*it).second;
        if (&sess->connection == &connection) {

            // Dispose
            sess->abort();
            delete sess;
            
            // Remove from list
            sessions.erase( it );

            // And break if we are done
            if (sessions.empty()) break;
            
            // Rewind iterator
            it = sessions.begin();

        }
    }

    CRASH_REPORT_END;
}

/**
 * Forward the tick event to all of the child nodes
 */
void DaemonCore::processPeriodicJobs() {
    CRASH_REPORT_BEGIN;
    for (std::map<int, CVMWebAPISession* >::iterator it = sessions.begin(); it != sessions.end(); ++it) {
        CVMWebAPISession* sess = (*it).second;
        sess->processPeriodicJobs();
    }   
    CRASH_REPORT_END;
}


/**
 * Start shutdown cleanups
 */
void DaemonCore::shutdownCleanup() {
    CRASH_REPORT_BEGIN;
    downloadProvider->abortAll();
    CRASH_REPORT_END;
}
