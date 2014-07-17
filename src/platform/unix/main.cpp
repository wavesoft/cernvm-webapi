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

#include <stdlib.h>
#include <string.h>
#include <cernvm/CrashReport.h>

// Webserver
#include <web/webserver.h>

// Daemon components
#include <daemon.h>

// Daemon core component
DaemonCore *		core;
// Create a factory that manages the daemon sessions
DaemonFactory *	    factory;
// Create a webserver that serves with the daemon factory
CVMWebserver *		webserver;

/**
 * Open authenticated URL
 */
void openAuthenticatedURL()
{
  // Request a new auth token
  std::string authToken = core->newAuthKey();

  // Build URL
  std::ostringstream oss;
  oss << "http://127.0.0.1:5624/control.html#" << authToken;

  // Get URL string
  std::string url = oss.str();
  ShellExecute(NULL,"open", url.c_str(), NULL, NULL, SW_SHOWNORMAL);

}

/**
 * Entry point for the CernVM Web Daemon
 */
int main( int argc, char ** argv ) {
#ifdef CRASH_REPORTING
    crashReportInit();
#endif
    initSysExec();
    DomainKeystore::Initialize();

    // Create the C++ daemon core
    core = new DaemonCore();
    // Create a factory which is going to create the instances
    factory = new DaemonFactory(*core);
    // Create the webserver instance
    webserver = new CVMWebserver(*factory);

    // Check if we should launch a URL
    bool launchURL = (argc <= 1);

    // Start server
    long lastIdle = getMillis();
    long lastCronTime = lastIdle;
    while (!core->hasExited()) {
        long now = getMillis();
        webserver->poll();

        // Update idle timer when we have connections
        if (webserver->hasLiveConnections()) {
            lastIdle = now;
        }

        // Exit if we are idle for 10 seconds
        else if (now - lastIdle > 10000) {
            break;
        }

        // If we have to launch a URL, do it after the first poll
        if (launchURL) {
            openAuthenticatedURL();
            launchURL = false;
        }

        // Check and forward cron jobs
        if (now > lastCronTime) {
            core->processPeriodicJobs();
            lastCronTime = now + 1000;
        }

    }

    // Start core cleanups
    core->shutdownCleanup();

    // Abory any lingering sysExec commands
    abortSysExec();

    // Destruct webserver components
    delete webserver;
    delete factory;
    delete core;

    // Cleanup components
#ifdef CRASH_REPORTING
    crashReportCleanup();
#endif
    DomainKeystore::Cleanup();

}