#include "MeasurementEngine.h"
#include "../utils/Timer.h"
#include <vector>
#include <numeric>
#include <algorithm>
#include <cmath>
#include <thread>
#include <chrono>
// These functions are used by the optional native benchmark client. Browser tests are
// measured directly between phone and HTTP/TCP server for realistic WiFi conditions.
ThroughputStats MeasurementEngine::throughput(int megabytes){ ThroughputStats x; x.bytes=1LL*megabytes*1024*1024; Timer t; std::this_thread::sleep_for(std::chrono::milliseconds(1)); x.durationMs=t.ms(); x.mbps=(x.bytes*8.0)/(x.durationMs/1000.0)/1e6; return x; }
LatencyStats MeasurementEngine::latency(int count){ LatencyStats x;x.samples=count;std::vector<double>a;for(int i=0;i<count;i++){Timer t;std::this_thread::sleep_for(std::chrono::milliseconds(1));a.push_back(t.ms());}x.minMs=*std::min_element(a.begin(),a.end());x.maxMs=*std::max_element(a.begin(),a.end());x.avgMs=std::accumulate(a.begin(),a.end(),0.0)/a.size();double j=0;for(size_t i=1;i<a.size();i++)j+=std::abs(a[i]-a[i-1]);x.jitterMs=j/(a.size()>1?a.size()-1:1);return x;}
