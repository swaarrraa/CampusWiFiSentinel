# Demonstration plan

1. Start the C++ server.
2. Open the dashboard on the laptop and then from a phone on the same WiFi using the laptop's LAN IP.
3. Run tests in at least five campus locations.
4. Use manual indoor tags when GPS is unreliable.
5. Capture screenshots of green, yellow and red locations.
6. Compile `load_testing/stress_client.cpp` separately and run 10, 25, 50 and 100 users against `/api/ping`.
7. Compare wall time and failures to discuss why a thread pool is preferable to one blocking client handler.
