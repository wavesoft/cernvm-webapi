#!/bin/bash

echo "01: Installing build tools"
./install-deps.sh

echo "02: Creating tarball"
SOURCE_FOLDER=$(./make-tarball.sh)

echo "03: Preparing RPM package structure"
./make-rpmize.sh $(pwd)/${SOURCE_FOLDER}

echo "04: Building RPM package"
./make-rpm.sh $(pwd)/${SOURCE_FOLDER}
