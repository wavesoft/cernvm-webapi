#!/bin/bash

echo "01: Installing build tools"
./install-deps.sh

echo "02: Creating tarball"
SOURCE_FOLDER=$(./make-tarball.sh)

echo "03: Preparing debian package structure"
./make-debize.sh ${SOURCE_FOLDER}

echo "04: Building debian package"
./make-deb.sh ${SOURCE_FOLDER}
