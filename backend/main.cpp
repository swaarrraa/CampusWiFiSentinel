#include "networking/Socket.h"
#include "database/Database.h"
#include "server/HttpServer.h"
#include "utils/Logger.h"
#include <iostream>
#include <thread>
int main(int argc,char**argv){net::startup();Database db("data/results.csv");int port=argc>1?std::stoi(argv[1]):8080;HttpServer server(db,port,12);logx::info("Starting Campus WiFi Sentinel");if(!server.start()){logx::error("Could not start server. Is port 8080 already in use?");net::cleanup();return 1;}net::cleanup();return 0;}
