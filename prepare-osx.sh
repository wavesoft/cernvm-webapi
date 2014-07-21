#!/bin/bash
BUILDDIR=build_osx
[ ! -d $BUILDDIR ] && mkdir $BUILDDIR
cd $BUILDDIR
cmake .. -DCMAKE_BUILD_TYPE=Release -DCRASH_REPORTING=ON -DLOGGING=ON -DTARGET_ARCH="x86_64" -DCMAKE_OSX_ARCHITECTURES="x86_64" -G"Xcode" $*
