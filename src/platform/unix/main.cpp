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
#include <dlfcn.h>
#include <sys/file.h>
#include <CernVM/CrashReport.h>

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
  oss << "xdg-open \"http://127.0.0.1:5624/control.html#" << authToken << "\"";

  // Get URL string
  std::string url = oss.str();
  system(url.c_str());
}

/**
 * Entry point for the CernVM Web Daemon
 */
int main( int argc, char ** argv ) {

    // Ensure single instance
    int pid_file = open("/var/run/cernvm-webapi.pid", O_CREAT | O_RDWR, 0666);
    int rc = flock(pid_file, LOCK_EX | LOCK_NB);
    if(rc) {
        if(EWOULDBLOCK == errno) {
            // Another instance is running
            close(pid_file);
            return 32;
        }
    }

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

    // Check if we were launched with a 'setup' argument
    bool launchedBySetup = (argc > 1) && (strcmp(argv[1], "setup") == 0);

    // Start server
    long lastIdle = getMillis();
    long lastCronTime = lastIdle;
    while (!core->hasExited()) {
        long now = getMillis();
        webserver->poll();

        // Update idle timer when we have connections
        if (webserver->hasLiveConnections()) {
            lastIdle = now;

            // The moment we got an active connection, we are allowed
            // to dismiss the process. Therefore reset any possible
            // launchedBySetup flag
            launchedBySetup = false;

        }

        // Exit if we are idle for 10 seconds
        else if (now - lastIdle > 10000) {
            // .. but not if we were launched by setup
            if (!launchedBySetup) break;
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

    // 0 means successful shutdown
    close(pid_file);
    return 0;

}