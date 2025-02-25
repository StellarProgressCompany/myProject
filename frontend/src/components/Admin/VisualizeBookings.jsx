import React, { useState, useEffect } from "react";
import { fetchAvailableTimeSlots } from "../../services/bookingService";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import { subDays, addDays, parseISO, isAfter, isBefore, isEqual } from "date-fns";

import AdminCompactView from "./AdminCompactView";
import AdminCalendarView from "./AdminCalendarView";
import AdminDaySchedule from "./AdminDaySchedule";

// Helper to format date as YYYY-MM-DD
export function formatDate(dateObj) {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

// Generate a date range as an array of YYYY-MM-DD strings
function generateDateRange(mode, range) {
    const dates = [];
    const today = new Date();
    if (mode === "past") {
        const startDate = subDays(today, range);
        for (let d = startDate; d <= today; d = addDays(d, 1)) {
            dates.push(formatDate(d));
        }
    } else {
        // For "incoming" mode, include today and the next `range` days
        for (let i = 0; i <= range; i++) {
            dates.push(formatDate(addDays(today, i)));
        }
    }
    return dates;
}

// Filter bookings by range (past or incoming)
function filterBookingsByRange(bookings, mode, range) {
    if (!Array.isArray(bookings)) return [];
    const today = new Date();
    let startDate, endDate;
    if (mode === "past") {
        startDate = subDays(today, range);
        endDate = today;
    } else {
        startDate = today;
        endDate = addDays(today, range);
    }
    return bookings.filter((b) => {
        const bookingDate = parseISO(b.date);
        return (
            (isAfter(bookingDate, startDate) || isEqual(bookingDate, startDate)) &&
            (isBefore(bookingDate, endDate) || isEqual(bookingDate, endDate))
        );
    });
}

// Get a map of total clients per day from bookings
function getDailyClients(bookings) {
    const dailyMap = {};
    bookings.forEach((b) => {
        const date = b.date;
        const capacity = b?.table_availability?.capacity || 0;
        dailyMap[date] = (dailyMap[date] || 0) + capacity;
    });
    return dailyMap;
}

export default function VisualizeBookings({ bookings }) {
    // Early return if bookings is not an array
    if (!Array.isArray(bookings)) {
        return (
            <div className="text-red-600 p-4">
                <p>No valid bookings data available.</p>
            </div>
        );
    }

    const [mode, setMode] = useState("past");
    const [range, setRange] = useState(7);
    const [todayStatus, setTodayStatus] = useState("Loading...");
    const [todayLabel, setTodayLabel] = useState("");
    const [displayStyle, setDisplayStyle] = useState("compact");
    const [selectedDay, setSelectedDay] = useState(null);

    useEffect(() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const options = { year: "numeric", month: "long", day: "numeric" };
        setTodayLabel(today.toLocaleDateString(undefined, options));

        if (dayOfWeek === 1 || dayOfWeek === 2) {
            setTodayStatus("Closed (Monday or Tuesday)");
            return;
        }

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

    // Filter bookings and compute total clients
    const filteredBookings = filterBookingsByRange(bookings, mode, range);
    const totalClients = filteredBookings.reduce((acc, b) => {
        const capacity = b?.table_availability?.capacity || 0;
        return acc + capacity;
    }, 0);

    // Chart data: generate date labels and map daily clients
    const dateLabels = generateDateRange(mode, range);
    const dailyMap = getDailyClients(filteredBookings);
    const dailyData = dateLabels.map((dStr) => ({
        date: dStr,
        clients: dailyMap[dStr] || 0,
    }));

    const chartData = {
        labels: dailyData.map((d) => d.date),
        datasets: [
            {
                label: "Clients",
                data: dailyData.map((d) => d.clients),
                backgroundColor: "rgba(54, 162, 235, 0.6)",
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true },
        },
    };

    // Today's bookings: lunch and dinner
    const todayStr = formatDate(new Date());
    const todaysLunch = bookings.filter(
        (b) => b.date === todayStr && b.table_availability.meal_type === "lunch"
    );
    const todaysDinner = bookings.filter(
        (b) => b.date === todayStr && b.table_availability.meal_type === "dinner"
    );

    // Helper for labeling
    const getModeLabel = (m) => (m === "past" ? "Last" : "Next");
    const getRangeLabel = (r) => {
        if (r === 7) return "7 Days";
        if (r === 30) return "1 Month";
        if (r === 90) return "3 Months";
        return `${r} Days`;
    };

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

            {/* (B) Range Selector */}
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

            {/* (C) Display Style: Compact, Calendar, or Chart */}
            <div className="mb-4 flex items-center space-x-2">
                <span className="font-semibold text-gray-700">Display:</span>
                <button
                    className={`px-3 py-1 rounded ${
                        displayStyle === "compact" ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setDisplayStyle("compact")}
                >
                    Compact
                </button>
                <button
                    className={`px-3 py-1 rounded ${
                        displayStyle === "calendar" ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setDisplayStyle("calendar")}
                >
                    Calendar
                </button>
                <button
                    className={`px-3 py-1 rounded ${
                        displayStyle === "chart" ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setDisplayStyle("chart")}
                >
                    Chart
                </button>
            </div>

            {/* (D) Top Row: Today's Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold mb-1">Today</h3>
                    <p className="text-sm text-gray-500">{todayLabel}</p>
                    <p className="mt-2 text-xl font-bold text-blue-600">{todayStatus}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold mb-2">{bookingsLabel}</h3>
                    <p className="text-2xl font-bold text-blue-600">
                        {filteredBookings.length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold mb-2">{clientsLabel}</h3>
                    <p className="text-2xl font-bold text-green-600">{totalClients}</p>
                </div>
            </div>

            {/* (E) Today’s Bookings Breakdown */}
            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-4">Today’s Bookings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded">
                        <h4 className="text-base font-semibold text-blue-800 mb-2">
                            Lunch Bookings
                        </h4>
                        <p className="text-xl font-bold text-blue-600">
                            {todaysLunch.length} bookings
                        </p>
                    </div>
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

            {/* (F) MAIN DISPLAY */}
            <div className="mt-6">
                {displayStyle === "chart" && (
                    <div className="bg-white rounded-lg shadow p-4">
                        <h3 className="text-lg font-semibold mb-4">Clients by Day</h3>
                        <div className="h-64">
                            <Bar data={chartData} options={chartOptions} />
                        </div>
                    </div>
                )}

                {displayStyle === "compact" && (
                    <AdminCompactView
                        selectedDate={selectedDay}
                        onSelectDay={(day) => setSelectedDay(day)}
                        bookings={filteredBookings}
                    />
                )}

                {displayStyle === "calendar" && (
                    <AdminCalendarView
                        selectedDate={selectedDay}
                        onSelectDay={(day) => setSelectedDay(day)}
                        bookings={filteredBookings}
                    />
                )}
            </div>

            {/* (G) If a day is clicked, show the schedule below */}
            {selectedDay && (
                <AdminDaySchedule
                    selectedDate={selectedDay}
                    bookings={filteredBookings}
                    onClose={() => setSelectedDay(null)}
                />
            )}
        </div>
    );
}
