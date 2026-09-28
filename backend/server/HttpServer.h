#pragma once
#include "../networking/Socket.h"
#include "../threading/ThreadPool.h"
#include "../database/Database.h"
#include <atomic>
#include <string>
class HttpServer {
 socket_t listenSock=-1; ThreadPool pool; Database& db; std::atomic<bool> running{false}; int port;
 void client(socket_t s, std::string ip);
 void response(socket_t s,const std::string& status,const std::string& type,const std::string& body);
 void throughput(socket_t s);
 std::string file(const std::string& path);
public:
 HttpServer(Database& d,int p=8080,size_t threads=8):pool(threads),db(d),port(p){}
 bool start(); void stop();
};
