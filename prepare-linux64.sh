#!/bin/bash
CONFIG=Release
if [ ! -z "$1" ]; then
	[ "$1" != "Debug" -a "$1" != "Release" ] && echo "Configuration can either be 'Debug' or 'Release'!" && exit 1  
	CONFIG=$1
	shift
fi
BUILDDIR=build_linux_amd64-${CONFIG}
[ ! -d $BUILDDIR ] && mkdir $BUILDDIR
cd $BUILDDIR
cmake .. -DCMAKE_BUILD_TYPE=${CONFIG} -DSYSTEM_OPENSSL=ON -DCRASH_REPORTING=ON -DTARGET_ARCH="x86_64" $*

