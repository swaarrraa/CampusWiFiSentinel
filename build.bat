@echo off

if not exist bin mkdir bin

g++ -std=c++17 -O2 -pthread ^
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