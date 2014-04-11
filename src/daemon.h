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
#ifndef DAEMON_H
#define DAEMON_H

#include "web/webserver.h"
#include "web/api.h"

#include <boost/shared_ptr.hpp>

// Forward declarations for the entire project
class DaemonCore;
class DaemonConnection;
class DaemonFactory;

class CVMCallbackFw;
class CVMWebAPI;
class CVMWebAPISession;

typedef boost::shared_ptr< CVMWebAPISession >	CVMWebAPISessionPtr;

// Include implementations
#include "daemon_core.h"
#include "daemon_connection.h"
#include "daemon_factory.h"

#include "components/CVMCallbackFw.h"
#include "components/CVMWebAPI.h"
#include "components/CVMWebAPISession.h"

#endif /* end of include guard: DAEMON_H */