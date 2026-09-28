let coords = { lat: null, lng: null };

const VIT_CENTER = [18.4639, 73.8677];

const zones = [
  {
    name: "Main Academic Area",
    center: [18.4643, 73.8674],
    bounds: [
      [18.4650, 73.8667],
      [18.4650, 73.8683],
      [18.4637, 73.8683],
      [18.4637, 73.8667]
    ]
  },
  {
    name: "Library Area",
    center: [18.4635, 73.8680],
    bounds: [
      [18.4640, 73.8675],
      [18.4640, 73.8685],
      [18.4631, 73.8685],
      [18.4631, 73.8675]
    ]
  },
  {
    name: "Canteen Area",
    center: [18.4637, 73.8690],
    bounds: [
      [18.4642, 73.8686],
      [18.4642, 73.8694],
      [18.4632, 73.8694],
      [18.4632, 73.8686]
    ]
  },
  {
    name: "Main Gate Area",
    center: [18.4628, 73.8681],
    bounds: [
      [18.4632, 73.8676],
      [18.4632, 73.8686],
      [18.4624, 73.8686],
      [18.4624, 73.8676]
    ]
  },
  {
    name: "Ground / Open Area",
    center: [18.4642, 73.8663],
    bounds: [
      [18.4648, 73.8657],
      [18.4648, 73.8669],
      [18.4636, 73.8669],
      [18.4636, 73.8657]
    ]
  },
  {
    name: "South Campus Area",
    center: [18.4626, 73.8668],
    bounds: [
      [18.4632, 73.8662],
      [18.4632, 73.8674],
      [18.4620, 73.8674],
      [18.4620, 73.8662]
    ]
  }
];

let map = L.map("mapCanvas").setView(VIT_CENTER, 17);

L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution: "© OpenStreetMap"
  }
).addTo(map);

let markers = [];
let zoneLayers = [];

function zoneColor(score) {
  if (score >= 70) return "#45e58b";
  if (score >= 40) return "#ffd166";
  return "#ff5f6d";
}

function scoreFor(throughput, latency, loss) {
  return Math.max(
    0,
    Math.min(
      100,
      throughput * 1.2 +
      (50 - latency) * 0.8 -
      loss * 8
    )
  );
}

function nearestZone(lat, lng) {
  let closest = null;
  let distance = Infinity;

  zones.forEach(zone => {
    const d =
      Math.pow(lat - zone.center[0], 2) +
      Math.pow(lng - zone.center[1], 2);

    if (d < distance) {
      distance = d;
      closest = zone;
    }
  });

  return closest;
}

function zoneLocation(text) {
  const value = text.toLowerCase();

  if (value.includes("library")) {
    return zones.find(z => z.name.includes("Library")).center;
  }

  if (value.includes("canteen")) {
    return zones.find(z => z.name.includes("Canteen")).center;
  }

  if (value.includes("gate")) {
    return zones.find(z => z.name.includes("Gate")).center;
  }

  if (value.includes("ground")) {
    return zones.find(z => z.name.includes("Ground")).center;
  }

  if (value.includes("south")) {
    return zones.find(z => z.name.includes("South")).center;
  }

  if (value.includes("academic") || value.includes("main")) {
    return zones.find(z => z.name.includes("Academic")).center;
  }

  return VIT_CENTER;
}

function createZones() {
  zoneLayers.forEach(layer => map.removeLayer(layer));
  zoneLayers = [];

  zones.forEach(zone => {
    const polygon = L.polygon(zone.bounds, {
      color: "#9aa0a6",
      weight: 1,
      fillColor: "#9aa0a6",
      fillOpacity: 0.12
    }).addTo(map);

    polygon.bindPopup(
      "<b>" + zone.name + "</b><br>Waiting for measurements"
    );

    zoneLayers.push(polygon);
  });
}

function updateZones(results) {
  zones.forEach((zone, index) => {
    const zoneResults = results.filter(r => {
      const nearest = nearestZone(
        Number(r.lat),
        Number(r.lng)
      );

      return nearest && nearest.name === zone.name;
    });

    const layer = zoneLayers[index];

    if (!zoneResults.length) {
      layer.setStyle({
        color: "#9aa0a6",
        fillColor: "#9aa0a6",
        fillOpacity: 0.12
      });

      layer.bindPopup(
        "<b>" + zone.name + "</b><br>No measurements yet"
      );

      return;
    }

    const avgScore =
      zoneResults.reduce(
        (sum, r) =>
          sum +
          scoreFor(
            Number(r.throughput),
            Number(r.latency),
            Number(r.loss)
          ),
        0
      ) / zoneResults.length;

    const color = zoneColor(avgScore);

    layer.setStyle({
      color: color,
      fillColor: color,
      fillOpacity: 0.35
    });

    layer.bindPopup(
      "<b>" +
      zone.name +
      "</b><br>Health: " +
      Math.round(avgScore) +
      "/100<br>Tests: " +
      zoneResults.length
    );
  });
}

