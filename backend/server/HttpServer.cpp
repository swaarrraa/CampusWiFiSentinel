#include "HttpServer.h"
#include "../utils/Logger.h"

#include <fstream>
#include <sstream>
#include <filesystem>
#include <cstring>
#include <thread>
#include <algorithm>

#ifdef _WIN32
#include <ws2tcpip.h>
#else
#include <arpa/inet.h>
#include <unistd.h>
#endif

static std::string mime(const std::string& p)
{
    if (p.find(".css") != std::string::npos)
        return "text/css";

    if (p.find(".js") != std::string::npos)
        return "application/javascript";

    if (p.find(".json") != std::string::npos)
        return "application/json";

    return "text/html";
}

std::string HttpServer::file(const std::string& path)
{
    std::string p = path;

    if (p == "/")
        p = "/index.html";

    std::ifstream in("web" + p, std::ios::binary);

    if (!in)
        return "";

    std::ostringstream ss;
    ss << in.rdbuf();

    return ss.str();
}

void HttpServer::response(
    socket_t s,
    const std::string& status,
    const std::string& type,
    const std::string& body)
{
    std::ostringstream h;

    h << "HTTP/1.1 " << status << "\r\n"
      << "Content-Type: " << type << "; charset=utf-8\r\n"
      << "Content-Length: " << body.size() << "\r\n"
      << "Connection: close\r\n"
      << "Cache-Control: no-store\r\n"
      << "\r\n";

    std::string header = h.str();

    net::send_all(
        s,
        header.c_str(),
        header.size()
    );

    net::send_all(
        s,
        body.data(),
        body.size()
    );
}

void HttpServer::throughput(socket_t s)
{
    const size_t total = 10 * 1024 * 1024;
    const size_t chunk = 64 * 1024;

    std::string data(chunk, 'W');

    std::ostringstream h;

    h << "HTTP/1.1 200 OK\r\n"
      << "Content-Type: application/octet-stream\r\n"
      << "Content-Length: " << total << "\r\n"
      << "Connection: close\r\n"
      << "Cache-Control: no-store\r\n"
      << "\r\n";

    auto header = h.str();

    if (!net::send_all(
            s,
            header.data(),
            header.size()))
    {
        return;
    }

    size_t sent = 0;

    while (sent < total)
    {
        size_t n =
            std::min(
                chunk,
                total - sent
            );

        if (!net::send_all(
                s,
                data.data(),
                n))
        {
            break;
        }

        sent += n;
    }
}

