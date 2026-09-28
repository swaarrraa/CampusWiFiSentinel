# Viva / presentation points

## Problem
Anecdotal complaints cannot tell IT which campus locations need attention. The system converts WiFi quality into repeatable measurements tied to location and time.

## Why TCP?
TCP provides a reliable byte stream and includes congestion control. A sustained transfer therefore reveals the end-to-end throughput available to the student at that moment.

## Why multithreading?
A blocking transfer can take seconds. A single-threaded server would make other students wait. The thread pool lets multiple transfers and API requests progress concurrently.

## Throughput formula
Throughput (Mbps) = bytes transferred × 8 / elapsed seconds / 1,000,000.

## Latency
RTT is measured using repeated request/response operations. Average, min, max and jitter are useful because one sample can be noisy.

## Packet loss limitation
TCP retransmissions are hidden from browser JavaScript. The base project reports a conservative proxy and documents native TCP_INFO as the deeper extension.

## Heatmap
Every stored measurement includes coordinates or a manual indoor tag. Markers are coloured by a health score derived from throughput, latency and loss proxy.
