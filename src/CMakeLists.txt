cmake_minimum_required (VERSION 2.6)
project ( daemon )
include_directories( .. )

# Project's long name
set( PROJECT_LONG_NAME "CernVM WebAPI Launcher" )

# Find FireBreath libs dir
set( FB_LIB_DIR "${PROJECT_SOURCE_DIR}/../../../src/libs" )
set( FB_BOOST_INCLUDE_DIR "${PROJECT_SOURCE_DIR}/../../../src/3rdParty/boost" )
set( FB_BOOST_LIB_DIR "${PROJECT_SOURCE_DIR}/../../../build/boost/libs" )
set( FB_GEN_DIR "${PROJECT_SOURCE_DIR}/../../../build/projects/CVMWeb/gen" )

# The hypervisor implementations to include
set( HV_NAMES Virtualbox )

# External libraries
set( EXTERN_ZLIB "../extern/zlib-1.2.8" )
set( EXTERN_MONGOOSE "../extern/mongoose" )
set( EXTERN_JSONCPP "../extern/jsoncpp" )
include_directories( ${EXTERN_ZLIB} )
include_directories( ${EXTERN_MONGOOSE} )
include_directories( ${EXTERN_JSONCPP}/include )

# Static build
SET(BUILD_SHARED_LIBS OFF)

# Include generated files directory
include_directories( ${FB_GEN_DIR} )

# Add definitions depending on build type
if (WIN32)
	IF (${CMAKE_BUILD_TYPE} MATCHES "Debug")
	  ADD_DEFINITIONS(/D "DEBUG")   
	ELSE (${CMAKE_BUILD_TYPE} MATCHES "Debug")
	  ADD_DEFINITIONS(/D "NDEBUG")
	ENDIF (${CMAKE_BUILD_TYPE} MATCHES "Debug")
else(WIN32)
	IF (${CMAKE_BUILD_TYPE} MATCHES "Debug")
	  ADD_DEFINITIONS(-DDEBUG)   
	ELSE (${CMAKE_BUILD_TYPE} MATCHES "Debug")
	  ADD_DEFINITIONS(-DNDEBUG)
	ENDIF (${CMAKE_BUILD_TYPE} MATCHES "Debug")
endif(WIN32)

# Check if we can use libCURL
FIND_PACKAGE(CURL)
IF(CURL_FOUND)
	include_directories( ${CURL_INCLUDE_DIRS} )
else()
	if (EXISTS ${FB_LIB_DIR}/curl/curl/lib/libcurl.lib )
		set( CURL_INCLUDE_DIRS ${FB_LIB_DIR}/curl/curl/include )
		set( CURL_LIBRARIES ${FB_LIB_DIR}/curl/curl/lib/libcurl.lib )
		include_directories( ${CURL_INCLUDE_DIRS} )
		MESSAGE("Using cURL shipped with FireBreath")
	else()
		MESSAGE(SEND_ERROR "Could not find cURL on your system")
	endif()
	add_definitions (-DCURL_STATICLIB)
ENDIF(CURL_FOUND)

# Check if we can use OpenSSL
FIND_PACKAGE(OpenSSL)
IF (OPENSSL_FOUND)
	include_directories( ${OPENSSL_INCLUDE_DIRS} )
else()
	if (EXISTS ${FB_LIB_DIR}/openssl/openssl/lib/libeay32.lib )
		set( OPENSSL_INCLUDE_DIRS ${FB_LIB_DIR}/openssl/openssl/include )
		set( OPENSSL_LIBRARIES 
			${FB_LIB_DIR}/openssl/openssl/lib/libeay32.lib 
			${FB_LIB_DIR}/openssl/openssl/lib/ssleay32.lib 
			)
		include_directories( ${OPENSSL_INCLUDE_DIRS} )
		MESSAGE("Using OpenSSL shipped with FireBreath")
	else()
		MESSAGE(SEND_ERROR "Could not find OpenSSL on your system")
	endif()