createZones();

L.marker(VIT_CENTER)
  .addTo(map)
  .bindPopup("<b>Vishwakarma Institute of Technology</b><br>VIT Pune");

function scrollToTest() {
  document.getElementById("test").scrollIntoView();
}

function getLocation() {
  if (!navigator.geolocation) {
    alert(
      "GPS is not available. Use the manual location field."
    );
    return;
  }

  navigator.geolocation.getCurrentPosition(
    p => {
      coords.lat = p.coords.latitude;
      coords.lng = p.coords.longitude;

      document.getElementById(
        "locationLabel"
      ).textContent = "GPS location captured";

      document.getElementById(
        "locationSub"
      ).textContent =
        coords.lat.toFixed(6) +
        ", " +
        coords.lng.toFixed(6);

      map.setView(
        [coords.lat, coords.lng],
        18
      );
    },
    () => {
      alert(
        "GPS permission failed. Enter an indoor location manually."
      );
    }
  );
}

async function latencyTest() {
  let a = [];

  for (let i = 0; i < 10; i++) {
    const t = performance.now();

    await fetch(
      "/api/ping?x=" +
      Date.now() +
      i,
      {
        cache: "no-store"
      }
    );

    a.push(performance.now() - t);
  }

  const avg =
    a.reduce((x, y) => x + y, 0) /
    a.length;

  const min = Math.min(...a);
  const max = Math.max(...a);

  const jitter =
    a.slice(1).reduce(
      (x, y, i) =>
        x + Math.abs(y - a[i]),
      0
    ) /
    (a.length - 1);

  return {
    avg,
    min,
    max,
    jitter
  };
}

async function throughputTest() {
  const t = performance.now();

  const r = await fetch(
    "/api/throughput?x=" +
    Date.now(),
    {
      cache: "no-store"
    }
  );

  const reader = r.body.getReader();

  let bytes = 0;

  while (true) {
    const x = await reader.read();

    if (x.done) break;

    bytes += x.value.length;
  }

  const ms = performance.now() - t;

  return {
    mbps:
      bytes *
      8 /
      (ms / 1000) /
      1000000,
    bytes,
    ms
  };
}

function health(t, l) {
  const s =
    0.55 * Math.min(100, t) +
    0.35 * Math.max(0, 100 - l * 2) +
    10;

  return Math.max(
    0,
    Math.min(100, s)
  );
}

async function runTest() {
  const btn =
    document.getElementById("runBtn");

  const bar =
    document.querySelector(
      ".progress div"
    );

  const res =
    document.getElementById("result");

  btn.disabled = true;

  bar.style.width = "5%";

  res.classList.add("hidden");

  try {
    const manualLocation =
      document.getElementById(
        "manualLocation"
      ).value.trim();

    if (
      !coords.lat &&
      !manualLocation
    ) {
      document.getElementById(
        "locationLabel"
      ).textContent =
        "No GPS — using campus-level tag";

      document.getElementById(
        "locationSub"
      ).textContent =
        "Add a manual location for better heatmap accuracy.";
    }

    bar.style.width = "25%";

    const l = await latencyTest();

    bar.style.width = "55%";

    const t = await throughputTest();

    bar.style.width = "80%";

    const loss =
      Math.max(
        0,
        Math.min(
          8,
          (l.avg > 150 ? 1.5 : 0) +
          (t.mbps < 5 ? 1.2 : 0)
        )
      );

    const location =
      manualLocation ||
      "Campus GPS";

    const device =
      document.getElementById(
        "device"
      ).value;

    let lat = coords.lat;
    let lng = coords.lng;

    if (!lat || !lng) {
      const manualCoords =
        zoneLocation(location);

      lat = manualCoords[0];
      lng = manualCoords[1];
    }

    const timestamp =
      new Date().toISOString();

    const payload = {
      timestamp,
      location,
      device,
      lat,
      lng,
      throughput: t.mbps,
      latency: l.avg,
      loss
    };

    const saveResponse =
      await fetch(
        "/api/result",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify(payload)
        }
      );

    if (!saveResponse.ok) {
      throw new Error(
        "Failed to save result"
      );
    }

    bar.style.width = "100%";

    res.innerHTML =
      '<div class="result-grid">' +
      "<div>" +
      "<span>THROUGHPUT</span>" +
      "<b>" +
      t.mbps.toFixed(2) +
      " Mbps</b>" +
      "</div>" +

      "<div>" +
      "<span>AVG RTT</span>" +
      "<b>" +
      l.avg.toFixed(2) +
      " ms</b>" +
      "</div>" +

      "<div>" +
      "<span>LOSS PROXY</span>" +
      "<b>" +
      loss.toFixed(2) +
      " %</b>" +
      "</div>" +

      "</div>" +

      '<p style="color:#89a1a6;font-size:11px;margin-bottom:0">' +
      location +
      " · " +
      new Date().toLocaleTimeString() +
      " · " +
      device +
      "</p>";

    res.classList.remove("hidden");

    await refresh();

  } catch (e) {

    console.error(e);

    res.innerHTML =
      "<b>Test failed.</b>" +
      '<p style="color:#89a1a6">' +
      "Make sure the C++ server is running " +
      "and the phone/laptop can reach it." +
      "</p>";

    res.classList.remove(
      "hidden"
    );

  } finally {
    btn.disabled = false;
  }
}