void HttpServer::client(
    socket_t s,
    std::string ip)
{
    char buf[8192];

    int n =
        recv(
            s,
            buf,
            sizeof(buf) - 1,
            0
        );

    if (n <= 0)
    {
        net::close_socket(s);
        return;
    }

    buf[n] = 0;

    std::string req(buf);

    std::istringstream ss(req);

    std::string method;
    std::string path;
    std::string ver;

    ss >> method >> path >> ver;

    /*
        Remove URL query parameters.

        Example:
        /api/ping?x=123

        becomes:
        /api/ping

        This allows the frontend cache-busting
        query parameters to work correctly.
    */
    auto qpos = path.find('?');

    if (qpos != std::string::npos)
    {
        path = path.substr(0, qpos);
    }

    logx::info(
        ip + " " +
        method + " " +
        path
    );

    /*
        LATENCY / PING API
    */

    if (
        method == "GET" &&
        path == "/api/ping")
    {
        response(
            s,
            "200 OK",
            "application/json",
            "{\"ok\":true,\"server_time_ms\":0}"
        );

        net::close_socket(s);
        return;
    }

    /*
        THROUGHPUT API
    */

    if (
        method == "GET" &&
        path == "/api/throughput")
    {
        throughput(s);

        net::close_socket(s);
        return;
    }

    /*
        RESULTS API
    */

    if (
        method == "GET" &&
        path == "/api/results")
    {
        auto v = db.all();

        std::ostringstream o;

        o << "[";

        for (
            size_t i = 0;
            i < v.size();
            i++)
        {
            if (i)
                o << ",";

            auto& r = v[i];

            o << "{"
              << "\"timestamp\":\""
              << r.timestamp
              << "\","

              << "\"location\":\""
              << r.locationName
              << "\","

              << "\"device\":\""
              << r.device
              << "\","

              << "\"lat\":"
              << r.latitude
              << ","

              << "\"lng\":"
              << r.longitude
              << ","

              << "\"throughput\":"
              << r.throughputMbps
              << ","

              << "\"latency\":"
              << r.latencyMs
              << ","

              << "\"loss\":"
              << r.packetLossPct

              << "}";
        }

        o << "]";

        response(
            s,
            "200 OK",
            "application/json",
            o.str()
        );

        net::close_socket(s);
        return;
    }

    /*
        STATISTICS API
    */

    if (
        method == "GET" &&
        path == "/api/stats")
    {
        auto v = db.all();

        double at = 0;
        double al = 0;
        double loss = 0;

        for (auto& r : v)
        {
            at += r.throughputMbps;
            al += r.latencyMs;
            loss += r.packetLossPct;
        }

        double n = v.size();

        std::ostringstream o;

        o << "{"
          << "\"tests\":"
          << v.size()

          << ",\"avgThroughput\":"
          << (n ? at / n : 0)

          << ",\"avgLatency\":"
          << (n ? al / n : 0)

          << ",\"avgLoss\":"
          << (n ? loss / n : 0)

          << "}";

        response(
            s,
            "200 OK",
            "application/json",
            o.str()
        );

        net::close_socket(s);
        return;
    }

    /*
        SAVE TEST RESULT API
    */

    if (
        method == "POST" &&
        path == "/api/result")
    {
        auto pos =
            req.find("\r\n\r\n");

        std::string body =
            pos == std::string::npos
                ? ""
                : req.substr(pos + 4);

        auto get =
            [&](const std::string& k)
        {
            auto p =
                body.find(
                    "\"" + k + "\""
                );

            if (
                p ==
                std::string::npos)
            {
                return std::string();
            }

            p =
                body.find(
                    ':',
                    p
                );

            if (
                p ==
                std::string::npos)
            {
                return std::string();
            }

            p++;

            while (
                p < body.size() &&
                (
                    body[p] == ' ' ||
                    body[p] == '"'
                ))
            {
                p++;
            }

            size_t e = p;

            while (
                e < body.size() &&
                body[e] != '"' &&
                body[e] != ',' &&
                body[e] != '}')
            {
                e++;
            }

            return body.substr(
                p,
                e - p
            );
        };

        TestResult r;

        r.timestamp =
            get("timestamp");

        r.locationName =
            get("location");

        r.device =
            get("device");

        r.latitude =
            get("lat");

        r.longitude =
            get("lng");

        r.throughputMbps =
            std::stod(
                get("throughput")
            );

        r.latencyMs =
            std::stod(
                get("latency")
            );

        r.packetLossPct =
            std::stod(
                get("loss")
            );

        /*
            Browser cannot directly access
            kernel TCP retransmission counters,
            so packet loss is used as the
            application-level retransmission proxy.
        */

        r.retransmissionProxyPct =
            r.packetLossPct;

       r.latencySamples = 10;

r.bytes =
    std::stoll(
        get("bytes")
    );

r.durationMs =
    std::stod(
        get("duration_ms")
    );

db.insert(r);

        response(
            s,
            "201 Created",
            "application/json",
            "{\"saved\":true}"
        );

        net::close_socket(s);
        return;
    }

    /*
        STATIC WEB FILES
    */

    std::string body =
        file(path);

    if (body.empty())
    {
        response(
            s,
            "404 Not Found",
            "text/plain",
            "Not found"
        );
    }
    else
    {
        response(
            s,
            "200 OK",
            mime(path),
            body
        );
    }

    net::close_socket(s);
}

bool HttpServer::start()
{
    listenSock =
        socket(
            AF_INET,
            SOCK_STREAM,
            0
        );

    if (listenSock < 0)
        return false;

    int yes = 1;

    setsockopt(
        listenSock,
        SOL_SOCKET,
        SO_REUSEADDR,
        (char*)&yes,
        sizeof(yes)
    );

    sockaddr_in a{};

    a.sin_family =
        AF_INET;

    a.sin_addr.s_addr =
        INADDR_ANY;

    a.sin_port =
        htons(port);

    if (
        bind(
            listenSock,
            (sockaddr*)&a,
            sizeof(a)
        ) < 0)
    {
        return false;
    }

    if (
        listen(
            listenSock,
            128
        ) < 0)
    {
        return false;
    }

    running = true;

    logx::info(
        "Campus WiFi Sentinel listening on port " +
        std::to_string(port)
    );

    while (running)
    {
        sockaddr_in c{};

#ifdef _WIN32
        int len =
            sizeof(c);
#else
        socklen_t len =
            sizeof(c);
#endif

        socket_t s =
            accept(
                listenSock,
                (sockaddr*)&c,
                &len
            );

        if (s < 0)
            continue;

        char ip[INET_ADDRSTRLEN];

        inet_ntop(
            AF_INET,
            &c.sin_addr,
            ip,
            sizeof(ip)
        );

        pool.enqueue(
            [
                this,
                s,
                ip = std::string(ip)
            ]
            {
                client(
                    s,
                    ip
                );
            }
        );
    }

    return true;
}

void HttpServer::stop()
{
    running = false;

    net::close_socket(
        listenSock
    );
}