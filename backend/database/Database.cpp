#include "Database.h"
#include <fstream>
#include <sstream>
#include <filesystem>
Database::Database(std::string f):file(std::move(f)){init();}
void Database::init(){std::filesystem::create_directories(std::filesystem::path(file).parent_path()); std::lock_guard<std::mutex>l(m); std::ifstream in(file); if(!in.good()){std::ofstream o(file);o<<"timestamp,location,device,latitude,longitude,throughput_mbps,latency_ms,loss_pct,retransmission_proxy_pct,latency_samples,bytes,duration_ms\n";}}
static std::string q(const std::string&s){std::string x=s; size_t p=0; while((p=x.find(',',p))!=std::string::npos)x.replace(p++,1," "); return x;}
void Database::insert(const TestResult&r){std::lock_guard<std::mutex>l(m);std::ofstream o(file,std::ios::app);o<<q(r.timestamp)<<","<<q(r.locationName)<<","<<q(r.device)<<","<<r.latitude<<","<<r.longitude<<","<<r.throughputMbps<<","<<r.latencyMs<<","<<r.packetLossPct<<","<<r.retransmissionProxyPct<<","<<r.latencySamples<<","<<r.bytes<<","<<r.durationMs<<"\n";}
std::vector<TestResult> Database::all(){std::lock_guard<std::mutex>l(m);std::vector<TestResult>v;std::ifstream in(file);std::string line;std::getline(in,line);while(std::getline(in,line)){std::stringstream s(line);std::vector<std::string> a;std::string x;while(std::getline(s,x,','))a.push_back(x);if(a.size()<12)continue;TestResult r;r.timestamp=a[0];r.locationName=a[1];r.device=a[2];r.latitude=a[3];r.longitude=a[4];r.throughputMbps=std::stod(a[5]);r.latencyMs=std::stod(a[6]);r.packetLossPct=std::stod(a[7]);r.retransmissionProxyPct=std::stod(a[8]);r.latencySamples=std::stoi(a[9]);r.bytes=std::stoll(a[10]);r.durationMs=std::stod(a[11]);v.push_back(r);}return v;}
