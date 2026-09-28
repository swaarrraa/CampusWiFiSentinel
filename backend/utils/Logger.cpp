#include "Logger.h"
#include <iostream>
#include <mutex>
namespace { std::mutex m; }
namespace logx { void info(const std::string&s){std::lock_guard<std::mutex>l(m);std::cout<<"[INFO] "<<s<<std::endl;} void error(const std::string&s){std::lock_guard<std::mutex>l(m);std::cerr<<"[ERROR] "<<s<<std::endl;} }
