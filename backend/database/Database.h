#pragma once
#include "../models/TestResult.h"
#include <string>
#include <mutex>
#include <vector>
class Database {
 std::string file; std::mutex m;
public:
 explicit Database(std::string f="data/results.csv");
 void init(); void insert(const TestResult& r);
 std::vector<TestResult> all();
};
