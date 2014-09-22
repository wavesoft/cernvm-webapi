@echo off

set CONFIG=Release
if %1%a==a goto begin_config
set CONFIG=%1
if %CONFIG%==Release goto begin_config
if %CONFIG%==Debug goto begin_config
echo Configuration can either be 'Debug' or 'Release'!
goto end

:begin_config
set BUILDDIR=build_vs2012_t100_xp-%CONFIG%
if not exist "%BUILDDIR%" mkdir "%BUILDDIR%"
cd "%BUILDDIR%"
cmake -DCMAKE_BUILD_TYPE=%CONFIG% -DCRASH_REPORTING=ON -DTARGET_ARCH="i386" -G"Visual Studio 11" -T"v110_xp" ..

:end