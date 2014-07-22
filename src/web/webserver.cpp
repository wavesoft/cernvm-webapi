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

#include "webserver.h"
#include <config.h>

#include <iostream>
#include <sstream>
#include <fstream>
#include <CernVM/CrashReport.h>

using namespace std;

/**
 * This function is generated from source
 */
extern const char *find_embedded_file(const string&, size_t *);

/**
 * Send an error message
 */
int send_error( struct mg_connection *conn, const char* message, const int code = 500 ) {
    CRASH_REPORT_BEGIN;

    // Send error code
    mg_send_status(conn, code);

    // Send payload
    mg_printf_data( conn, 
        "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<title>CernVM WebAPI :: Error</title>\n</head>\n"
        "<body><h1>CernVM WebAPI Error %i</h1><p>%s</p></body>"
        "</html>", code, message );

    // Request processed
    return MG_TRUE;

    CRASH_REPORT_END;
}

/**
 * This is the entry point for the CernVM Web API I/O
 */
int CVMWebserver::api_handler(struct mg_connection *conn) {
    CRASH_REPORT_BEGIN;

	// Fetch 'this' from the connection server object
	CVMWebserver* self = static_cast<CVMWebserver*>(conn->server_param);

    // Try to identify domain by the 'Origin' header
    const char * c_origin = mg_get_header(conn, "Origin");
    string domain = ""; 
    if (c_origin != NULL) {
    	domain=c_origin;
    	size_t slashPos = domain.find("//");
    	if (slashPos != string::npos) {
	    	domain = domain.substr( slashPos+2, domain.length()-slashPos-2 );
    	}
        size_t colonPos = domain.find(":");
        if (colonPos != string::npos) {
            domain = domain.substr( 0, colonPos );
        }
    }

    // Move URI to std::string
    std::string url = conn->uri;

    // DEBUG response
    if (conn->is_websocket) {

        // Check if a connection is active
        CVMWebserverConnection * c;
        if (self->connections.find(conn) == self->connections.end()) {

            // Initialize a new connection if such connection
            // does not exist.
            boost::mutex::scoped_lock lock(self->connMutex);
            c = new CVMWebserverConnection( self->factory.createHandler(domain, url) );
            c->isIterated = true;
            self->connections[conn] = c;
            
        } else {
            c = self->connections[conn];
        }

        // Handle TEXT frames 
        if ( (conn->wsbits & 0x0F) == 0x01) {
            c->h->handleRawData(conn->content, conn->content_len);
        }

        // Check if connection is closed
        return c->h->isConnected() ? MG_TRUE : MG_FALSE;

    } else {

        // Trim trailing & heading slash from URL
        if (url[url.length()-1] == '/')
            url = url.substr(0, url.length()-1);
        if (url[0] == '/')
            url = url.substr(1, url.length()-1);

        // Check for embedded resources
        size_t res_size;
        const char *res_buffer = find_embedded_file( url, &res_size);
        if ( url == "info" ) {

            // Enable CORS (important for allowing every website to contact us)
            mg_send_header(conn, "Access-Control-Allow-Origin", "*" );
            mg_printf_data(conn, "{\"status\":\"ok\",\"request\":\"%s\",\"domain\":\"%s\",\"version\":\"%s\"}", conn->uri, domain.c_str(), CERNVM_WEBAPI_VERSION);
            return MG_TRUE;

        } else if (res_buffer == NULL) {
            
            // File not found
            return send_error( conn, "File not found", 404);

        } else {

            // Get MIME type of the file to send and send header
            const char * mimeType = mg_get_mime_type( url.c_str(), "text/plain" );
            mg_send_header(conn, "Content-Type", mimeType );

            // Send data
            mg_send_data( conn, res_buffer, res_size );
            return MG_TRUE;

        }

	    
    }
    return 1;

    CRASH_REPORT_END;
}

/**
 * Iterator over the websocket connections
 */
int CVMWebserver::iterate_callback(struct mg_connection *conn, enum mg_event ev) {
    CRASH_REPORT_BEGIN;

    // Fetch 'this' from the connection server object
    CVMWebserver* self = static_cast<CVMWebserver*>(conn->server_param);

    // Handle websockets
    if ((ev == MG_POLL) && conn->is_websocket) {

        // Check if a CVMWebserverConnection is active
        CVMWebserverConnection * c;
        if (self->connections.find(conn) == self->connections.end()) {
            // This connection is not handled by us!
            return MG_TRUE;

        } else {
            c = self->connections[conn];
        }

        // Mark socket as iterated
        c->isIterated = true;

        // Send all frames of the egress queue
        std::string buf;
        while ( !(buf = c->h->getEgressRawData()).empty() ) {
            mg_websocket_write(conn, 0x01, buf.c_str(), buf.length());
        }

        // If we are disconnected, send disconnect frame
        if (!c->h->isConnected()) {

            // Send Connection Close Frame
            mg_websocket_write(conn, 0x08, NULL, 0);

            // Mark as non-iterated so it's delete on poll()
            c->isIterated = false;
        }

    }

    // We are done with
    return MG_TRUE;

    CRASH_REPORT_END;
}

