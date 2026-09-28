@echo off
if not exist bin mkdir bin
g++ -std=c++17 -O2 load_testing\stress_client.cpp -lws2_32 -o bin\stress_client.exe
if errorlevel 1 exit /b 1
echo Stress client built.
echo Example: bin\stress_client.exe 192.168.1.10 8080 50
