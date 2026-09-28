# Architecture

Browser UI → HTTP/TCP socket → C++17 thread pool → measurement endpoints → CSV persistence → REST-like JSON endpoints → Leaflet dashboard.

Every accepted TCP connection is handed to a worker in a 12-thread pool. A 10 MB endpoint intentionally creates a sustained TCP transfer, so congestion control, buffering and the actual WiFi path affect the observed throughput.
