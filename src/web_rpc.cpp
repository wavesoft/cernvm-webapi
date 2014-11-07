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

#include "web_rpc.h"

/**
 * Check if we can handle the given url
 */
bool WebRPCHandler::canHandleStaticURL( const std::string& url ) {
	if ((url.substr(0,4).compare("rpc/") == 0) || (url.compare("rpc") == 0)) return true;
	return false;
}

/**
 * Handle a URL query
 */
std::string WebRPCHandler::handleStaticURL( const std::string& url ) {

	/**
	 * Requested to open an authenticated URL to the control panel
	 */
	if (url.compare("rpc/control") == 0) {

		// Open authenticated URL
		platf_openControl();
		return "{\"status\":\"ok\"}";

	} else {
		return "{\"status\":\"error\", \"error\":\"Unknown request\"}";
	}

}

/**
 * Open control panel to the currently running CernVM WebAPI instance
 */
void WebRPC::openControl() {
	minHttpGet( "127.0.0.1", CERNVM_WEBAPI_PORT, "/rpc/control" );
}
