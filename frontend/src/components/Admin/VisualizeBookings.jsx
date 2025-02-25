// src/components/Admin/VisualizeBookings.jsx

import React, { useState, useEffect } from "react";
import { fetchAvailableTimeSlots } from "../../services/bookingService";

// Chart
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";

// Helper to format date as YYYY-MM-DD
function formatDate(dateObj) {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

// Generate an array of date strings for the chosen mode + range
function generateDateRange(mode, range) {
    const dates = [];
    const now = new Date();

    if (mode === "past") {
        // e.g. Last 7 days: from (today-range+1) to today
        for (let i = range - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            dates.push(formatDate(d));
        }
    } else {
        // "incoming" (today + next X days)
        for (let i = 0; i < range; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() + i);
            dates.push(formatDate(d));
        }
    }
    return dates;
}

// Filter bookings in the date range [today-range, today] if "past",
// or [today, today+range] if "incoming"
function filterBookingsByRange(bookings, mode, range) {
    const now = new Date();

    if (mode === "past") {
        const cutoff = new Date(now);
        cutoff.setDate(now.getDate() - range);
        return bookings.filter((b) => {
            if (!b.date) return false;
            const bookingDate = new Date(b.date);
            return bookingDate >= cutoff && bookingDate <= now;
        });
    } else {
        // "incoming"
        const cutoff = new Date(now);
        cutoff.setDate(now.getDate() + range);
        return bookings.filter((b) => {
            if (!b.date) return false;
            const bookingDate = new Date(b.date);
            return bookingDate >= now && bookingDate <= cutoff;
        });
    }
}

// Build a map { "2025-02-25": sumOfCapacities, ... }
function getDailyClients(bookings) {
    const map = {};
    for (const b of bookings) {
        if (!b.date) continue;
        const dateStr = b.date;

        // Summation is based on tableAvailability.capacity
        const capacity = b?.tableAvailability?.capacity || 0;

        if (!map[dateStr]) map[dateStr] = 0;
        map[dateStr] += capacity;
    }
    return map;
}

