@echo off
if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\BrechtSanders.WinLibs.POSIX.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\mingw64\bin\g++.exe" (
    set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\BrechtSanders.WinLibs.POSIX.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\mingw64\bin;%PATH%"
)
if not exist bin mkdir bin
g++ -std=c++17 -O2 -static load_testing\stress_client.cpp -lws2_32 -o bin\stress_client.exe
if errorlevel 1 exit /b 1
echo Stress client built.
echo Example: bin\stress_client.exe 192.168.1.10 8080 50
