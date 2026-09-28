#include "Socket.h"
#include <algorithm>
#include <cstring>
#ifdef _WIN32
#pragma comment(lib, "Ws2_32.lib")
#else
#include <unistd.h>
#endif
namespace net {
void startup(){
#ifdef _WIN32
 WSADATA w; WSAStartup(MAKEWORD(2,2), &w);
#endif
}
void cleanup(){
#ifdef _WIN32
 WSACleanup();
#endif
}
void close_socket(socket_t s){
#ifdef _WIN32
 closesocket(s);
#else
 close(s);
#endif
}
bool send_all(socket_t s,const char* data,size_t len){
 size_t sent=0; while(sent<len){
#ifdef _WIN32
  int n=send(s,data+(long long)sent,(int)std::min<size_t>(len-sent,1<<20),0);
#else
  ssize_t n=send(s,data+sent,std::min<size_t>(len-sent,1<<20),0);
#endif
  if(n<=0) return false; sent+=n;
 } return true;
}
}
