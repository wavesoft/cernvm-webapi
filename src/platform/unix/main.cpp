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

// Webserver
#include "web/webserver.h"

// Daemon components
#include "daemon_core.h"
#include "daemon_factory.h"
#include "daemon_session.h"

/**
 * Entry point for the CernVM Web Daemon
 */
int main( int argc, char ** argv ) {

	// Daemon core component
	DaemonCore 		core;

	// Create a factory that manages the daemon sessions
	DaemonFactory 	factory( core );

	// Create a webserver that serves with the daemon factory
	CVMWebserver	webserver( factory );

	// Start the webserver
	webserver.start();

}