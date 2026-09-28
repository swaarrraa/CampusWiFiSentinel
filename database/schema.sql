-- Logical schema represented by data/results.csv in the zero-dependency build.
CREATE TABLE wifi_tests (
 id INTEGER PRIMARY KEY,
 timestamp TEXT NOT NULL,
 location TEXT,
 device TEXT,
 latitude REAL,
 longitude REAL,
 throughput_mbps REAL,
 latency_ms REAL,
 loss_pct REAL,
 retransmission_proxy_pct REAL,
 latency_samples INTEGER,
 bytes INTEGER,
 duration_ms REAL
);
