#!/bin/bash

# Fetch sources from git
GIT_DIR=$(mktemp -d)
(
	cd $GIT_DIR
	git clone https://github.com/wavesoft/cernvm-webapi.git 2>&1 >/dev/null
	[ $? -ne 0 ] && echo "ERROR: Could not check-out cernvm-webapi!" 1>&2 && exit 1
	git clone https://github.com/wavesoft/libcernvm.git 2>&1 >/dev/null
	[ $? -ne 0 ] && echo "ERROR: Could not check-out libcernvm!" 1>&2 && exit 1
)

# Detect version
UPSTREAM_VERSION=$(cat ${GIT_DIR}/cernvm-webapi/src/config.h | grep -i CERNVM_WEBAPI_VERSION | awk '{print $3}' | tr -d '"')

# Create a Makefile that steer the build process
cat <<EOF > ${GIT_DIR}/Makefile
BUILDDIR = build
SOURCE_DIR = cernvm-webapi
CMAKE_BIN = cmake

all: binary

prepare:
	mkdir -p \$(BUILDDIR)
	cd \$(BUILDDIR); \$(CMAKE_BIN) -DSYSTEM_OPENSSL=ON -DCMAKE_BUILD_TYPE=Release -DCRASH_REPORTING=ON -DTARGET_ARCH="x86_64" -DCMAKE_INSTALL_PREFIX=\$(DESTDIR) ../\$(SOURCE_DIR)

binary: prepare
	make -C \$(BUILDDIR)

install: 
	cd \$(BUILDDIR); \$(CMAKE_BIN) -P cmake_install.cmake

clean:
	rm -rf \$(BUILDDIR)

.PHONY: all prepare binary install clean
EOF

# Put everything in the archive folder
ARCHIVE_FOLDER=cernvm-webapi-${UPSTREAM_VERSION}
mkdir ${GIT_DIR}/${ARCHIVE_FOLDER}
mv ${GIT_DIR}/{cernvm-webapi,libcernvm,Makefile} ${GIT_DIR}/${ARCHIVE_FOLDER}

# Create archive
tar -zcf cernvm-webapi_${UPSTREAM_VERSION}.orig.tar.gz -C "${GIT_DIR}" ${ARCHIVE_FOLDER}

# Move archive dir to the current dir
mv "${GIT_DIR}/${ARCHIVE_FOLDER}" "${ARCHIVE_FOLDER}"
rmdir "${GIT_DIR}"

