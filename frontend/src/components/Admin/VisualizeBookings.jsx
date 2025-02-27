import React, { useState, useEffect } from "react";
import { format, addDays, isSameDay, parseISO, subDays, isAfter, isBefore, isEqual } from "date-fns";
import AdminCompactView from "./AdminCompactView";
import AdminCalendarView from "./AdminCalendarView";
import AdminDaySchedule from "./AdminDaySchedule";

// Helper to format a Date as YYYY-MM-DD
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
        for (let i = 0; i <= range; i++) {
            dates.push(formatDate(addDays(today, i)));
        }
    }
    return dates;
}

// Filter bookings by range (past or incoming) using the nested date field
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
        const bookingDateStr = b.table_availability?.date || b.date;
        const bookingDate = parseISO(bookingDateStr);
        return (
            (isAfter(bookingDate, startDate) || isEqual(bookingDate, startDate)) &&
            (isBefore(bookingDate, endDate) || isEqual(bookingDate, endDate))
        );
    });
}

// Build a map of total clients per day from bookings
function getDailyClients(bookings) {
    const dailyMap = {};
    bookings.forEach((b) => {
        const bookingDate = b.table_availability?.date || b.date;
        const capacity = b?.table_availability?.capacity || 0;
        dailyMap[bookingDate] = (dailyMap[bookingDate] || 0) + capacity;
    });
    return dailyMap;
}

export default function VisualizeBookings({ bookings }) {
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

        setTodayStatus("Open");
    }, []);

    return (
        <div>
            <div className="mb-4">
                <h2 className="text-xl font-bold">Bookings Overview</h2>
                <p className="text-sm text-gray-600">
                    Today: {todayLabel} - {todayStatus}
                </p>
            </div>
            <div className="mb-4">
                {displayStyle === "compact" ? (
                    <AdminCompactView selectedDate={selectedDay} onSelectDay={setSelectedDay} bookings={bookings} />
                ) : (
                    <AdminCalendarView selectedDate={selectedDay} onSelectDay={setSelectedDay} bookings={bookings} />
                )}
            </div>
            {selectedDay && (
                <AdminDaySchedule selectedDate={selectedDay} bookings={bookings} onClose={() => setSelectedDay(null)} />
            )}
        </div>
    );
}
