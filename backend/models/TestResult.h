#pragma once
#include <string>
struct TestResult {
 std::string timestamp, locationName, device, latitude, longitude;
 double throughputMbps=0, latencyMs=0, packetLossPct=0, retransmissionProxyPct=0;
 int latencySamples=0; long long bytes=0; double durationMs=0;
};
