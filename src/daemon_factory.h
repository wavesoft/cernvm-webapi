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

#pragma once
#ifndef DAEMON_FACTORY_H
#define DAEMON_FACTORY_H

#include "daemon.h"

class DaemonFactory : public CVMWebserverConnectionFactory {
public:
	
	/**
	 * Keep a reference of the daemon core
	 */
	DaemonFactory( DaemonCore& core ) : core(core), CVMWebserverConnectionFactory() { };

	/**
	 * This factory just creates WebsocketAPI handlers
	 */
	virtual CVMWebserverConnectionHandler *	createHandler( const std::string& domain, const std::string uri ) {
		return new DaemonConnection( domain, uri, core );
	}

	/**
	 * Daemon core
	 */
	DaemonCore& 	core;

};

#endif /* end of include guard: DAEMON_FACTORY_H */
