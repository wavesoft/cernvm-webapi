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
#ifndef WEBAPI_UTILITIES_H
#define WEBAPI_UTILITIES_H

#include <vector>
#include <string>

#include <json/json.h>

#include <CernVM/Hypervisor.h>
#include <CernVM/ProgressFeedback.h>

//#include <boost/thread/mutex.hpp>
//#include <boost/thread/locks.hpp>
//#include <boost/thread/condition_variable.hpp>
#include <mutex>
#include <condition_variable>

/**
 * Compile and return a Json::Value with all the state information
 * for the given session
 */
Json::Value sessionStateInfoToJSON( HVSessionPtr hvSession );

/**
 * Drain Semaphore is a synchronization mechanism used by the daemon_connection
 * class. It's purpose is to wait for all thread operations before it attempts
 * to join them.
 *
 */
class DrainSemaphore {
public:
	DrainSemaphore() : accessMutex(), drainCondition(), usageCounter(0) { };

	/**
	 * Increment the usage
	 */
	void increment() {
        std::unique_lock<std::mutex> lock(accessMutex);
        usageCounter++;
	}

	/**
	 * Decrement usage
	 */
	void decrement() {
	    {
	        std::unique_lock<std::mutex> lock(accessMutex);
	        usageCounter--;
	    }
	    // Notify condition when we reached zero
	    if (usageCounter == 0)
		    drainCondition.notify_all();
	}

	/**
	 * Wait until usages reaches 0
	 */
	void wait() {
		std::unique_lock<std::mutex> lock(accessMutex);
		while(usageCounter > 0) {
			drainCondition.wait(lock);
		}
	}

private:
	std::mutex 						accessMutex;
	std::condition_variable 		drainCondition;
	int 							usageCounter;
};

/**
 * This class waits in scope until the DrainSemaphore reaches zero.
 */
class DrainWaitLock {
public:
	DrainWaitLock( DrainSemaphore& sem ) {
		sem.wait();
	}
};

/**
 * This class increments the DrainSemaphore while it remains in scope. 
 */
class DrainUseLock {
public:
	DrainUseLock(DrainSemaphore& semRef ) : sem( &semRef ) {
		sem->increment();
	}
	~DrainUseLock() {
		sem->decrement();
	}
private:
	DrainSemaphore *	sem;
};

#endif /* end of include guard: WEBAPI_UTILITIES_H */
