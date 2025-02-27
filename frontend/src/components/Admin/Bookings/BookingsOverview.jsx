// src/components/Admin/Booking/BookingsOverview.jsx
import React, { useState, useEffect } from "react";
import { format, addDays, subDays, isAfter, isBefore, isEqual, parseISO } from "date-fns";
import { fetchTableAvailabilityRange } from "../../../services/bookingService";
import BookingsCompactView from "./BookingsCompactView";
import BookingsCalendarView from "./BookingsCalendarView";
import BookingsChart from "./BookingsChart";
import DaySchedule from "./DaySchedule";

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

export default function BookingsOverview({ mode, bookings }) {
    // mode: "future" or "past"
    const today = new Date();
    const [rangeDays, setRangeDays] = useState(7); // default 7 days
    const [viewType, setViewType] = useState("compact"); // "compact", "calendar", "chart"
    const [selectedDay, setSelectedDay] = useState(today);
    const [tableAvailability, setTableAvailability] = useState({});
    const [loadingTA, setLoadingTA] = useState(false);

    // Compute start and end dates based on mode and rangeDays
    let startDate, endDate;
    if (mode === "future") {
        startDate = today;
        endDate = addDays(today, rangeDays);
    } else {
        startDate = subDays(today, rangeDays);
        endDate = today;
    }

    useEffect(() => {
        async function loadAvailability() {
            setLoadingTA(true);
            try {
                const data = await fetchTableAvailabilityRange(toYmd(startDate), toYmd(endDate), "lunch");
                setTableAvailability(data);
            } catch (err) {
                console.error("Error fetching table availability:", err);
                setTableAvailability({});
            } finally {
                setLoadingTA(false);
            }
        }
        loadAvailability();
    }, [rangeDays, mode]);

    const filteredBookings = filterBookingsInRange(bookings, startDate, endDate);

    return (
        <div className="p-4 bg-gray-50 rounded shadow">
            <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                    {mode === "future" ? "Future Booking" : "Past Booking"}
                </h2>
                <div className="flex items-center space-x-4 mt-2 md:mt-0">
                    <select
                        className="border border-gray-300 rounded p-1"
                        value={rangeDays}
                        onChange={(e) => setRangeDays(Number(e.target.value))}
                    >
                        {mode === "future" ? (
                            <>
                                <option value={7}>Upcoming 7 Days</option>
                                <option value={30}>Upcoming 1 Month</option>
                                <option value={90}>Upcoming 3 Months</option>
                            </>
                        ) : (
                            <>
                                <option value={7}>Past 7 Days</option>
                                <option value={30}>Past 1 Month</option>
                                <option value={90}>Past 3 Months</option>
                            </>
                        )}
                    </select>
                    <select
                        className="border border-gray-300 rounded p-1"
                        value={viewType}
                        onChange={(e) => setViewType(e.target.value)}
                    >
                        <option value="compact">Compact</option>
                        <option value="calendar">Calendar</option>
                        <option value="chart">Chart</option>
                    </select>
                </div>
            </div>

            <div className="mb-4">
                {viewType === "compact" && (
                    <BookingsCompactView
                        selectedDate={selectedDay}
                        onSelectDay={setSelectedDay}
                        bookings={filteredBookings}
                    />
                )}
                {viewType === "calendar" && (
                    <BookingsCalendarView
                        selectedDate={selectedDay}
                        onSelectDay={setSelectedDay}
                        bookings={filteredBookings}
                    />
                )}
                {viewType === "chart" && <BookingsChart bookings={filteredBookings} />}
            </div>

            {/* Always show the detailed day schedule for the selected day */}
            <DaySchedule
                selectedDate={selectedDay}
                bookings={filteredBookings}
                tableAvailability={tableAvailability}
                onClose={() => {}}
            />

            {loadingTA && (
                <p className="text-sm text-gray-500">
                    Loading table availability for the selected range...
                </p>
            )}
        </div>
    );
}
