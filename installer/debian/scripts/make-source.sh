#!/bin/bash

TARBALL="$1"
[ -z "$TARBALL" ] && echo "Please specify the upstream source code (folder or tarball)!" && exit 1

# Extract tarball
WORK_DIR=""
if [ -f "${TARBALL}" ]; then
	TMP_DIR=$(mktemp -d)
	tar -C "${TMP_DIR}" -zxf "${TARBALL}"
else
	WORK_DIR="${TARBALL}"
fi

# Detect version
[ ${WORK_DIR:0:14} != "cernvm-webapi" ] && echo "Invalid directory name ${WORK_DIR}" && exit 2
UPSTREAM_VERSION=$(echo ${WORK_DIR} | sed -r 's/cernvm-webapi-([0-9\.]+)/\1/')
echo "Creating cernvm-webapi source package for version ${UPSTREAM_VERSION}"

# Start operations
[ ! -d ${WORK_DIR}/debian ] && mkdir ${WORK_DIR}/debian
cd ${WORK_DIR}

# Prepare control file
cat <<EOF > debian/control
Source: cernvm-webapi
Maintainer: Ioannis Charalampidis <icharala@cern.ch>
Section: misc
Priority: optional
Standards-Version: ${UPSTREAM_VERSION}
Build-Depends: debhelper (>= 9), build-essential, libicu-dev, cmake
Homepage: http://www.cernvm.cern.ch

Package: cernvm-webapi
Architecture: any
Depends: \${shlibs:Depends}, \${misc:Depends}
Description: CernVM WebAPI
 A secure mechanism that allows web applications to interact with virtual machines
 in the user's computer.
EOF

# Create compatibility version
cat <<EOF > debian/compat
9
EOF

# Create copyright
cat <<EOF > debian/copyright
EOF

# Create riles
cat <<EOF > debian/rules
#!/usr/bin/make -f
%:
	dh \$@

override_dh_auto_install:
	$(MAKE) DESTDIR=\$$(pwd)/debian/cernvm-webapi install

EOF

# Create source format
mkdir -p debian/source
cat <<EOF > debian/source/format
3.0 (quilt)
EOF

# Create changelog
dch --create -v ${UPSTREAM_VERSION}-1 --package cernvm-webapi
