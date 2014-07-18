cmake_minimum_required (VERSION 2.8.10)

# Guess system architecture
set(GUESS_ARCH "i386") 							# 1) Fallback to x86
if(CMAKE_SYSTEM_PROCESSOR) 						# 2) Build on the same processor
	set(GUESS_ARCH ${CMAKE_SYSTEM_PROCESSOR})
	if(${GUESS_ARCH} STREQUAL "AMD64")
		# We don't do any differentiation for AMD64 instruction set
		set(GUESS_ARCH "x86_64")
	endif()
endif()
if(CMAKE_OSX_ARCHITECTURES)						# 3) Lookup on OSX Architectures
	set(GUESS_ARCH ${CMAKE_OSX_ARCHITECTURES})
elseif ("${CMAKE_GENERATOR}" MATCHES "Win64") 	# 4) Lookup on Windows Generator
	set(GUESS_ARCH "x86_64")
endif()

# Prompt architecture
set(TARGET_ARCH "${GUESS_ARCH}" CACHE STRING "Override the identified target architecture (x86_64 or i386)" )
message(STATUS "Building cernvm-webapi for arch: ${TARGET_ARCH}")

# Change OSX architectures
if (APPLE)
	set(CMAKE_OSX_ARCHITECTURES ${TARGET_ARCH})
	set(OSX_ARCHITECTURES ${TARGET_ARCH})
endif()

# Logging option
option(LOGGING "Set to ON to enable verbose logging on screen" OFF)
option(CRASH_REPORTING "Set to ON to enable crash reporting" OFF)

# CernVM Library
project ( cernvm-webapi )
set(VERSION "2.0.3")

# Include additional libraries
include(cmake/AddCompileLinkFlags.cmake)

#############################################################
# CERNVM LIBRARY 
#############################################################

# CernVM Library sources
set( CERNVM_LIBSRC "../libcernvm" CACHE STRING "Specify the root directory of the libcernvm sources" )
set( USE_SYSTEM_LIBS 0 )

# Include sub-project
add_subdirectory( ${CERNVM_LIBSRC} libcernvm )

#############################################################
# LIBRARIES 
#############################################################

# For every library, we give the option to the project that
# includes us to provide them by itself.
#
# If not, we will try our best to build them as our child
# libraries (statically).
#
# To define a library, you must define the following two directives:
#   XXXXXX_LIBRARIES : Which contain the name(s) of the libraries
#	XXXXXX_INCLUDE 	 : Which contain the additiona include directories
#

#
# [Mongoose] For the Web Server
#
set( MONGOOSE_MODE "EXTERN" )
if ( NOT DEFINED(MONGOOSE_LIBRARIES) OR NOT DEFINED(MONGOOSE_INCLUDE_DIRS) )

	# We are shipping mongoose with the project
	set( EXTERN_MONGOOSE "extern/mongoose" )
	add_subdirectory( ${EXTERN_MONGOOSE} ${CMAKE_BINARY_DIR}/${EXTERN_MONGOOSE} )

	# Log
	set( MONGOOSE_MODE "LOCAL" )
	message( STATUS "Using Mongoose shipped with libcernvm")

else()
	message( STATUS "Using Mongoose from: ${MONGOOSE_INCLUDE_DIRS}")

endif()

# Include libraries
set( PROJECT_INCLUDES
	${MONGOOSE_INCLUDE_DIRS}
)

# Collect library names
set( PROJECT_LIBRARIES 
	${MONGOOSE_LIBRARIES}
	rt
)
	

#############################################################
# SOURCES 
#############################################################

# Add custom definitions
if (LOGGING)
	add_definitions(-DLOGGING)
endif()
if (CRASH_REPORTING)
	add_definitions(-DCRASH_REPORTING)
endif()

# Fixes for windows
if (WIN32)
	# Fix: Disable Min/Max macros
	ADD_DEFINITIONS(-DNOMINMAX)   
	# Fix: For some reason CURL_STATICLIB is not defined
	ADD_DEFINITIONS(-DCURL_STATICLIB)
endif(WIN32)

