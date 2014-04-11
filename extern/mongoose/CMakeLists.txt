cmake_minimum_required(VERSION 2.4.4)
set(CMAKE_ALLOW_LOOSE_LOOP_CONSTRUCTS ON)
project(mongoose C)

# Download information for OpenSSL
set(MONGOOSE_VERSION 5.2)

#############################################################
# DOWNLOAD BOOTSTRAP 
#############################################################

# Setup archive
set( ARCHIVE_URL "https://codeload.github.com/cesanta/mongoose/zip/${MONGOOSE_VERSION}" )
set( ARCHIVE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/mongoose-${MONGOOSE_VERSION}" )
set( ARCHIVE_EXT ".zip" )

# Check if we have the archive
if ( NOT EXISTS ${ARCHIVE_DIR} )
    set( ARCHIVE_FILE "${ARCHIVE_DIR}${ARCHIVE_EXT}" )

    # Make the directory
    FILE( MAKE_DIRECTORY ${ARCHIVE_DIR} )

    # Download the archive
    message( STATUS "Downloading ${PROJECT_NAME} archive" )
    file(DOWNLOAD ${ARCHIVE_URL} ${ARCHIVE_FILE}
        SHOW_PROGRESS STATUS ARCHIVE_DOWNLOAD_STATUS)

    # Check status
    list( GET ARCHIVE_DOWNLOAD_STATUS 0 ARCHIVE_DOWLOAD_ERROR )
    if( ARCHIVE_DOWLOAD_ERROR )

        # Remove file and dir
        file( REMOVE ${ARCHIVE_FILE} )
        file( REMOVE ${ARCHIVE_DIR} )

        # Fatal error
        message( FATAL_ERROR "Could not download ${PROJECT_NAME} archive!" )
    endif()

    # Extract archive
    execute_process(
        COMMAND ${CMAKE_COMMAND} -E tar xzf ${ARCHIVE_FILE}
        WORKING_DIRECTORY ${ARCHIVE_DIR}
    )

endif()

# Get the first sub-directory in the archive
FILE(GLOB _ARCHIVE_SUBDIRS ${ARCHIVE_DIR}/*)
FOREACH( _ARCHIVE_SUBDIR ${_ARCHIVE_SUBDIRS} )
    IF(IS_DIRECTORY ${_ARCHIVE_SUBDIR})
        SET(ARCHIVE_DIR ${_ARCHIVE_SUBDIR})
    ENDIF()
ENDFOREACH()

# Rebase
set( CMAKE_CURRENT_SOURCE_DIR ${ARCHIVE_DIR} )

# Expose project variables to parent
set (MONGOOSE_LIBRARIES ${PROJECT_NAME} PARENT_SCOPE)
set (MONGOOSE_INCLUDE_DIRS ${ARCHIVE_DIR} PARENT_SCOPE)

#############################################################
# BUILD SCRIPT 
#############################################################

# Include directories
include_directories (
    ${ARCHIVE_DIR}
)

# Set sources
file (GLOB MONGOOSE_SRC
    ${ARCHIVE_DIR}/mongoose.c
)

# Link library
add_library (${PROJECT_NAME} STATIC ${MONGOOSE_SRC})