export default function VisualizeBookings({ bookings }) {
    const [mode, setMode] = useState("past"); // "past" or "incoming"
    const [range, setRange] = useState(7);    // 7, 30, 90

    const [todayStatus, setTodayStatus] = useState("Loading...");
    const [todayLabel, setTodayLabel] = useState("");

    //
    // 1) Check if today is open or closed
    //
    useEffect(() => {
        const today = new Date();
        const dayOfWeek = today.getDay(); // Sunday=0, Monday=1, Tuesday=2, ...
        const options = { year: "numeric", month: "long", day: "numeric" };
        setTodayLabel(today.toLocaleDateString(undefined, options));

        // If Monday or Tuesday => closed
        if (dayOfWeek === 1 || dayOfWeek === 2) {
            setTodayStatus("Closed (Monday or Tuesday)");
            return;
        }

        // Otherwise, fetch
        const isoDate = formatDate(today);

        async function checkAvailability() {
            try {
                const lunchData = await fetchAvailableTimeSlots({
                    date: isoDate,
                    mealType: "lunch",
                });
                const dinnerData = await fetchAvailableTimeSlots({
                    date: isoDate,
                    mealType: "dinner",
                });

                const isLunchOpen = Object.keys(lunchData).length > 0;
                const isDinnerOpen = Object.keys(dinnerData).length > 0;

                if (!isLunchOpen && !isDinnerOpen) {
                    setTodayStatus("Closed (no lunch or dinner availability)");
                } else if (isLunchOpen && isDinnerOpen) {
                    setTodayStatus("Open for Lunch and Dinner");
                } else if (isLunchOpen) {
                    setTodayStatus("Open for Lunch only");
                } else {
                    setTodayStatus("Open for Dinner only");
                }
            } catch (error) {
                console.error("Error fetching today's availability:", error);
                setTodayStatus("Error: could not load availability.");
            }
        }

        checkAvailability();
    }, []);

    //
    // 2) Filter bookings for the chosen mode + range
    //
    const filteredBookings = filterBookingsByRange(bookings, mode, range);

    // We sum tableAvailability.capacity
    const totalClients = filteredBookings.reduce((acc, b) => {
        const capacity = b?.tableAvailability?.capacity || 0;
        return acc + capacity;
    }, 0);

    //
    // 3) Prepare the bar chart data
    //    We'll show a contiguous list of days, each day gets sum of capacities
    //
    const dateLabels = generateDateRange(mode, range); // e.g. 7 consecutive days
    const dailyMap = getDailyClients(filteredBookings); // { date -> sumOfCapacity }

    // Build an array in the correct order:
    const dailyData = dateLabels.map((dStr) => {
        return {
            date: dStr,
            clients: dailyMap[dStr] || 0,
        };
    });

    // ChartJS data
    const chartData = {
        labels: dailyData.map((d) => d.date),
        datasets: [
            {
                label: "Clients",
                data: dailyData.map((d) => d.clients),
                backgroundColor: "rgba(54, 162, 235, 0.6)", // a soft blue
            },
        ],
    };

    // ChartJS options (optional)
    const chartOptions = {
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    // Today’s quick breakdown: how many lunch/dinner bookings
    const todayStr = formatDate(new Date());
    const todaysLunch = bookings.filter(
        (b) => b.date === todayStr && b.mealType === "lunch"
    );
    const todaysDinner = bookings.filter(
        (b) => b.date === todayStr && b.mealType === "dinner"
    );

    // Dynamic labels for the boxes
    function getModeLabel(m) {
        return m === "past" ? "Last" : "Next";
    }
    function getRangeLabel(r) {
        if (r === 7) return "7 Days";
        if (r === 30) return "1 Month";
        if (r === 90) return "3 Months";
        return `${r} Days`;
    }

    const bookingsLabel = `Bookings (${getModeLabel(mode)} ${getRangeLabel(range)})`;
    const clientsLabel = `Total Clients (${getModeLabel(mode)} ${getRangeLabel(range)})`;

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Visualize Bookings</h2>

            {/* (A) Mode Selector: Past vs. Upcoming */}
            <div className="mb-4 flex items-center space-x-2">
                <span className="font-semibold text-gray-700">View:</span>
                <button
                    className={`px-3 py-1 rounded ${
                        mode === "past" ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setMode("past")}
                >
                    Past
                </button>
                <button
                    className={`px-3 py-1 rounded ${
                        mode === "incoming" ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setMode("incoming")}
                >
                    Upcoming
                </button>
            </div>

            {/* (B) Range Selector: 7, 30, 90 */}
            <div className="mb-4 flex items-center space-x-2">
                <span className="font-semibold text-gray-700">Time Range:</span>
                <button
                    className={`px-3 py-1 rounded ${
                        range === 7 ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setRange(7)}
                >
                    7 Days
                </button>
                <button
                    className={`px-3 py-1 rounded ${
                        range === 30 ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setRange(30)}
                >
                    1 Month
                </button>
                <button
                    className={`px-3 py-1 rounded ${
                        range === 90 ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setRange(90)}
                >
                    3 Months
                </button>
            </div>

            {/* (C) Top Row: Today + Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Today Status */}
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold mb-1">Today</h3>
                    <p className="text-sm text-gray-500">{todayLabel}</p>
                    <p className="mt-2 text-xl font-bold text-blue-600">
                        {todayStatus}
                    </p>
                </div>

                {/* # of Bookings in range */}
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold mb-2">{bookingsLabel}</h3>
                    <p className="text-2xl font-bold text-blue-600">
                        {filteredBookings.length}
                    </p>
                </div>

                {/* Total Clients in range */}
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold mb-2">{clientsLabel}</h3>
                    <p className="text-2xl font-bold text-green-600">
                        {totalClients}
                    </p>
                </div>
            </div>

            {/* (D) Today’s Bookings (Lunch + Dinner) */}
            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-4">Today’s Bookings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* LUNCH */}
                    <div className="bg-blue-50 p-3 rounded">
                        <h4 className="text-base font-semibold text-blue-800 mb-2">
                            Lunch Bookings
                        </h4>
                        <p className="text-xl font-bold text-blue-600">
                            {todaysLunch.length} bookings
                        </p>
                    </div>

                    {/* DINNER */}
                    <div className="bg-purple-50 p-3 rounded">
                        <h4 className="text-base font-semibold text-purple-800 mb-2">
                            Dinner Bookings
                        </h4>
                        <p className="text-xl font-bold text-purple-600">
                            {todaysDinner.length} bookings
                        </p>
                    </div>
                </div>
            </div>

            {/* (E) Bar Chart: Daily Clients */}
            <div className="bg-white rounded-lg shadow p-4 mt-6">
                <h3 className="text-lg font-semibold mb-4">Clients by Day</h3>
                <Bar data={chartData} options={chartOptions} />
            </div>
        </div>
    );
}
