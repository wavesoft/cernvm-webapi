cernvm-webapi
=============

CernVM WebAPI Based on URI-Handlers

Visit the wiki page for tutorials and more information : [https://github.com/wavesoft/cernvm-webapi/wiki](https://github.com/wavesoft/cernvm-webapi/wiki)

Building
========

The __cernvm-webapi__ installation scripts can automatically build all the required dependencies for the project. Hoever in order to be able to build all the components you are going to need the following packages installed:

 * GCC 4.7 or later (requires C++11 support)
 * CMake 2.8.10 or later

You are also going to need the __libcernvm__ project from this repository.

If you are using a decently recent linux installation, you can use the following:

    sudo apt-get install build-essential cmake devscripts libicu-dev

Assuming that you have all the required dependencies in place you can prepare your build folder. There are various preparation scripts in the project root:

 * __prepare-linux32__ : Build the 32-bit linux version
 * __prepare-linux64__ : Build the 64-bit linux version
 * __prepare-vs2012-vt100_xp.bat__ : Build the 32-bit windows version with the VT100 (windows XP) toolchain
 * __prepare-osx-10.7__ : Build the 64-bit OSX version using the 10.7 toolchain
 * __prepare-osx-10.8__ : Build the 64-bit OSX version using the 10.8 toolchain

Here is a step-by step guide for building cernvm-webapi:

    mkdir cernvm
    git clone https://github.com/wavesoft/libcernvm
    git clone https://github.com/wavesoft/cernvm-webapi
    cd cernvm-webapi

According to your system, (here for 64-bit linux)

    ./prepare-linux64
    cd build_linux_64
    make

In a few minutes and if everything works as expected you will have the **cernvm-webapi** binary in the build folder.

API migration notes from 1.x
============================

 * The ```CVM.requestSession``` function does not accept the third parameter any more
 * The session state codes have changed
 * The event ```sessionStateChanged``` is renamed to ```stateChanged```
 * The following events are removed: ```error```, ```open```, ```openError```, ```started```, ```startedError``` 
 * The event ```apiAvailable``` and ```apiUnavailable``` replaced with event ```apiStateChanged```
 
