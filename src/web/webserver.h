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
#ifndef WEBSERVER_H
#define WEBSERVER_H

#include <mongoose.h>
#include <boost/thread/mutex.hpp>
#include <config.h>

#include <string>
#include <map>

/**
 * Abstract class for connection handlers
 */
class CVMWebserverConnectionHandler {
public:

	/**
	 * Abstract destructor
	 */
	virtual ~CVMWebserverConnectionHandler() { };

	/**
	 * This function is called when there is an incoming data frame 
	 * from the browser.
	 */
	virtual void			handleRawData( const char * buffer, const size_t len ) = 0;

	/**
	 * This function should return FALSe only when the connection handler
	 * decides to drop the connection.
	 */
	virtual bool 			isConnected() = 0;

	/**
	 * Pops and returns the next frame from the egress queue, or returns
	 * an empty string if there are no data in the egress queue.
	 */
	virtual std::string 	getEgressRawData() = 0;

};

/**
 * Abstract factory class that can create connection handlers
 */
class CVMWebserverConnectionFactory {
public:

	/**
	 * Create a new instance of the CVMWebserverConnectionHandler
	 */
	virtual CVMWebserverConnectionHandler *	createHandler( const std::string& domain, const std::string uri ) = 0;

};

/**
 * Record for tracking connections and their state
 */
class CVMWebserverConnection {
public:

	/**
	 * Constructor of the CVMWebserverConnection registry entry
	 */
	CVMWebserverConnection(CVMWebserverConnectionHandler * handler)
	 : h(handler), isIterated(false) { };

	/**
	 * Destruct handler when destructing connection record
	 */
	virtual ~CVMWebserverConnection() {
		if (h != NULL) {
			delete h;
		 }
	}

	/**
	 * The pointer to the connection handler instance
	 */
	CVMWebserverConnectionHandler *	h;

	/**
	 * Internal flag used to track lost connections
	 */
	bool isIterated;

};

/**
 * This class encapsulates the Mongoose (webserver) instance and provides
 * the core functionality for interfacing with javascript via JSON RPC.
 */
class CVMWebserver {
public:

	/**
	 * Create a webserver and setup listening port
	 */
	CVMWebserver( CVMWebserverConnectionFactory& factory, const int port = CERNVM_WEBAPI_PORT );

	/**
	 * Cleanup and destroy server
	 */
	virtual ~CVMWebserver();

	/**
	 * Poll server for incoming events. 
	 * This function should be called periodically to receive events.
	 */
	void poll( const int timeout = 100 );

	/**
	 * Start the infinite loop for the server.
	 * After calling this function the only way to stop the server is
	 * an interrupt signal or to call ``stop`` function from another thread.
	 */
	void start();

	/**
	 * Check if there are live registered connections
	 */
	bool hasLiveConnections();

public:

	/**
	 * Serve a static resource under the given URL
	 */
	void serve_static( const std::string& url, const std::string& file );


private:

	/**
	 * A list of active webserver connections
	 */
	std::map<mg_connection*, CVMWebserverConnection*> 	connections;

	/**
	 * Mutex for accessing the connections array
	 */
	boost::mutex connMutex;

	/**
	 * The mongoose server instance
	 */
	mg_server*	server;

	/**
	 * The factory used for connection handler creation
	 */
	CVMWebserverConnectionFactory&	factory;

	/**
	 * Map of static resources
	 */
	std::map< std::string, std::string > staticResources;

	/**
	 * Iterator over the websocket connections
	 */
	static int 	iterate_callback(struct mg_connection *c, enum mg_event ev);

	/**
	 * This is the entry point for the CernVM Web API I/O
	 */
	static int 	api_handler(struct mg_connection *conn);

	/**
	 * Raw event handler
	 */
	static int ev_handler(struct mg_connection *conn, enum mg_event ev);

};

#endif /* end of include guard: WEBSERVER_H */