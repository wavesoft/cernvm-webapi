#!/bin/bash

TARBALL="$1"
[ -z "$TARBALL" ] && echo "ERROR: Please specify the upstream source code tarball!" 1>&2 && exit 1
[ ! -f "$TARBALL" ] && echo "ERROR: The specified argument is not a file!" 1>&2 && exit 1

# Detect version
[ ${TARBALL:0:14} != "cernvm-webapi_" ] && echo "ERROR: Invalid directory name ${TARBALL}" 1>&2 && exit 1
UPSTREAM_VERSION=$(echo ${TARBALL} | sed -r 's/cernvm-webapi_([0-9\.]+)\..*/\1/')
[ -z "$UPSTREAM_VERSION" ] && echo "ERROR: Could not identify version!" 1>&2 && exit 1
echo "INFO: Creating cernvm-webapi source package for version ${UPSTREAM_VERSION}" 1>&2

# Make workdir
WORK_DIR=cernvm-webapi-${UPSTREAM_VERSION}
[ ! -d ${WORK_DIR} ] && mkdir ${WORK_DIR}

# Start operations
export HOME=${WORK_DIR}
rpmdev-setuptree

# Move tarball to sources
mv ${TARBALL} ${WORK_DIR}/rpmbuild/SOURCES/$(basename ${TARBALL})

# Create spec file
cat <<EOF > ${WORK_DIR}/rpmbuild/SPECS/cernvm-webapi.spec
Summary:            CernVM WebAPI interface application
Name:               cernvm-webapi
Version:            ${UPSTREAM_VERSION}
Release:            1%{?dist}
License:            GPLv3+
Group:              Applications/Internet
Source:             %{name}_%{version}.orig.tar.gz
URL:                http://cernvm.cern.ch

%description
A secure mechanism that allows web applications to interact with virtual machines
in the user's computer.

%prep
%setup -n %{name}-%{version}

%build
make %{?_smp_mflags}

%install
rm -rf  %{buildroot}
make install DESTDIR=%{buildroot}/usr
rm %{buildroot}/usr/lib/libcurl.a
rmdir %{buildroot}/usr/lib

%files
%{_bindir}/*
%{_datadir}/*

%post

# Check who's running X and run cernvm-webapi as that user
X_TTY=\$(ps ax | grep bin/X | awk '{ print \$2 }' | head -n1)
X_USER=\$(who | grep \$X_TTY | awk '{ print \$1 }' | head -n1)
if [ ! -z "\$X_USER" ]; then
    su -c "/usr/bin/cernvm-webapi install" \$X_USER&
fi

%changelog
EOF
