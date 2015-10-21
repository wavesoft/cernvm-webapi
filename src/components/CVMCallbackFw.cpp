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
 * Unregister everything upon destruction
 */
CVMCallbackFw::~CVMCallbackFw() {
	CRASH_REPORT_BEGIN;

	// Unregister from all the objects that we are monitoring
	for (std::vector< DisposableDelegate* >::iterator it = listening.begin(); it != listening.end(); ++it ) {
		DisposableDelegate * dd = *it;
		// Free memory and unregister
		delete dd;
	}

	// Remove all entries
	listening.clear();
	CRASH_REPORT_END;
}

/**
 * Listen the events of the specified callback object
 */
void CVMCallbackFw::listen( FiniteTaskPtr cb ) {
	CRASH_REPORT_BEGIN;
	using namespace std::placeholders;

	// Register an anyEvent receiver and keep the slot reference
	listening.push_back(
		new DisposableDelegate( cb, std::bind( &CVMCallbackFw::fire, this, _1, _2 ) )
	);
		
	CRASH_REPORT_END;
}

/**
 * Stop listening for events of the specified callback object
 */
void CVMCallbackFw::stopListening( FiniteTaskPtr cb ) {
	CRASH_REPORT_BEGIN;

	// Register an anyEvent receiver and keep the slot reference
	for (std::vector< DisposableDelegate* >::iterator it = listening.begin(); it != listening.end(); ++it ) {
		DisposableDelegate * dd = *it;

		// Erase the callback item
		if (dd->cb == cb) {

			// Erase item from vector
			listening.erase( it );

			// Delete and unregister
			delete dd;

			// Break from loop
			break;

		}

	}
		
	CRASH_REPORT_END;
}

/**
 * Fire an event to the javascript object
 */
void CVMCallbackFw::fire( const std::string& name, VariantArgList& args ) {
	CRASH_REPORT_BEGIN;

	// Forward the event to the interface
	api.sendEvent( name, args, sessionID );

	CRASH_REPORT_END;
}
