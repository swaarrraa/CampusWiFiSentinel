#pragma once
#include <string>
struct LatencyStats { double minMs=0,maxMs=0,avgMs=0,jitterMs=0; int samples=0; };
struct ThroughputStats { double mbps=0,durationMs=0; long long bytes=0; };
class MeasurementEngine {
public:
 static ThroughputStats throughput(int megabytes=10);
 static LatencyStats latency(int count=10);
};
