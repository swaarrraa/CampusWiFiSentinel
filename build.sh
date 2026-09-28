#!/usr/bin/env bash
set -e
mkdir -p bin
g++ -std=c++17 -O2 -pthread backend/*.cpp backend/server/*.cpp backend/tests/*.cpp backend/networking/*.cpp backend/threading/*.cpp backend/database/*.cpp backend/utils/*.cpp -o bin/campus_wifi_server
