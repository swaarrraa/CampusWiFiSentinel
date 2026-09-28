// ============================================================
// CAMPUS WIFI SENTINEL
// Frontend JavaScript
// ============================================================


// ============================================================
// GLOBAL VARIABLES
// ============================================================

var map = null;
var zoneLayers = [];
var measurementLayers = [];

var defaultCenter = [18.4639, 73.8677];

var currentLocation = null;
var searchedLocation = null;
var searchMarker = null;


// ============================================================
// CAMPUS ZONES
// ============================================================

var zones = [
    {
        name: "Main Academic Area",
        center: [18.4643, 73.8674]
    },
    {
        name: "Library Area",
        center: [18.4635, 73.8680]
    },
    {
        name: "Canteen Area",
        center: [18.4637, 73.8690]
    },
    {
        name: "Main Gate Area",
        center: [18.4628, 73.8681]
    },
    {
        name: "Ground/Open Area",
        center: [18.4642, 73.8663]
    },
    {
        name: "South Campus Area",
        center: [18.4626, 73.8668]
    }
];


// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getElement(id) {
    return document.getElementById(id);
}


function setText(id, value) {

    var element = getElement(id);

    if (element) {
        element.textContent = value;
    }
}


function setProgress(value) {

    var progress = getElement("progress");

    if (!progress) {
        return;
    }

    var bar = progress.querySelector("div");

    if (bar) {
        bar.style.width = value + "%";
    }
}


// ============================================================
// MAP INITIALIZATION
// ============================================================

function initializeMap() {

    var mapCanvas = getElement("mapCanvas");

    if (!mapCanvas) {
        return;
    }

    if (typeof L === "undefined") {

        console.error(
            "Leaflet library is not loaded."
        );

        return;
    }

    map = L.map("mapCanvas")
        .setView(
            defaultCenter,
            17
        );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);


    // --------------------------------------------------------
    // ADD CAMPUS ZONES
    // --------------------------------------------------------

    for (
        var i = 0;
        i < zones.length;
        i++
    ) {

        var zone = zones[i];

        var circle = L.circle(
            zone.center,
            {
                radius: 90,
                color: "#ff5f6d",
                fillColor: "#ff5f6d",
                fillOpacity: 0.12,
                weight: 1
            }
        ).addTo(map);


        circle.bindPopup(
            "<b>" +
            zone.name +
            "</b><br>" +
            "Waiting for measurements"
        );


        zoneLayers.push(circle);
    }


    // --------------------------------------------------------
    // DEFAULT VIT MARKER
    // --------------------------------------------------------

    L.marker(defaultCenter)
        .addTo(map)
        .bindPopup(
            "<b>VIT Pune</b><br>" +
            "Campus WiFi Sentinel"
        );
}


// ============================================================
// HEALTH SCORE
// ============================================================

function scoreFor(
    throughput,
    latency,
    loss
) {

    throughput =
        Number(throughput) || 0;

    latency =
        Number(latency) || 0;

    loss =
        Number(loss) || 0;


    var throughputScore =
        Math.min(
            100,
            (throughput / 500) * 100
        );


    var latencyScore =
        Math.max(
            0,
            100 - (latency / 2)
        );


    var reliabilityScore =
        Math.max(
            0,
            100 - (loss * 10)
        );


    var score =
        (throughputScore * 0.50) +
        (latencyScore * 0.30) +
        (reliabilityScore * 0.20);


    return Math.max(
        0,
        Math.min(
            100,
            score
        )
    );
}


// ============================================================
// HEALTH LABEL
// ============================================================

function healthLabel(score) {

    if (score >= 75) {
        return "Healthy";
    }

    if (score >= 45) {
        return "Moderate";
    }

    return "Poor";
}


// ============================================================
// DEAD ZONE CHECK
// ============================================================

function isDeadZone(score) {

    return score < 45;
}


// ============================================================
// GPS LOCATION
// ============================================================

