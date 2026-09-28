# Retransmission / loss depth

TCP retransmissions happen below the normal browser API. JavaScript cannot inspect the phone's kernel counters. The demo therefore reports a **loss/retransmission proxy** rather than claiming it is an exact packet-loss percentage.

For an advanced Linux-native extension, use `getsockopt(fd, IPPROTO_TCP, TCP_INFO, ...)` and inspect fields such as `tcpi_retransmits`, `tcpi_total_retrans`, `tcpi_unacked`, RTT and delivery metrics (availability varies by kernel). This should be implemented in the native benchmark client, not in browser JavaScript.

For a presentation, explain:
1. TCP retransmits lost segments automatically.
2. The application normally receives a reliable byte stream and does not see individual lost IP packets.
3. Kernel TCP_INFO exposes transport statistics on Linux.
4. Browser-based testing is still valuable because the throughput and RTT are measured from the student's actual device and WiFi path.
