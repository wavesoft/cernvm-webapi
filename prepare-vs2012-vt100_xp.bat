@echo off
set BUILDDIR=build_vs2012_t100_xp
if not exist "%BUILDDIR%" mkdir "%BUILDDIR%"
cd "%BUILDDIR%"
cmake -DCRASH_REPORTING=ON -DTARGET_ARCH="i386" -G"Visual Studio 11" -T"v110_xp" ..
cd ..
