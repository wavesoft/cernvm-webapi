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
#include <tchar.h>

// Webserver
#include <web/webserver.h>
// Daemon components
#include <daemon.h>

// Include windows after
#include <windows.h>

// Daemon core component
DaemonCore *		core;
// Create a factory that manages the daemon sessions
DaemonFactory *	    factory;
// Create a webserver that serves with the daemon factory
CVMWebserver *		webserver;

/**
 * Check if string is empty
 */
int isEmpty(LPSTR string)
{
  if (string != NULL)
  {
    // Use not on the result below because it returns 0 when the strings are equal,
    // and we want TRUE (1).
    return !strcmp(string, "");
  }

  return FALSE;
}

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
 * Windows entry point
 */
int WINAPI WinMain(HINSTANCE hInstance,
                   HINSTANCE hPrevInstance,
                   LPSTR lpCmdLine,
                   int nCmdShow) 
{

	// Check if the instance is already running
  	HANDLE instMutex = CreateMutex( NULL, true, "CernVM_WebAPI_Instance_Mutex" ); 
  	if ((instMutex = 0) || (GetLastError() == ERROR_ALREADY_EXISTS)) {
  		// Already runs

  		// Launch instance if we are not launched by URL
        if (isEmpty(lpCmdLine))
            openAuthenticatedURL();

  		// Exit
  		return 0;
  	}

    // Create the C++ daemon core
    core = new DaemonCore();
    // Create a factory which is going to create the instances
    factory = new DaemonFactory(*core);
    // Create the webserver instance
    webserver = new CVMWebserver(*factory);

    // Check if we should launch a URL
    bool launchURL = isEmpty(lpCmdLine);

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

    // Abory any lingering sysExec commands
    abortSysExec();

    // Destruct webserver components
    delete webserver;
    delete factory;
    delete core;

  	// Release mutex & Exit
  	CloseHandle(instMutex);
    return 0;

}
