// src/components/Admin/VisualizeBookings.jsx

import React, { useState, useEffect } from "react";
import {
    format,
    addDays,
    parseISO,
    isAfter,
    isBefore,
    isEqual,
    subDays,
} from "date-fns";

import { fetchTableAvailabilityRange } from "../../services/bookingService";

import AdminCompactView from "./AdminCompactView";
import AdminCalendarView from "./AdminCalendarView";
import AdminDaySchedule from "./AdminDaySchedule";
import AdminChartView from "./AdminChartView"; // NEW

function toYmd(dateObj) {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function filterBookingsInRange(bookings, startDate, endDate) {
    return bookings.filter((b) => {
        const bookingDateStr = b.table_availability?.date || b.date;
        const bookingDate = parseISO(bookingDateStr);
        return (
            (isAfter(bookingDate, startDate) || isEqual(bookingDate, startDate)) &&
            (isBefore(bookingDate, endDate) || isEqual(bookingDate, endDate))
        );
    });
}

export default function VisualizeBookings({ bookings }) {
    const [rangeType, setRangeType] = useState("past7"); // "past7", "future7", "future30", "future90"
    const [displayStyle, setDisplayStyle] = useState("compact"); // "compact", "calendar", "chart"
    const [selectedDay, setSelectedDay] = useState(null);

    const [tableAvailability, setTableAvailability] = useState({});
    const [loadingTA, setLoadingTA] = useState(false);

    // Compute start/end from rangeType
    const today = new Date();
    let startDate, endDate;
    if (rangeType === "past7") {
        startDate = subDays(today, 7);
        endDate = today;
    } else if (rangeType === "future7") {
        startDate = today;
        endDate = addDays(today, 7);
    } else if (rangeType === "future30") {
        startDate = today;
        endDate = addDays(today, 30);
    } else if (rangeType === "future90") {
        startDate = today;
        endDate = addDays(today, 90);
    }

    // Fetch tableAvailability for the chosen start/end
    useEffect(() => {
        async function loadData() {
            setLoadingTA(true);
            try {
                const data = await fetchTableAvailabilityRange(
                    toYmd(startDate),
                    toYmd(endDate),
                    "lunch"
                );
                setTableAvailability(data);
            } catch (err) {
                console.error("Error fetching table availability range:", err);
                setTableAvailability({});
            } finally {
                setLoadingTA(false);
            }
        }
        loadData();
    }, [rangeType]); // depends on rangeType (thus startDate/endDate)

    // Filter bookings to that same range
    const filteredBookings = filterBookingsInRange(bookings, startDate, endDate);

    // Show today's open/closed status
    const [todayStatus, setTodayStatus] = useState("Loading...");
    useEffect(() => {
        const dayOfWeek = today.getDay();
        if (dayOfWeek === 1 || dayOfWeek === 2) {
            setTodayStatus("Closed (Mon or Tue)");
        } else {
            setTodayStatus("Open");
        }
    }, [today]);

    return (
        <div>
            <div className="mb-4 flex items-center justify-between flex-wrap gap-y-2">
                <div>
                    <h2 className="text-xl font-bold">Bookings Overview</h2>
                    <p className="text-sm text-gray-600">
                        Today: {format(today, "PPP")} - {todayStatus}
                    </p>
                </div>
                <div className="space-x-2">
                    {/* Range Selector */}
                    <select
                        className="border border-gray-300 rounded p-1"
                        value={rangeType}
                        onChange={(e) => setRangeType(e.target.value)}
                    >
                        <option value="past7">Past 7 Days</option>
                        <option value="future7">Upcoming 7 Days</option>
                        <option value="future30">Upcoming 1 Month</option>
                        <option value="future90">Upcoming 3 Months</option>
                    </select>
                    {/* Display Style Selector */}
                    <select
                        className="border border-gray-300 rounded p-1"
                        value={displayStyle}
                        onChange={(e) => setDisplayStyle(e.target.value)}
                    >
                        <option value="compact">Compact</option>
                        <option value="calendar">Calendar</option>
                        <option value="chart">Chart</option>
                    </select>
                </div>
            </div>

            <div className="mb-4">
                {displayStyle === "compact" && (
                    <AdminCompactView
                        selectedDate={selectedDay}
                        onSelectDay={setSelectedDay}
                        bookings={filteredBookings}
                    />
                )}
                {displayStyle === "calendar" && (
                    <AdminCalendarView
                        selectedDate={selectedDay}
                        onSelectDay={setSelectedDay}
                        bookings={filteredBookings}
                    />
                )}
                {displayStyle === "chart" && (
                    <AdminChartView bookings={filteredBookings} />
                )}
            </div>

            {selectedDay && (
                <AdminDaySchedule
                    selectedDate={selectedDay}
                    bookings={filteredBookings}
                    tableAvailability={tableAvailability}
                    onClose={() => setSelectedDay(null)}
                />
            )}

            {loadingTA && (
                <p className="text-sm text-gray-500">
                    Loading table availability for the selected range...
                </p>
            )}
        </div>
    );
}
