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
#ifndef STATIC_RPC_H
#define STATIC_RPC_H

#include "daemon.h"

/**
 * Minimalistic JSON RPC-like interface for interacting between
 * webAPI processes and the user.
 */
class WebRPCHandler : public CVMWebserverStaticURLHandler {
public:
	
	/**
	 * Keep a reference of the daemon core
	 */
	WebRPCHandler() : CVMWebserverStaticURLHandler() { };

	/**
	 * We were asked to open an authenticated URL window
	 * (Whould be implemented in the platform code)
	 */
	virtual void			platf_openControl();

	/**
	 * Check if we can handle the specified URL
	 */
	virtual bool 			canHandleStaticURL( const std::string& url );

	/**
	 * Handle a URL query
	 */
	virtual std::string 	handleStaticURL( const std::string& url );

};

class WebRPC {
public:

	/**
	 * Perform WebRPC to a running CernVM WebAPI instance and request to open a new control panel
	 */
	static void 			openControl();

};

#endif /* end of include guard: STATIC_RPC_H */
