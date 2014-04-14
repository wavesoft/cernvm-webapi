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
#include <iostream>
#include <sstream>
#include <fstream>

using namespace std;

/**
 * Send an error message
 */
int send_error( struct mg_connection *conn, const char* message, const int code = 500 ) {

    // Send error code
    mg_send_status(conn, code);

    // Send payload
    mg_printf_data( conn, 
        "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<title>CernVM WebAPI :: Error</title>\n</head>\n"
        "<body><h1>CernVM WebAPI Error %i</h1><p>%s</p></body>"
        "</html>", code, message );

    // Request processed
    return MG_REQUEST_PROCESSED;

}

/**
 * This is the entry point for the CernVM Web API I/O
 */
int CVMWebserver::api_handler(struct mg_connection *conn) {

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
        return c->h->isConnected() ? MG_CLIENT_CONTINUE : MG_CLIENT_CLOSE;

    } else {

        // Trim trailing slash from URL
        if (url[url.length()-1] == '/')
            url = url.substr(0, url.length()-1);

        cout << "Handing URL: " << url << endl;

        // Check for static URLs
        if (self->staticResources.find(url) != self->staticResources.end()) {

            // TODO: Windows (http://blog.kowalczyk.info/article/zy/Embedding-binary-resources-on-Windows.html)

            // Get the name of the file to serve
            string file = self->staticResources[url];

            // Start reading file
            ifstream ifs( file.c_str() );
            if (!ifs.good()) {
                return send_error( conn, "Unable to open the requested resource!" );
            }

            // Get MIME type of the file to send and send header
            const char * mimeType = mg_get_mime_type( file.c_str(), "text/plain" );
            mg_send_header(conn, "Content-Type", mimeType );

            // Start reading and sending
            char inBuffer[4096];
            while (!ifs.eof()) {
                ifs.read( inBuffer, 4096 );
                if (ifs.bad()) {
                    return send_error( conn, "Error while reading resource!" );
                }
                mg_send_data( conn, inBuffer, ifs.gcount() );
            }

            // Close file
            ifs.close();

        } else if ( url == "info" ) {

            // Enable CORS (important for allowing every website to contact us)
            mg_send_header(conn, "Access-Control-Allow-Origin", "*" );
            mg_printf_data(conn, "{\"status\":\"ok\",\"request\":\"%s\",\"domain\":\"%s\"}", conn->uri, domain.c_str());
            return MG_REQUEST_PROCESSED;

        } else {

            // File not found
            return send_error( conn, "File not found", 404);

        }

	    
    }
    return 1;

}

/**
 * Iterator over the websocket connections
 */
int CVMWebserver::iterate_callback(struct mg_connection *conn) {

    // Fetch 'this' from the connection server object
    CVMWebserver* self = static_cast<CVMWebserver*>(conn->server_param);

    // Handle websockets
    if (conn->is_websocket) {

        // Check if a CVMWebserverConnection is active
        CVMWebserverConnection * c;
        if (self->connections.find(conn) == self->connections.end()) {
            // This connection is not handled by us!
            return MG_REQUEST_PROCESSED;

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
    return MG_REQUEST_PROCESSED;

}

/**
 * Create a webserver and setup listening port
 */
CVMWebserver::CVMWebserver( CVMWebserverConnectionFactory& factory, const int port ) : factory(factory), staticResources() {

	// Create a mongoose server, passing the pointer
	// of this class, in order for the C callbacks
	// to have access to the class instance.
	server = mg_create_server( this );

	// Prepare the listening endpoint info
	ostringstream ss; ss << "127.0.0.1:" << port;
    mg_set_option(server, "listening_port", ss.str().c_str());

    // Bind default request handler
    mg_set_request_handler(server, CVMWebserver::api_handler);

}

/**
 * WebServer destructor
 */
CVMWebserver::~CVMWebserver() {

    // Destroy mongoose server
    mg_destroy_server( &server );

	// Destroy connections
    {
        boost::mutex::scoped_lock lock(connMutex);

        std::map<mg_connection*, CVMWebserverConnection*>::iterator it;
        for (it=connections.begin(); it!=connections.end(); ++it) {
            CVMWebserverConnection * c = it->second;
            delete c;
        }

        // Clear map
        connections.clear();

    }

}

/**
 * Serve a static resource under the given URL
 */
void CVMWebserver::serve_static( const std::string& url, const std::string& file ) {

    // Store on staticResources
    staticResources[url] = file;

}

/**
 * Poll server for incoming events. 
 * This function should be called periodically to receive events.
 */
void CVMWebserver::poll( const int timeout) {

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
                delete c;

                // Delete element
                it = connections.erase(it);

                // Skip deleted element or exit
                if (connections.empty() || (it == connections.end())) {
                    break;
                }

            }
        }
    }

}

/**
 * Start the infinite loop for the server.
 * After calling this function the only way to stop the server is
 * an interrupt signal or to call ``stop`` function from another thread.
 */
void CVMWebserver::start() {

	// Infinite loop :P
	for (;;) {
		poll();
	}

}

/**
 * Check if there are live registered connections
 */
bool CVMWebserver::hasLiveConnections() {
    boost::mutex::scoped_lock lock(connMutex);
    return !connections.empty();
}
