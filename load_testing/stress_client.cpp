#include <iostream>
#include <thread>
#include <vector>
#include <atomic>
#include <chrono>
#include <string>
#ifdef _WIN32
#include <winsock2.h>
#pragma comment(lib,"Ws2_32.lib")
using sock_t=SOCKET;
#else
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
using sock_t=int;
#endif
void close_s(sock_t s){
#ifdef _WIN32
    closesocket(s);
#else
    close(s);
#endif
}
int main(int argc,char**argv){
    if(argc<4){std::cout<<"Usage: stress_client <host> <port> <users>\n";return 0;}
    std::string host=argv[1]; int port=std::stoi(argv[2]); int users=std::stoi(argv[3]);
#ifdef _WIN32
    WSADATA w; WSAStartup(MAKEWORD(2,2),&w);
#endif
    std::atomic<int> ok{0},fail{0};
    auto start=std::chrono::steady_clock::now();
    std::vector<std::thread> ts;
    for(int i=0;i<users;i++) ts.emplace_back([&,i]{
        sock_t s=socket(AF_INET,SOCK_STREAM,0); if(s<0){fail++;return;}
        sockaddr_in a{}; a.sin_family=AF_INET; a.sin_port=htons(port); inet_pton(AF_INET,host.c_str(),&a.sin_addr);
        if(connect(s,(sockaddr*)&a,sizeof(a))<0){fail++;close_s(s);return;}
        std::string q="GET /api/ping HTTP/1.1\r\nHost: "+host+"\r\nConnection: close\r\n\r\n";
        send(s,q.data(),(int)q.size(),0); char b[512]; int n=recv(s,b,sizeof(b),0);
        if(n>0) ok++; else fail++; close_s(s);
    });
    for(auto&t:ts)t.join();
    double sec=std::chrono::duration<double>(std::chrono::steady_clock::now()-start).count();
    std::cout<<"Concurrent users: "<<users<<"\nSuccessful: "<<ok<<"\nFailed: "<<fail<<"\nWall time: "<<sec<<" s\nRequests/sec: "<<users/sec<<"\n";
#ifdef _WIN32
    WSACleanup();
#endif
}
