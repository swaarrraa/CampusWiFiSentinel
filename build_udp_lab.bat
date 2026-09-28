@echo off
if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\BrechtSanders.WinLibs.POSIX.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\mingw64\bin\g++.exe" (
    set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\BrechtSanders.WinLibs.POSIX.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\mingw64\bin;%PATH%"
)
if not exist bin mkdir bin
g++ -std=c++17 -O2 -static backend\networking\UdpLab.cpp -lws2_32 -o bin\UdpLab.exe
if errorlevel 1 goto fail
echo UDP Lab build successful.
exit /b 0

:fail
echo UDP Lab build failed.
exit /b 1