/**
 * RAW Request handler
 */
int CVMWebserver::ev_handler(struct mg_connection *conn, enum mg_event ev) {
    CRASH_REPORT_BEGIN;
    if (ev == MG_REQUEST) {
        return api_handler(conn);
    } else if (ev == MG_AUTH) {
        return MG_TRUE;
    } else {
        return MG_FALSE;
    }
    CRASH_REPORT_END;
}

/**
 * Create a webserver and setup listening port
 */
CVMWebserver::CVMWebserver( CVMWebserverConnectionFactory& factory, const int port ) : factory(factory), staticResources() {
    CRASH_REPORT_BEGIN;

	// Create a mongoose server, passing the pointer
	// of this class, in order for the C callbacks
	// to have access to the class instance.
	server = mg_create_server( this, CVMWebserver::ev_handler );

	// Prepare the listening endpoint info
	ostringstream ss; ss << "127.0.0.1:" << port;
    mg_set_option(server, "listening_port", ss.str().c_str());

    CRASH_REPORT_END;
}

/**
 * WebServer destructor
 */
CVMWebserver::~CVMWebserver() {
    CRASH_REPORT_BEGIN;

    // Destroy mongoose server
    mg_destroy_server( &server );

	// Destroy connections
    {
        boost::mutex::scoped_lock lock(connMutex);

        std::map<mg_connection*, CVMWebserverConnection*>::iterator it;
        for (it=connections.begin(); it!=connections.end(); ++it) {
            CVMWebserverConnection * c = it->second;
            c->cleanup();
            delete c;
        }

        // Clear map
        connections.clear();

    }

    CRASH_REPORT_END;
}

/**
 * Serve a static resource under the given URL
 */
void CVMWebserver::serve_static( const std::string& url, const std::string& file ) {
    CRASH_REPORT_BEGIN;

    // Store on staticResources
    staticResources[url] = file;

    CRASH_REPORT_END;
}

/**
 * Poll server for incoming events. 
 * This function should be called periodically to receive events.
 */
void CVMWebserver::poll( const int timeout) {
    CRASH_REPORT_BEGIN;

    // Mark all the connections as 'not iterated'
    {
        boost::mutex::scoped_lock lock(connMutex);
        std::map<mg_connection*, CVMWebserverConnection*>::iterator it;
        for (it=connections.begin(); it!=connections.end(); ++it) {
            CVMWebserverConnection * c = it->second;
            c->isIterated = false;
        }
    }

    // Send the message to iterate over connections
    mg_iterate_over_connections(server, CVMWebserver::iterate_callback, this);

	// Poll mongoose server
    mg_poll_server(server, timeout);	

    // Find dead connections
    {
        boost::mutex::scoped_lock lock(connMutex);
        std::map<mg_connection*, CVMWebserverConnection*>::iterator it;
        for (it=connections.begin(); it!=connections.end(); ++it) {
            CVMWebserverConnection * c = it->second;

            // Delete non-iterated over actions
            if (!c->isIterated) {

                // Release connection object
                c->cleanup();
                delete c;

                // Delete element
                connections.erase(it);

                // Skip deleted element or exit
                if (connections.empty()) {
                    break;
                    
                } else {
                    // Otherwise rewind pointer
                    it = connections.begin();
                }

            }
        }
    }

    CRASH_REPORT_END;
}

/**
 * Start the infinite loop for the server.
 * After calling this function the only way to stop the server is
 * an interrupt signal or to call ``stop`` function from another thread.
 */
void CVMWebserver::start() {
    CRASH_REPORT_BEGIN;

	// Infinite loop :P
	for (;;) {
		poll();
	}

    CRASH_REPORT_END;
}

/**
 * Check if there are live registered connections
 */
bool CVMWebserver::hasLiveConnections() {
    CRASH_REPORT_BEGIN;
    boost::mutex::scoped_lock lock(connMutex);
    return !connections.empty();
    CRASH_REPORT_END;
}
