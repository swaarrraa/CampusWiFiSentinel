#pragma once
#include <chrono>
class Timer { std::chrono::steady_clock::time_point t; public: Timer():t(std::chrono::steady_clock::now()){} double ms() const{return std::chrono::duration<double,std::milli>(std::chrono::steady_clock::now()-t).count();} };