function getLocation() {

    if (!navigator.geolocation) {

        setText(
            "locationLabel",
            "GPS not supported"
        );

        setText(
            "locationSub",
            "Your browser does not support GPS."
        );

        return;
    }


    setText(
        "locationLabel",
        "Requesting location..."
    );


    setText(
        "locationSub",
        "Please allow location access."
    );


    navigator.geolocation.getCurrentPosition(

        function(position) {

            var lat =
                position.coords.latitude;

            var lng =
                position.coords.longitude;


            currentLocation = {

                latitude: lat,

                longitude: lng
            };


            window.currentLocation =
                currentLocation;


            setText(
                "locationLabel",
                "GPS location selected"
            );


            setText(
                "locationSub",
                lat.toFixed(6) +
                ", " +
                lng.toFixed(6)
            );


            if (map) {

                map.setView(
                    [lat, lng],
                    18
                );


                L.marker(
                    [lat, lng]
                )
                    .addTo(map)
                    .bindPopup(
                        "<b>Your current location</b><br>" +
                        lat.toFixed(6) +
                        ", " +
                        lng.toFixed(6)
                    )
                    .openPopup();
            }
        },


        function(error) {

            console.error(
                "GPS error:",
                error
            );


            setText(
                "locationLabel",
                "Unable to get GPS location"
            );


            setText(
                "locationSub",
                "Allow location access and try again."
            );
        }
    );
}


// ============================================================
// LOCATION SEARCH
// IMPORTANT:
// SEARCH IS ONLY FOR MAP NAVIGATION.
// IT IS NOT USED FOR WIFI TEST COORDINATES.
// ============================================================

async function searchLocation() {

    if (!map) {

        console.error(
            "Map is not available."
        );

        return;
    }


    var input =
        getElement(
            "locationSearch"
        );


    var message =
        getElement(
            "searchMessage"
        );


    if (!input) {
        return;
    }


    var query =
        input.value.trim();


    if (query === "") {

        if (message) {

            message.textContent =
                "Please enter a location.";

            message.style.color =
                "#ff5f6d";
        }

        return;
    }


    if (message) {

        message.textContent =
            "Searching...";

        message.style.color =
            "#888";
    }


    try {

        var url =
            "https://nominatim.openstreetmap.org/search" +
            "?format=json" +
            "&limit=5" +
            "&q=" +
            encodeURIComponent(query);


        var response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Location search failed."
            );
        }


        var results =
            await response.json();


        if (
            !results ||
            results.length === 0
        ) {

            if (message) {

                message.textContent =
                    "Location not found.";

                message.style.color =
                    "#ff5f6d";
            }

            return;
        }


        var place =
            results[0];


        var lat =
            parseFloat(
                place.lat
            );


        var lng =
            parseFloat(
                place.lon
            );


        if (
            isNaN(lat) ||
            isNaN(lng)
        ) {

            throw new Error(
                "Invalid coordinates."
            );
        }


        map.setView(
            [lat, lng],
            17
        );


        searchedLocation = {

            name:
                place.display_name,

            latitude:
                lat,

            longitude:
                lng
        };


        window.searchedLocation =
            searchedLocation;


        if (searchMarker) {

            map.removeLayer(
                searchMarker
            );
        }


        searchMarker =
            L.marker(
                [lat, lng]
            )
                .addTo(map);


        searchMarker.bindPopup(

            "<b>" +
            place.display_name +
            "</b><br>" +

            "Latitude: " +
            lat.toFixed(6) +
            "<br>" +

            "Longitude: " +
            lng.toFixed(6) +
            "<br><br>" +

            "<span style='color:#ff5f6d'>" +
            "Search result only â€” not used for WiFi testing." +
            "</span>"
        );


        searchMarker.openPopup();


        if (message) {

            message.textContent =
                "Showing: " +
                place.display_name;

            message.style.color =
                "#45e58b";
        }

    } catch (error) {

        console.error(
            "Location search error:",
            error
        );


        if (message) {

            message.textContent =
                "Could not search location.";

            message.style.color =
                "#ff5f6d";
        }
    }
}


// ============================================================
// LOCATION SEARCH - ENTER KEY
// ============================================================

