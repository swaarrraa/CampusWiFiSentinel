#pragma once
#ifdef _WIN32
#include <winsock2.h>
typedef SOCKET socket_t;
#else
#include <sys/socket.h>
typedef int socket_t;
#endif

namespace net {
void startup();
void cleanup();
void close_socket(socket_t s);
bool send_all(socket_t s, const char* data, size_t len);
}
