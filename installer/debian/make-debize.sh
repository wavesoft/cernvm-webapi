#!/bin/bash

WORK_DIR="$1"
[ -z "$WORK_DIR" ] && echo "ERROR: Please specify the upstream source code folder!" 1>&2 && exit 1

# Extract tarball
[ ! -d "${WORK_DIR}" ] && echo "ERROR: The specified parameter is not folder!" 1>&2 && exit 1

# Detect version
[ ${WORK_DIR:0:14} != "cernvm-webapi-" ] && echo "Invalid directory name ${WORK_DIR}" && exit 2
UPSTREAM_VERSION=$(echo ${WORK_DIR} | sed -r 's/cernvm-webapi-([0-9\.]+)/\1/')
echo "INFO: Creating cernvm-webapi source package for version ${UPSTREAM_VERSION}" 1>&2

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
####################################################################
#                     cernvm-webapi                                #
####################################################################

This file is part of CernVM Web API Plugin.

CVMWebAPI is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

CVMWebAPI is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with CVMWebAPI. If not, see <http://www.gnu.org/licenses/>.

Developed by Ioannis Charalampidis 2013-2014
Contact: <ioannis.charalampidis[at]cern.ch>
EOF

# Create riles
cat <<EOF > debian/rules
#!/usr/bin/make -f
%:
	dh \$@

override_dh_auto_install:
	\$(MAKE) DESTDIR=\$\$(pwd)/debian/cernvm-webapi/usr install
	rm -rf \$\$(pwd)/debian/cernvm-webapi/usr/lib
	ln -s \$\$(pwd)/debian/cernvm-webapi/usr/share/applications/cernvm-webapi.desktop \$\$(pwd)/debian/cernvm-webapi/usr/share/xsessions/cernvm-webapi.desktop

EOF

# Create post-install script
cat <<EOF > debian/postinst
#!/bin/sh
# postinst script for webpy-example
#
# see: dh_installdeb(1)


# Update desktop icon
update-desktop-database

# Check who's running X and run cernvm-webapi as that user
X_TTY=\$(ps ax | grep bin/X | awk '{ print \$2 }' | head -n1)
X_USER=\$(who | grep \$X_TTY | awk '{ print \$1 }' | head -n1)
if [ ! -z "\$X_USER" ]; then
    su -c "/usr/bin/cernvm-webapi install" \$X_USER&
fi

# dh_installdeb will replace this with shell code automatically
# generated by other debhelper scripts.

#DEBHELPER#

exit 0
EOF
chmod +x debian/postinst

# Create source format
mkdir -p debian/source
cat <<EOF > debian/source/format
3.0 (quilt)
EOF

# Create changelog
[ ! -f debian/changelog ] && dch --create -v ${UPSTREAM_VERSION} --package cernvm-webapi
