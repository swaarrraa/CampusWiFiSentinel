#include "ThreadPool.h"
ThreadPool::ThreadPool(size_t count){ for(size_t i=0;i<count;i++) workers.emplace_back([this]{worker();}); }
ThreadPool::~ThreadPool(){ {std::lock_guard<std::mutex> l(m); stopping=true;} cv.notify_all(); for(auto &t:workers) if(t.joinable()) t.join(); }
void ThreadPool::enqueue(std::function<void()> job){ {std::lock_guard<std::mutex> l(m); jobs.push(std::move(job));} cv.notify_one(); }
void ThreadPool::worker(){ while(true){ std::function<void()> j; {std::unique_lock<std::mutex> l(m); cv.wait(l,[this]{return stopping||!jobs.empty();}); if(stopping&&jobs.empty()) return; j=std::move(jobs.front()); jobs.pop();} try{j();}catch(...){ } } }
