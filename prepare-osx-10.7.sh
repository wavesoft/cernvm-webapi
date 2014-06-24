#!/bin/bash
BUILDDIR=build_osx_10.7
[ ! -d $BUILDDIR ] && mkdir $BUILDDIR
cd $BUILDDIR
cmake -DSYSTEM_OPENSSL=ON -DSYSTEM_BOOST=ON -DCRASH_REPORTING=ON -DTARGET_ARCH="x86_64" -DCMAKE_OSX_ARCHITECTURES="x86_64" -DCMAKE_OSX_DEPLOYMENT_TARGET="10.7" -G"Xcode" ..