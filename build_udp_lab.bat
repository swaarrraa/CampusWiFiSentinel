@echo off
g++ -std=c++17 -O2 backend\networking\UdpLab.cpp -lws2_32 -o bin\UdpLab.exe
if errorlevel 1 goto fail
echo UDP Lab build successful.
exit /b 0

:fail
echo UDP Lab build failed.
exit /b 1