function color(v) {
  return v >= 60
    ? "#45e58b"
    : v >= 30
    ? "#ffd166"
    : "#ff5f6d";
}

async function refresh() {
  try {
    const [stats, results] =
      await Promise.all([
        fetch(
          "/api/stats?x=" +
          Date.now()
        ).then(r => r.json()),

        fetch(
          "/api/results?x=" +
          Date.now()
        ).then(r => r.json())
      ]);

    document.getElementById(
      "tests"
    ).textContent =
      stats.tests;

    document.getElementById(
      "avgThroughput"
    ).textContent =
      stats.tests
        ? stats.avgThroughput.toFixed(1)
        : "—";

    document.getElementById(
      "avgLatency"
    ).textContent =
      stats.tests
        ? stats.avgLatency.toFixed(1)
        : "—";

    document.getElementById(
      "avgLoss"
    ).textContent =
      stats.tests
        ? stats.avgLoss.toFixed(2)
        : "—";

    const score =
      stats.tests
        ? Math.max(
            0,
            Math.min(
              100,
              stats.avgThroughput *
                1.2 +
                (50 -
                  stats.avgLatency) *
                  0.8 -
                stats.avgLoss * 8
            )
          )
        : 0;

    document.getElementById(
      "health"
    ).textContent =
      stats.tests
        ? Math.round(score) +
          "/100"
        : "—";

    document.getElementById(
      "healthText"
    ).textContent =
      stats.tests
        ? "Based on " +
          stats.tests +
          " field tests"
        : "Waiting for measurements";

    markers.forEach(m =>
      map.removeLayer(m)
    );

    markers = [];

    results.forEach(r => {
      const score =
        scoreFor(
          Number(r.throughput),
          Number(r.latency),
          Number(r.loss)
        );

      const m =
        L.circleMarker(
          [
            Number(r.lat),
            Number(r.lng)
          ],
          {
            radius: 10,
            fillColor:
              color(score),
            color: "#fff",
            weight: 1,
            fillOpacity: 0.8
          }
        ).addTo(map);

      m.bindPopup(
        "<b>" +
        r.location +
        "</b><br>" +
        "Throughput: " +
        Number(
          r.throughput
        ).toFixed(1) +
        " Mbps<br>" +
        "Latency: " +
        Number(
          r.latency
        ).toFixed(1) +
        " ms<br>" +
        "Loss proxy: " +
        Number(
          r.loss
        ).toFixed(2) +
        "%"
      );

      markers.push(m);
    });

    updateZones(results);

    const rows =
      results
        .slice(-12)
        .reverse()
        .map(
          r =>
            "<tr>" +
            "<td>" +
            new Date(
              r.timestamp
            ).toLocaleTimeString() +
            "</td>" +

            "<td>" +
            r.location +
            "</td>" +

            "<td>" +
            Number(
              r.throughput
            ).toFixed(1) +
            " Mbps</td>" +

            "<td>" +
            Number(
              r.latency
            ).toFixed(1) +
            " ms</td>" +

            "<td>" +
            Number(
              r.loss
            ).toFixed(2) +
            "%</td>" +

            "<td>" +
            r.device +
            "</td>" +

            "</tr>"
        )
        .join("");

    document.getElementById(
      "recentRows"
    ).innerHTML =
      rows ||
      '<tr><td colspan="6">No tests yet.</td></tr>';

  } catch (e) {
    console.error(
      "Refresh failed:",
      e
    );
  }
}

refresh();

setInterval(
  refresh,
  10000
);