ENDIF(OPENSSL_FOUND)

# Use FireBreath (already built) boost libraries
set(Boost_USE_STATIC_LIBS ON) 
set(Boost_USE_MULTITHREADED ON)  
set(Boost_USE_STATIC_RUNTIME ON) 
find_package(Boost COMPONENTS thread system filesystem regex) 
if(Boost_FOUND)
    include_directories(${Boost_INCLUDE_DIRS}) 
    set( BOOST_LIBRARIES "${Boost_LIBRARIES}" )
else()
	ADD_DEFINITIONS(-DBOOST_ALL_NO_LIB)
	INCLUDE_DIRECTORIES( ${FB_BOOST_INCLUDE_DIR} )
	if (WIN32)
		file ( GLOB BOOST_LIBRARIES 
			${FB_BOOST_LIB_DIR}/thread/${CMAKE_BUILD_TYPE}/*.lib
			${FB_BOOST_LIB_DIR}/system/${CMAKE_BUILD_TYPE}/*.lib
			${FB_BOOST_LIB_DIR}/filesystem/${CMAKE_BUILD_TYPE}/*.lib
			${FB_BOOST_LIB_DIR}/regex/${CMAKE_BUILD_TYPE}/*.lib )
	elseif(APPLE)
		file ( GLOB BOOST_LIBRARIES 
			${FB_BOOST_LIB_DIR}/thread/${CMAKE_BUILD_TYPE}/*
			${FB_BOOST_LIB_DIR}/system/${CMAKE_BUILD_TYPE}/*
			${FB_BOOST_LIB_DIR}/filesystem/${CMAKE_BUILD_TYPE}/*
			${FB_BOOST_LIB_DIR}/regex/${CMAKE_BUILD_TYPE}/* )

		# Check if the user is using Make instead of XCodeBuild
		IF("${BOOST_LIBRARIES}" STREQUAL "")
			file ( GLOB BOOST_LIBRARIES 
				${FB_BOOST_LIB_DIR}/thread/*.a
				${FB_BOOST_LIB_DIR}/system/*.a
				${FB_BOOST_LIB_DIR}/filesystem/*.a
				${FB_BOOST_LIB_DIR}/regex/*.a )
		ENDIF()

	elseif(UNIX)
		file ( GLOB BOOST_LIBRARIES 
			${FB_BOOST_LIB_DIR}/thread/*.a
			${FB_BOOST_LIB_DIR}/system/*.a
			${FB_BOOST_LIB_DIR}/filesystem/*.a
			${FB_BOOST_LIB_DIR}/regex/*.a )
	ENDIF(WIN32)
	IF("${BOOST_LIBRARIES}" STREQUAL "")
		MESSAGE( FATAL_ERROR "No BOOST libraries were found for ${CMAKE_BUILD_TYPE} configuration! Please build the plugin first..." )
	ENDIF()

endif()

# Locate platform-dependant sources
if (WIN32)
	set ( PLATFORM_DIR ${PROJECT_SOURCE_DIR}/platform/win )
	file ( GLOB PLATFORM_SOURCES ${PLATFORM_DIR}/*.cpp  )
elseif (APPLE)
	set ( PLATFORM_DIR ${PROJECT_SOURCE_DIR}/platform/osx )
	file ( GLOB PLATFORM_SOURCES ${PLATFORM_DIR}/*.mm  )
elseif(UNIX)
	set ( PLATFORM_DIR ${PROJECT_SOURCE_DIR}/platform/unix )
	file ( GLOB PLATFORM_SOURCES ${PLATFORM_DIR}/*.cpp  )
endif()

# Locate the daemon sources
file ( GLOB DAEMON_SOURCES 
		${PROJECT_SOURCE_DIR}/*.cpp
		${PROJECT_SOURCE_DIR}/web/*.cpp  
		${PROJECT_SOURCE_DIR}/components/*.cpp  
	)

# Collect resources
file ( GLOB DAEMON_RESOURCES 
		# Get HTML Websites
		${PROJECT_SOURCE_DIR}/html/*.html
		${PROJECT_SOURCE_DIR}/html/*.js
		# Get Icon
		${PLATFORM_DIR}/icon.*
	)

# Locate the common sources
file ( GLOB COMMON_SOURCES ${PROJECT_SOURCE_DIR}/../Common/*.cpp  )

# Collect the hypervisor sources
set( HYPERVISOR_SOURCES "" )
FOREACH(HV ${HV_NAMES}) 
	file ( GLOB HV_CPP ${PROJECT_SOURCE_DIR}/../Hypervisor/${HV}/*.cpp  )
	set( HYPERVISOR_SOURCES ${HV_SOURCES} ${HV_CPP} )
ENDFOREACH(HV)

# Add custom definitions
ADD_DEFINITIONS(-DLOGGING)

# Windows additional definitions
if (WIN32)
	ADD_DEFINITIONS(-DNOMINMAX)   
endif(WIN32)

# Build zlib statically from the resources
add_subdirectory( ${EXTERN_ZLIB} ${CMAKE_BINARY_DIR}/extern/zlib )
include_directories( ${CMAKE_BINARY_DIR}/extern/zlib )
set( LIBZ_LIBRARIES zlibstatic )

# Build libmicrohttpd statically from the resources
add_subdirectory( ${EXTERN_MONGOOSE} ${CMAKE_BINARY_DIR}/extern/mongoose )
set( MONGOOSE_LIBRARIES mongoose )

# Build jsoncpp statically from the resources
add_subdirectory( ${EXTERN_JSONCPP} ${CMAKE_BINARY_DIR}/extern/jsoncpp )
set( JSONCPP_LIBRARIES jsoncpp )

# Include mongoose
include_directories( ${PROJECT_SOURCE_DIR}/../MicroDaemon )

# OSX Frameworks
if (APPLE)

	# Mac OSX Foundations
	find_library(FRAMEWORK_FOUNDATION NAMES Foundation)
	find_library(FRAMEWORK_COCOA NAMES Cocoa)

	# Sources
	add_executable( ${PROJECT_NAME} MACOSX_BUNDLE
		${PLATFORM_SOURCES}
		${DAEMON_SOURCES}
		${COMMON_SOURCES}
		${HYPERVISOR_SOURCES}
		${DAEMON_RESOURCES}
		)
else()

	# Sources
	add_executable( ${PROJECT_NAME}
		${PLATFORM_SOURCES}
		${DAEMON_SOURCES}
		${COMMON_SOURCES}
		${HYPERVISOR_SOURCES}
		)

endif()

# Libraries
target_link_libraries ( ${PROJECT_NAME} ${CURL_LIBRARIES} )
target_link_libraries ( ${PROJECT_NAME} ${OPENSSL_LIBRARIES} )
target_link_libraries ( ${PROJECT_NAME} ${BOOST_LIBRARIES} )
target_link_libraries ( ${PROJECT_NAME} ${LIBZ_LIBRARIES} )
target_link_libraries ( ${PROJECT_NAME} ${MONGOOSE_LIBRARIES} )
target_link_libraries ( ${PROJECT_NAME} ${JSONCPP_LIBRARIES} )

# Link OSX Frameworks
if (APPLE)
	target_link_libraries ( ${PROJECT_NAME} ${FRAMEWORK_FOUNDATION} )
	target_link_libraries ( ${PROJECT_NAME} ${FRAMEWORK_COCOA} )
	set_target_properties( ${PROJECT_NAME} PROPERTIES 
		MACOSX_BUNDLE_INFO_PLIST ${PLATFORM_DIR}/Info.plist
	)
	set_source_files_properties(
		${DAEMON_RESOURCES} PROPERTIES
		MACOSX_PACKAGE_LOCATION Resources
	)
endif()

# Windows additional libraries
if (WIN32)
	target_link_libraries ( ${PROJECT_NAME} wsock32.lib Ws2_32.lib )
endif(WIN32)