function setupSearch() {

    var input =
        getElement(
            "locationSearch"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                searchLocation();
            }
        }
    );
}


// ============================================================
// LATENCY TEST
// ============================================================

async function latencyTest() {

    var samples = [];


    for (
        var i = 0;
        i < 10;
        i++
    ) {

        var start =
            performance.now();


        try {

            var response =
                await fetch(
                    "/api/ping?x=" +
                    Date.now(),
                    {
                        cache:
                            "no-store"
                    }
                );


            if (!response.ok) {

                samples.push(999);

                continue;
            }


            var end =
                performance.now();


            samples.push(
                end - start
            );

        } catch (error) {

            console.error(
                "Latency request failed:",
                error
            );


            samples.push(999);
        }
    }


    if (samples.length === 0) {
        return 999;
    }


    var total = 0;


    for (
        var j = 0;
        j < samples.length;
        j++
    ) {

        total += samples[j];
    }


    return (
        total /
        samples.length
    );
}


// ============================================================
// THROUGHPUT TEST
// ============================================================

async function throughputTest() {

    var start =
        performance.now();

    try {

        var response =
            await fetch(
                "/api/throughput?x=" +
                Date.now(),
                {
                    cache:
                        "no-store"
                }
            );

        if (!response.ok) {

            throw new Error(
                "Throughput request failed."
            );
        }

        var data =
            await response.arrayBuffer();

        var end =
            performance.now();

        var durationMs =
            end - start;

        var duration =
            durationMs / 1000;

        var bytes =
            data.byteLength;

        if (duration <= 0) {

            return {
                mbps: 0,
                bytes: bytes,
                durationMs: durationMs
            };
        }

        var mbps =
            (
                bytes *
                8
            ) /
            duration /
            1000000;

        return {
            mbps: mbps,
            bytes: bytes,
            durationMs: durationMs
        };

    } catch (error) {

        console.error(
            "Throughput test failed:",
            error
        );

        return {
            mbps: 0,
            bytes: 0,
            durationMs: 0
        };
    }
}
// ============================================================
// RUN WIFI TEST
// ============================================================

