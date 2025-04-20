import React, { useState, useEffect } from "react";
import {
    format,
    addDays,
    subDays,
    isAfter,
    isBefore,
    isEqual,
    parseISO,
} from "date-fns";
import { fetchTableAvailabilityRange } from "../../../services/bookingService";
import BookingsCompactView from "./BookingsCompactView";
import BookingsCalendarView from "./BookingsCalendarView";
import BookingsChart from "./BookingsChart";
import DaySchedule from "./DaySchedule";

function toYmd(d) {
    return format(d, "yyyy-MM-dd");
}

function filterBookingsInRange(bookings, start, end, mode) {
    const todayStr = toYmd(new Date());
    return bookings.filter((b) => {
        const dateStr = b.table_availability?.date || b.date;
        if (!dateStr) return false;
        // in the window
        if (
            (dateStr < toYmd(start) && !isEqual(parseISO(dateStr), start)) ||
            (dateStr > toYmd(end) && !isEqual(parseISO(dateStr), end))
        ) {
            return false;
        }
        // mode filter
        if (mode === "past") return dateStr < todayStr;
        if (mode === "future") return dateStr > todayStr;
        return true;
    });
}

export default function BookingsOverview({ mode, bookings }) {
    const today = new Date();
    const [rangeDays, setRangeDays] = useState(7);
    const [viewType, setViewType] = useState("compact"); // "compact" | "calendar" | "chart"
    const [selectedDay, setSelectedDay] = useState(today);
    const [tableAvailability, setTableAvailability] = useState({});
    const [loadingTA, setLoadingTA] = useState(false);

    // derive start/end
    const startDate =
        mode === "future" ? today : subDays(today, rangeDays);
    const endDate =
        mode === "future" ? addDays(today, rangeDays) : today;

    // fetch availability whenever mode or range changes
    useEffect(() => {
        async function loadTA() {
            setLoadingTA(true);
            try {
                const data = await fetchTableAvailabilityRange(
                    toYmd(startDate),
                    toYmd(endDate),
                    "lunch"
                );
                setTableAvailability(data);
            } catch (err) {
                console.error(err);
                setTableAvailability({});
            } finally {
                setLoadingTA(false);
            }
        }
        loadTA();
    }, [mode, rangeDays]); // eslint-disable-line

    const filtered = filterBookingsInRange(
        bookings,
        startDate,
        endDate,
        mode
    );

    return (
        <div className="p-4 bg-gray-50 rounded shadow">
            <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                    {mode === "future" ? "Future Bookings" : "Past Bookings"}
                </h2>

                <div className="flex items-center space-x-4 mt-2 md:mt-0">
                    <select
                        className="border border-gray-300 rounded p-1"
                        value={rangeDays}
                        onChange={(e) => setRangeDays(Number(e.target.value))}
                    >
                        {mode === "future" ? (
                            <>
                                <option value={7}>Upcoming 7 Days</option>
                                <option value={30}>Upcoming 1 Month</option>
                                <option value={90}>Upcoming 3 Months</option>
                            </>
                        ) : (
                            <>
                                <option value={7}>Past 7 Days</option>
                                <option value={30}>Past 1 Month</option>
                                <option value={90}>Past 3 Months</option>
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
                        mode={mode}
                        rangeDays={rangeDays}
                        selectedDate={selectedDay}
                        onSelectDay={setSelectedDay}
                        bookings={filtered}
                    />
                )}
                {viewType === "calendar" && (
                    <BookingsCalendarView
                        selectedDate={selectedDay}
                        onSelectDay={setSelectedDay}
                        bookings={filtered}
                    />
                )}
                {viewType === "chart" && <BookingsChart bookings={filtered} />}
            </div>

            <DaySchedule
                selectedDate={selectedDay}
                bookings={filtered}
                tableAvailability={tableAvailability}
                onClose={() => {}}
            />

            {loadingTA && (
                <p className="text-sm text-gray-500">
                    Loading table availability…
                </p>
            )}
        </div>
    );
}
