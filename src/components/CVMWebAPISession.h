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
#ifndef DAEMON_COMPONENT_WEBAPISESSION_H
#define DAEMON_COMPONENT_WEBAPISESSION_H

#include <CernVM/Hypervisor.h>
#include <CernVM/ProgressFeedback.h>
#include <CernVM/Utilities.h>
 
#include <CernVM/Hypervisor/Virtualbox/VBoxSession.h>


class CVMWebAPISession {
public:

	/**
	 * Constructor for the CernVM WebAPI Session 
	 */
	CVMWebAPISession( DaemonCore* core, DaemonConnection& connection, HVSessionPtr hvSession, int uuid  )
		: core(core), connection(connection), hvSession(hvSession), uuid(uuid), uuid_str(ntos<int>(uuid)), 
		  callbackForwarder( connection, uuid_str ), apiPortOnline(false), periodicsRunning(false), apiPortCounter(0)
	{ 

		// Disable by default periodic jobs
		acceptPeriodicJobs = false;

		// Handle state changes
        hStateChanged = hvSession->on( "stateChanged", boost::bind( &CVMWebAPISession::__cbStateChanged, this, _1 ) );

        // Enable progress feedback to the HVSessionPtr FSM.
        //
        // To do so, we are going to create a FiniteState progress feedback object,
        // make callbackForwarder to listen for it's progress events, and then
        // give the progress feedback object for use by the FSM  
        //
        FiniteTaskPtr ft = boost::make_shared<FiniteTask>();
        callbackForwarder.listen( ft );

        // That's currently a VBoxSession-only feature
        boost::static_pointer_cast<VBoxSession>(hvSession)->FSMUseProgress( ft, "Serving request" );

        CVMWA_LOG("Debug", "Session initialized with ID " << uuid << " (str:" << uuid_str << ")");

	};

	/**
	 * Destructor
	 */
	~CVMWebAPISession() {
		CVMWA_LOG("Debug", "Destructing CVMWebAPISession");
		hvSession->off( "stateChanged", hStateChanged );
		hvSession->abort();
		core->hypervisor->sessionClose( hvSession );
	}

	/**
	 * Handling of commands directed for this session
	 */
	void handleAction( CVMCallbackFw& cb, const std::string& action, ParameterMapPtr parameters );

	/**
	 * Session polling timer
	 */
	void processPeriodicJobs( );

	/**
	 * Return all properties as a json string
	 */
	std::string propertiesAsJSON();

	/**
	 * Return configuration as JSON
	 */
	std::string configAsJSON();

	/**
	 * Set status of the periodic jobs thread
	 */
	 void 				enablePeriodicJobs( bool status );

	/**
	 * The session ID
	 */
	int					uuid;

	/**
	 * The string version of session ID
	 */
	std::string 		uuid_str;

	/**
	 * The websocket connection used for I/O
	 */
	DaemonConnection& 	connection;

	/**
	 * The encapsulated hypervisor session pointer
	 */
	HVSessionPtr		hvSession;

private:

	/**
	 * Event callbacks from the hypervisor session
	 */
	void __cbStateChanged( VariantArgList& args );

	/*
	 * Periodic jobs thread
	 */
	void periodicJobsThread( );

	/**
	 * Flab which indicates that the periodic job thread is running
	 */
	bool 				periodicsRunning;

	/**
	 * The daemon's core state manager
	 */
	DaemonCore*			core;

	/**
	 * Hook slots (used for unbinding the hooks at destruction)
	 */
	NamedEventSlotPtr 	hStateChanged;

	/**
	 * Callback forwarding object
	 */
	CVMCallbackFw		callbackForwarder;

	/**
	 * Last state of the API port
	 */
	bool 				apiPortOnline;

	/**
	 * Polling counter of the API Port
	 */
	int 				apiPortCounter;

	/**
	 * Flag that defines if we should accept periodic
	 * updates from the periodicJobsThread();
	 */
	bool				acceptPeriodicJobs;

};

#endif /* end of include guard: DAEMON_COMPONENT_WEBAPISESSION_H */