async function runTest() {

    var button =
        getElement("runBtn");

    var progress =
        getElement("progress");

    var result =
        getElement("result");

    var locationInput =
        getElement("manualLocation");

    var device =
        getElement("device");


    if (!button) {

        console.error(
            "Run button not found."
        );

        return;
    }


    // --------------------------------------------------------
    // GPS IS REQUIRED
    // --------------------------------------------------------

    var latitude = null;
    var longitude = null;


    if (
        currentLocation &&
        typeof currentLocation.latitude === "number" &&
        typeof currentLocation.longitude === "number"
    ) {

        latitude =
            currentLocation.latitude;

        longitude =
            currentLocation.longitude;

    } else if (
        window.currentLocation &&
        typeof window.currentLocation.latitude === "number" &&
        typeof window.currentLocation.longitude === "number"
    ) {

        latitude =
            window.currentLocation.latitude;

        longitude =
            window.currentLocation.longitude;
    }


    // --------------------------------------------------------
    // DO NOT USE SEARCHED LOCATION
    // --------------------------------------------------------

    if (
        latitude === null ||
        longitude === null
    ) {

        if (result) {

            result.innerHTML =
                "<p>" +
                "Please select your GPS location first." +
                "</p>";

            result.classList.remove(
                "hidden"
            );
        }


        setText(
            "locationLabel",
            "Location required"
        );


        setText(
            "locationSub",
            "Click Use GPS before running the test."
        );


        return;
    }


    // --------------------------------------------------------
    // DISABLE BUTTON
    // --------------------------------------------------------

    button.disabled = true;


    if (result) {

        result.classList.add(
            "hidden"
        );
    }


    if (progress) {

        progress.classList.remove(
            "hidden"
        );
    }


    setProgress(5);


    // --------------------------------------------------------
    // LOCATION NAME
    // --------------------------------------------------------

    var locationName = "";


    if (locationInput) {

        locationName =
            locationInput.value.trim();
    }


    if (locationName === "") {

        locationName =
            "GPS Test Location";
    }


    // --------------------------------------------------------
    // DEVICE
    // --------------------------------------------------------

    var deviceName =
        "Unknown";


    if (device) {

        if (device.value) {

            deviceName =
                device.value;

        } else if (
            device.textContent
        ) {

            deviceName =
                device.textContent;
        }
    }


    // --------------------------------------------------------
    // LATENCY
    // --------------------------------------------------------

    setProgress(20);


    var latency =
        await latencyTest();


    setProgress(55);


    // --------------------------------------------------------
    // THROUGHPUT
    // --------------------------------------------------------

    var throughputResult =
        await throughputTest();

    var throughput =
        throughputResult.mbps;

    var bytes =
        throughputResult.bytes;

    var durationMs =
        throughputResult.durationMs;


    setProgress(80);


    // --------------------------------------------------------
    // LOSS / DEGRADATION PROXY
    // --------------------------------------------------------

    var loss = 1.5;


    if (latency > 200) {

        loss =
            (latency - 200) / 50;
    }


    loss =
        Math.min(
            10,
            Math.max(
                0,
                loss
            )
        );


    // --------------------------------------------------------
    // HEALTH SCORE
    // --------------------------------------------------------

    var score =
        scoreFor(
            throughput,
            latency,
            loss
        );


    // --------------------------------------------------------
    // SAVE RESULT
    // --------------------------------------------------------

    var payload = {

        timestamp:
            new Date().toISOString(),

        location:
            locationName,

        device:
            deviceName,

        lat:
            latitude,

        lng:
            longitude,

        throughput:
            throughput,

        latency:
            latency,

        loss:
            loss,

        bytes:
            bytes,

        duration_ms:
            durationMs
    };


    console.log(
        "Sending test result:",
        payload
    );


    try {

        var saveResponse =
            await fetch(
                "/api/result",
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        if (!saveResponse.ok) {

            console.error(
                "Server rejected result:",
                saveResponse.status
            );
        }

    } catch (error) {

        console.error(
            "Could not save result:",
            error
        );
    }


    // --------------------------------------------------------
    // SHOW RESULT
    // --------------------------------------------------------

    setProgress(100);


    if (result) {

        var resultStatus =
            healthLabel(score);

        var warning = "";


        if (isDeadZone(score)) {

            warning =
                "<p style='color:#ff5f6d; font-weight:bold;'>" +
                "âš  POTENTIAL WIFI DEAD ZONE DETECTED" +
                "</p>";

        } else if (score < 75) {

            warning =
                "<p style='color:#ffd166; font-weight:bold;'>" +
                "âš  MODERATE WIFI QUALITY" +
                "</p>";

        } else {

            warning =
                "<p style='color:#45e58b; font-weight:bold;'>" +
                "âœ“ HEALTHY WIFI ZONE" +
                "</p>";
        }


        result.innerHTML =

            warning +

            "<div class=\"result-grid\">" +

            "<div>" +
            "<small>THROUGHPUT</small>" +
            "<strong>" +
            throughput.toFixed(2) +
            " Mbps" +
            "</strong>" +
            "</div>" +

            "<div>" +
            "<small>LATENCY</small>" +
            "<strong>" +
            latency.toFixed(2) +
            " ms" +
            "</strong>" +
            "</div>" +

            "<div>" +
            "<small>DEGRADATION</small>" +
            "<strong>" +
            loss.toFixed(2) +
            " %" +
            "</strong>" +
            "</div>" +

            "<div>" +
            "<small>HEALTH</small>" +
            "<strong>" +
            score.toFixed(0) +
            " / 100" +
            "</strong>" +
            "</div>" +

            "</div>" +

            "<p>" +
            "Test completed at: " +
            "<b>" +
            locationName +
            "</b>" +
            "</p>" +

            "<p>" +
            "GPS Coordinates: " +
            latitude.toFixed(6) +
            ", " +
            longitude.toFixed(6) +
            "</p>" +

            "<p>" +
            "Status: <b>" +
            resultStatus +
            "</b>" +
            "</p>";


        result.classList.remove(
            "hidden"
        );
    }


    button.disabled = false;


    setTimeout(
        function() {

            if (progress) {

                progress.classList.add(
                    "hidden"
                );
            }

        },
        800
    );


    // --------------------------------------------------------
    // REFRESH DASHBOARD + HEATMAP
    // --------------------------------------------------------

    await refresh();
}


// ============================================================
// REFRESH DATA
// ============================================================

async function refresh() {

    try {

        var response =
            await fetch(
                "/api/results?x=" +
                Date.now(),
                {
                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Could not load results."
            );
        }


        var data =
            await response.json();


        if (!Array.isArray(data)) {

            console.error(
                "Invalid results received:",
                data
            );

            return;
        }


        // ----------------------------------------------------
        // DASHBOARD TOTAL
        // ----------------------------------------------------

        var total =
            getElement(
                "totalTests"
            );


        if (total) {

            total.textContent =
                data.length;
        }


        // ----------------------------------------------------
        // DASHBOARD AVERAGES
        // ----------------------------------------------------

        var avgThroughput =
            getElement(
                "avgThroughput"
            );

        var avgLatency =
            getElement(
                "avgLatency"
            );

        var avgLoss =
            getElement(
                "avgLoss"
            );


        if (data.length > 0) {

            var totalThroughput = 0;
            var totalLatency = 0;
            var totalLoss = 0;


            for (
                var i = 0;
                i < data.length;
                i++
            ) {

                totalThroughput +=
                    Number(
                        data[i].throughput ||
                        0
                    );

                totalLatency +=
                    Number(
                        data[i].latency ||
                        0
                    );

                totalLoss +=
                    Number(
                        data[i].loss ||
                        0
                    );
            }


            var averageThroughput =
                totalThroughput /
                data.length;

            var averageLatency =
                totalLatency /
                data.length;

            var averageLoss =
                totalLoss /
                data.length;


            if (avgThroughput) {

                avgThroughput.textContent =
                    averageThroughput.toFixed(1) +
                    " Mbps";
            }


            if (avgLatency) {

                avgLatency.textContent =
                    averageLatency.toFixed(1) +
                    " ms";
            }


            if (avgLoss) {

                avgLoss.textContent =
                    averageLoss.toFixed(1) +
                    "%";
            }

        } else {

            if (avgThroughput) {
                avgThroughput.textContent =
                    "0 Mbps";
            }

            if (avgLatency) {
                avgLatency.textContent =
                    "0 ms";
            }

            if (avgLoss) {
                avgLoss.textContent =
                    "0%";
            }
        }


        // ----------------------------------------------------
        // RECENT RESULTS TABLE
        // ----------------------------------------------------

        var rows =
            getElement(
                "recentRows"
            );


        if (rows) {

            rows.innerHTML = "";


            var recent =
                data.slice()
                    .reverse()
                    .slice(
                        0,
                        10
                    );


            for (
                var r = 0;
                r < recent.length;
                r++
            ) {

                var item =
                    recent[r];


                var tr =
                    document.createElement(
                        "tr"
                    );


                var timeText = "-";


                if (item.timestamp) {

                    try {

                        timeText =
                            new Date(
                                item.timestamp
                            ).toLocaleTimeString();

                    } catch (e) {

                        timeText =
                            item.timestamp;
                    }
                }


                tr.innerHTML =

                    "<td>" +
                    timeText +
                    "</td>" +

                    "<td>" +
                    (item.location || "-") +
                    "</td>" +

                    "<td>" +
                    Number(
                        item.throughput || 0
                    ).toFixed(1) +
                    " Mbps</td>" +

                    "<td>" +
                    Number(
                        item.latency || 0
                    ).toFixed(1) +
                    " ms</td>" +

                    "<td>" +
                    Number(
                        item.loss || 0
                    ).toFixed(1) +
                    "%</td>" +

                    "<td>" +
                    (item.device || "-") +
                    "</td>";


                rows.appendChild(tr);
            }
        }


        // ----------------------------------------------------
        // MAP MEASUREMENTS
        // ----------------------------------------------------

        if (
            map &&
            typeof L !== "undefined"
        ) {

            // Remove old measurement markers

            for (
                var m = 0;
                m < measurementLayers.length;
                m++
            ) {

                map.removeLayer(
                    measurementLayers[m]
                );
            }


            measurementLayers = [];


            // ------------------------------------------------
            // GROUP NEARBY TESTS
            // ------------------------------------------------

            var groups = [];


            // Tests within 20 metres
            // are treated as the same location

            var GROUP_DISTANCE = 20;


            // ------------------------------------------------
            // DISTANCE FUNCTION
            // ------------------------------------------------

            function distanceInMeters(
                lat1,
                lng1,
                lat2,
                lng2
            ) {

                var R = 6371000;


                var dLat =
                    (lat2 - lat1) *
                    Math.PI /
                    180;


                var dLng =
                    (lng2 - lng1) *
                    Math.PI /
                    180;


                var a =
                    Math.sin(dLat / 2) *
                    Math.sin(dLat / 2) +

                    Math.cos(
                        lat1 *
                        Math.PI /
                        180
                    ) *

                    Math.cos(
                        lat2 *
                        Math.PI /
                        180
                    ) *

                    Math.sin(
                        dLng / 2
                    ) *

                    Math.sin(
                        dLng / 2
                    );


                var c =
                    2 *
                    Math.atan2(
                        Math.sqrt(a),
                        Math.sqrt(
                            1 - a
                        )
                    );


                return R * c;
            }


            // ------------------------------------------------
            // CREATE LOCATION GROUPS
            // ------------------------------------------------

            for (
                var d = 0;
                d < data.length;
                d++
            ) {

                var itemData =
                    data[d];


                var lat =
                    parseFloat(
                        itemData.lat
                    );


                var lng =
                    parseFloat(
                        itemData.lng
                    );


                if (
                    isNaN(lat) ||
                    isNaN(lng)
                ) {

                    continue;
                }


                var addedToGroup =
                    false;


                for (
                    var g = 0;
                    g < groups.length;
                    g++
                ) {

                    var group =
                        groups[g];


                    var distance =
                        distanceInMeters(
                            lat,
                            lng,
                            group.lat,
                            group.lng
                        );


                    if (
                        distance <=
                        GROUP_DISTANCE
                    ) {

                        group.tests.push(
                            itemData
                        );


                        addedToGroup =
                            true;


                        break;
                    }
                }


                if (!addedToGroup) {

                    groups.push({

                        lat:
                            lat,

                        lng:
                            lng,

                        tests: [
                            itemData
                        ]
                    });
                }
            }


            // ------------------------------------------------
            // CREATE ONE MARKER PER GROUP
            // ------------------------------------------------

            for (
                var g = 0;
                g < groups.length;
                g++
            ) {

                var group =
                    groups[g];


                var tests =
                    group.tests;


                var totalThroughput =
                    0;

                var totalLatency =
                    0;

                var totalLoss =
                    0;

                var totalLat =
                    0;

                var totalLng =
                    0;


                // ------------------------------------------------
                // CALCULATE AVERAGES
                // ------------------------------------------------

                for (
                    var t = 0;
                    t < tests.length;
                    t++
                ) {

                    totalThroughput +=
                        Number(
                            tests[t].throughput ||
                            0
                        );


                    totalLatency +=
                        Number(
                            tests[t].latency ||
                            0
                        );


                    totalLoss +=
                        Number(
                            tests[t].loss ||
                            0
                        );


                    totalLat +=
                        parseFloat(
                            tests[t].lat
                        );


                    totalLng +=
                        parseFloat(
                            tests[t].lng
                        );
                }


                var averageThroughput =
                    totalThroughput /
                    tests.length;


                var averageLatency =
                    totalLatency /
                    tests.length;


                var averageLoss =
                    totalLoss /
                    tests.length;


                var averageLat =
                    totalLat /
                    tests.length;


                var averageLng =
                    totalLng /
                    tests.length;


                // ------------------------------------------------
                // GROUP HEALTH SCORE
                // ------------------------------------------------

                var groupScore =
                    scoreFor(
                        averageThroughput,
                        averageLatency,
                        averageLoss
                    );


                // ------------------------------------------------
                // HEALTH STATUS
                // ------------------------------------------------

                var groupHealth =
                    healthLabel(
                        groupScore
                    );


                var deadZone =
                    isDeadZone(
                        groupScore
                    );


                // ------------------------------------------------
                // MARKER COLOR
                // ------------------------------------------------

                var markerColor =
                    "#ff5f6d";


                if (
                    groupScore >= 75
                ) {

                    markerColor =
                        "#45e58b";

                } else if (
                    groupScore >= 45
                ) {

                    markerColor =
                        "#ffd166";
                }


                // ------------------------------------------------
                // CREATE MARKER
                // ------------------------------------------------

                var marker =
                    L.circleMarker(
                        [
                            averageLat,
                            averageLng
                        ],
                        {
                            radius:
                                deadZone ? 14 : 11,

                            color:
                                markerColor,

                            fillColor:
                                markerColor,

                            fillOpacity:
                                0.85,

                            weight:
                                deadZone ? 3 : 2
                        }
                    ).addTo(map);


                // ------------------------------------------------
                // LOCATION NAME
                // ------------------------------------------------

                var locationName =
                    tests[0].location ||
                    "WiFi Test Location";


                // ------------------------------------------------
                // DEAD ZONE MESSAGE
                // ------------------------------------------------

                var statusMessage = "";


                if (deadZone) {

                    statusMessage =

                        "<div style='" +
                        "color:#ff5f6d;" +
                        "font-weight:bold;" +
                        "font-size:15px;" +
                        "margin-bottom:8px;" +
                        "'>" +

                        "âš  POTENTIAL WIFI DEAD ZONE" +

                        "</div>";

                } else if (
                    groupScore < 75
                ) {

                    statusMessage =

                        "<div style='" +
                        "color:#d49b00;" +
                        "font-weight:bold;" +
                        "margin-bottom:8px;" +
                        "'>" +

                        "âš  MODERATE WIFI QUALITY" +

                        "</div>";

                } else {

                    statusMessage =

                        "<div style='" +
                        "color:#168f50;" +
                        "font-weight:bold;" +
                        "margin-bottom:8px;" +
                        "'>" +

                        "âœ“ HEALTHY WIFI ZONE" +

                        "</div>";
                }


                // ------------------------------------------------
                // POPUP
                // ------------------------------------------------

                var popup =

                    "<b>" +
                    locationName +
                    "</b><br><br>" +

                    statusMessage +

                    "<b>Tests at this location:</b> " +
                    tests.length +
                    "<br>" +

                    "<b>Health:</b> " +
                    groupHealth +
                    "<br><br>" +

                    "Average Throughput: " +
                    averageThroughput.toFixed(1) +
                    " Mbps<br>" +

                    "Average Latency: " +
                    averageLatency.toFixed(1) +
                    " ms<br>" +

                    "Average Degradation: " +
                    averageLoss.toFixed(1) +
                    "%<br>" +

                    "Average Health: " +
                    groupScore.toFixed(0) +
                    "/100<br><br>" +

                    "Coordinates: " +
                    averageLat.toFixed(6) +
                    ", " +
                    averageLng.toFixed(6);


                marker.bindPopup(
                    popup
                );


                measurementLayers.push(
                    marker
                );
            }
        }

    } catch (error) {

        console.error(
            "Refresh failed:",
            error
        );
    }
}


// ============================================================
// INITIALIZATION
// ============================================================

function initializeApp() {

    console.log(
        "Campus WiFi Sentinel JavaScript loaded."
    );


    initializeMap();


    setupSearch();


    refresh();
}


// ============================================================
// START APPLICATION
// ============================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApp
    );

} else {

    initializeApp();
}
