#!/bin/bash

# Fetch sources from git
GIT_DIR=$(mktemp -d)
(
	cd $GIT_DIR
	echo "INFO: Fetching cernvm-webapi from git..." 1>&2
	git clone https://github.com/wavesoft/cernvm-webapi.git 2>/dev/null >/dev/null
	[ $? -ne 0 ] && echo "ERROR: Could not check-out cernvm-webapi!" 1>&2 && exit 1
	echo "INFO: Fetching libcernvm from git..." 1>&2
	git clone https://github.com/wavesoft/libcernvm.git 2>/dev/null >/dev/null
	[ $? -ne 0 ] && echo "ERROR: Could not check-out libcernvm!" 1>&2 && exit 1
)

# Detect version
UPSTREAM_VERSION=$(cat ${GIT_DIR}/cernvm-webapi/src/config.h | grep -i CERNVM_WEBAPI_VERSION | awk '{print $3}' | tr -d '"')

# Create a Makefile that steer the build process
cat <<EOF > ${GIT_DIR}/Makefile
BUILDDIR = build
SOURCE_DIR = cernvm-webapi
CMAKE_BIN = $(which cmake)

all: binary

prepare:
	mkdir -p \$(BUILDDIR)
	cd \$(BUILDDIR); \$(CMAKE_BIN) -DSYSTEM_OPENSSL=ON -DCMAKE_BUILD_TYPE=Release -DCRASH_REPORTING=ON -DTARGET_ARCH=$(uname -p) -DCMAKE_INSTALL_PREFIX=\$(DESTDIR) -DINSTALL_ETC=\$(ETCDIR) ../\$(SOURCE_DIR)

binary: prepare
	make -C \$(BUILDDIR)

install: 
	cd \$(BUILDDIR); \$(CMAKE_BIN) -P cmake_install.cmake

clean:
	rm -rf \$(BUILDDIR)

.PHONY: all prepare binary install clean
EOF

# Move license & readme files to the root folder
mv "${GIT_DIR}/cernvm-webapi/LICENSE" "${GIT_DIR}"
mv "${GIT_DIR}/cernvm-webapi/README.md" "${GIT_DIR}"

# Put everything in the archive folder
ARCHIVE_FOLDER=cernvm-webapi-${UPSTREAM_VERSION}
echo "INFO: Creating archive ${ARCHIVE_FOLDER}..." 1>&2
mkdir ${GIT_DIR}/${ARCHIVE_FOLDER}
mv ${GIT_DIR}/{cernvm-webapi,libcernvm,Makefile,LICENSE,README.md} ${GIT_DIR}/${ARCHIVE_FOLDER}

# Create archive
tar -zcf cernvm-webapi_${UPSTREAM_VERSION}.orig.tar.gz -C "${GIT_DIR}" ${ARCHIVE_FOLDER} 2>/dev/null >/dev/null

# Move archive dir to the current dir
mv "${GIT_DIR}/${ARCHIVE_FOLDER}" "${ARCHIVE_FOLDER}"
rmdir "${GIT_DIR}"
echo ${ARCHIVE_FOLDER}