# Locate platform-dependant sources
if (WIN32)
	set ( PLATFORM_DIR ${PROJECT_SOURCE_DIR}/src/platform/win )
	file ( GLOB PLATFORM_SOURCES ${PLATFORM_DIR}/*.cpp ${PLATFORM_DIR}/*.rc )
elseif (APPLE)
	set ( PLATFORM_DIR ${PROJECT_SOURCE_DIR}/src/platform/osx )
	file ( GLOB PLATFORM_SOURCES ${PLATFORM_DIR}/*.mm  )
elseif(UNIX)
	set ( PLATFORM_DIR ${PROJECT_SOURCE_DIR}/src/platform/unix )
	file ( GLOB PLATFORM_SOURCES ${PLATFORM_DIR}/*.cpp  )
endif()

# Locate the daemon sources
file ( GLOB WEBAPI_SOURCES 
		${PROJECT_SOURCE_DIR}/src/*.cpp
		${PROJECT_SOURCE_DIR}/src/web/*.cpp  
		${PROJECT_SOURCE_DIR}/src/components/*.cpp  
	)

# Collect resources
file ( GLOB WEBAPI_RESOURCES
		RELATIVE ${PROJECT_SOURCE_DIR}/src/html
		# Get HTML Websites
		${PROJECT_SOURCE_DIR}/src/html/*.html
		${PROJECT_SOURCE_DIR}/src/html/*.js
	)

# Setup includes
include_directories( ${PROJECT_SOURCE_DIR}/src )
include_directories( ${CERNVM_INCLUDE_DIRS} )
include_directories( ${PROJECT_INCLUDES} )

#############################################################
# GENERATED SOURCES
#############################################################

# Lookup perl, we need it 
find_package(Perl)
if(NOT PERL_FOUND)
    message( FATAL_ERROR "CernVM-WebAPI requires perl for building. On windows try ActivePerl (http://www.activestate.com/activeperl)" )
endif()

# Pick a filename where to place the embedded file contents
set( GEN_RESOURCES_C "${PROJECT_BINARY_DIR}/generated_data.cpp" )

# Collect resources and build executable
execute_process(
	COMMAND ${PERL_EXECUTABLE} "${PROJECT_SOURCE_DIR}/tools/mkdata.pl" ${WEBAPI_RESOURCES}
	OUTPUT_FILE ${GEN_RESOURCES_C}
	WORKING_DIRECTORY ${PROJECT_SOURCE_DIR}/src/html
	)

#############################################################
# TARGET & LINK
#############################################################

# Add executable, depending on the platform
if (APPLE)

	# Mac OSX Foundations
	find_library(FRAMEWORK_FOUNDATION NAMES Foundation)
	find_library(FRAMEWORK_COCOA NAMES Cocoa)

	# Sources
	add_executable( ${PROJECT_NAME} MACOSX_BUNDLE
		${PLATFORM_SOURCES}
		${WEBAPI_SOURCES}
		${GEN_RESOURCES_C}
		${PLATFORM_DIR}/icon.icns
		)

elseif (WIN32)

	# Sources
	add_executable( ${PROJECT_NAME} WIN32
		${PLATFORM_SOURCES}
		${GEN_RESOURCES_C}
		${WEBAPI_SOURCES}
		)

else()

	# Sources
	add_executable( ${PROJECT_NAME}
		${PLATFORM_SOURCES}
		${GEN_RESOURCES_C}
		${WEBAPI_SOURCES}
		)

endif()

# On linux we should add a flag to define the architecture we are building for
if (UNIX)
	if ("${TARGET_ARCH}" STREQUAL "x86_64")
		add_compile_flags( ${PROJECT_NAME} -m64 )
	else()
		add_compile_flags( ${PROJECT_NAME} -m32 )
	endif()
endif()

# Post-target Fixes for windows
if (WIN32)
	
	# Fix: OpenSSL builds are not built with safe exception handlers
	add_link_flags( ${PROJECT_NAME} "/SAFESEH:NO" )

endif(WIN32)

# Libraries
target_link_libraries ( ${PROJECT_NAME} ${CERNVM_LIBRARIES} )
target_link_libraries ( ${PROJECT_NAME} ${PROJECT_LIBRARIES} )

# Link OSX Frameworks
if (APPLE)
	target_link_libraries ( ${PROJECT_NAME} ${FRAMEWORK_FOUNDATION} )
	target_link_libraries ( ${PROJECT_NAME} ${FRAMEWORK_COCOA} )
	set_target_properties( ${PROJECT_NAME} PROPERTIES 
		MACOSX_BUNDLE_INFO_PLIST ${PLATFORM_DIR}/Info.plist
	)

	# Embed icon in the archive
	set_source_files_properties(
		${PLATFORM_DIR}/icon.icns PROPERTIES
		MACOSX_PACKAGE_LOCATION Resources
	)

endif()

# Installation rules for linux (for archive packaging)
if (UNIX)

	# Binary archive
	install(
		TARGETS
        	cernvm-webapi
        RUNTIME DESTINATION
			${CMAKE_INSTALL_PREFIX}/bin
		)

	# Resources (icons)
	install(
		FILES
			${PLATFORM_DIR}/icon.png
			${PLATFORM_DIR}/icon.svg
		DESTINATION
			${CMAKE_INSTALL_PREFIX}/share/cernvm-webapi
		)

	# Desktop files (for Mime-Type registration)
	install(
		FILES
			${PLATFORM_DIR}/CernVM WebAPI.desktop
		DESTINATION
			/usr/share/applications
		)

endif()
