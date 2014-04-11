cmake_minimum_required (VERSION 2.8)

# Guess system architecture
set(GUESS_ARCH "i386")
if(CMAKE_SYSTEM_PROCESSOR)
	set(GUESS_ARCH ${CMAKE_SYSTEM_PROCESSOR})
endif()
if(CMAKE_OSX_ARCHITECTURES)
	set(GUESS_ARCH ${CMAKE_OSX_ARCHITECTURES})
endif()
# We don't do any differentiation for AMD64 instruction set
if(${GUESS_ARCH} STREQUAL "AMD64")
	set(GUESS_ARCH "x86_64")
endif()

# Prompt architecture
set(TARGET_ARCH "${GUESS_ARCH}" CACHE STRING "Define the target architecture" )
set(CMAKE_OSX_ARCHITECTURES ${TARGET_ARCH})
set(OSX_ARCHITECTURES ${TARGET_ARCH})
message(STATUS "Building cernvm-webapi for arch: ${TARGET_ARCH}")

# Logging option
set(LOGGING_ENABLED 0 CACHE STRING "Define the target architecture" )

# CernVM Library
project ( cernvm-webapi )
set(VERSION "1.0.0")

# Include additional libraries
include(cmake/AddCompileLinkFlags.cmake)

#############################################################
# CERNVM LIBRARY 
#############################################################

# CernVM Library sources
set( CERNVM_LIBSRC "../libcernvm" )
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
)

#############################################################
# SOURCES 
#############################################################

# Fixes for windows
if (WIN32)
	# Fix: Disable Min/Max macros
	ADD_DEFINITIONS(-DNOMINMAX)   
	# Fix: For some reason CURL_STATICLIB is not defined
	ADD_DEFINITIONS(-DCURL_STATICLIB)
endif(WIN32)

# Locate the common sources
file ( GLOB CERNVM_WEBAPI_SOURCES ${PROJECT_SOURCE_DIR}/src/*.cpp  )

# Setup includes
include_directories( ${PROJECT_SOURCE_DIR}/src )
include_directories( ${CERNVM_INCLUDE_DIRS} )
include_directories( ${PROJECT_INCLUDES} )

# Add executable
add_executable( ${PROJECT_NAME} 
	${CERNVM_WEBAPI_SOURCES}
	)

# Post-target Fixes for windows
if (WIN32)
	# Fix: OpenSSL builds are not built with safe exception handlers
	my_add_link_flags( ${PROJECT_NAME} "/SAFESEH:NO")
endif(WIN32)

# Libraries
target_link_libraries ( ${PROJECT_NAME} ${CERNVM_LIBRARIES} )
target_link_libraries ( ${PROJECT_NAME} ${PROJECT_LIBRARIES} )
