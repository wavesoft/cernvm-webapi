#!/bin/bash

SOURCE_DIR="$1"
[ -z "$SOURCE_DIR" ] && echo "Please specify the project's source package folder!" && exit 1
[ ! -d "${SOURCE_DIR}" ] && echo "The specified directory is not valid!" && exit 2

# Enter directory & build
export HOME=${SOURCE_DIR}
cd ${SOURCE_DIR}/rpmbuild/SPECS
rpmbuild -ba cernvm-webapi.spec
