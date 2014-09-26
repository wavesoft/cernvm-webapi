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
[ ${WORK_DIR:0:14} != "cernvm-webapi-" ] && echo "Invalid directory name ${WORK_DIR}" && exit 2
UPSTREAM_VERSION=$(echo ${WORK_DIR} | sed -r 's/cernvm-webapi-([0-9\.]+).*/\1/')
echo "Creating cernvm-webapi source package for version ${UPSTREAM_VERSION}"

# Start operations
export HOME=${WORK_DIR}
rpmdev-setuptree
