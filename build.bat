@echo off

if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\BrechtSanders.WinLibs.POSIX.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\mingw64\bin\g++.exe" (
    set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\BrechtSanders.WinLibs.POSIX.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\mingw64\bin;%PATH%"
)

if not exist bin mkdir bin

g++ -std=c++17 -O2 -pthread -static ^
backend\main.cpp ^
backend\server\HttpServer.cpp ^
backend\tests\MeasurementEngine.cpp ^
backend\networking\Socket.cpp ^
backend\threading\ThreadPool.cpp ^
backend\database\Database.cpp ^
backend\utils\Logger.cpp ^
-lws2_32 ^
-o bin\campus_wifi_server.exe

if errorlevel 1 goto fail

echo Build successful.
exit /b 0

:fail
echo Build failed.
exit /b 1