#pragma once
#include <functional>
#include <thread>
#include <vector>
#include <queue>
#include <mutex>
#include <condition_variable>
class ThreadPool {
 std::vector<std::thread> workers; std::queue<std::function<void()>> jobs;
 std::mutex m; std::condition_variable cv; bool stopping=false;
 void worker();
public:
 explicit ThreadPool(size_t count); ~ThreadPool();
 void enqueue(std::function<void()> job);
 size_t size() const { return workers.size(); }
};
