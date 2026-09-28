# Campus WiFi Sentinel

A C++17 multithreaded campus WiFi measurement platform.

## Features
- C++17 TCP measurement server
- Thread-pool based concurrent client handling
- Real TCP throughput test with configurable payload
- TCP echo RTT/latency test with repeated samples
- Application-level sequence tracking for missing chunks
- Persistent CSV result database (zero third-party DB dependency)
- Lightweight HTTP API + dashboard served by the same C++ process
- GPS/manual location capture in browser
- Leaflet campus heatmap/map markers
- Historical statistics and charts
- C++ load-testing client for concurrency demonstrations
- Windows build script using MinGW g++

## Build on Windows
Open CMD in this directory:

    build.bat

Then:

    bin\campus_wifi_server.exe

Open http://localhost:8080 on the laptop. For a phone on the same WiFi, use the laptop IPv4 address from `ipconfig`, for example `http://192.168.1.10:8080`.

## Linux
    chmod +x build.sh
    ./build.sh
    ./bin/campus_wifi_server

## Important networking note
A normal browser cannot expose the phone's kernel TCP retransmission counters to JavaScript. This project therefore reports application-level missing chunks plus a clearly-labelled retransmission/loss proxy. A native Linux `TCP_INFO` integration is documented in docs/retransmission.md for the advanced extension.

## Project architecture
Browser -> C++ HTTP API -> C++ test engine -> TCP measurement connections -> C++ TCP server -> CSV database.

The HTTP/API server and TCP measurement server share the same C++ process and thread pool. This makes the multithreading requirement visible and easy to demonstrate.
