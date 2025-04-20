import React, { useState, useEffect } from "react";
import {
    format,
    addDays,
    subDays,
    parseISO,
    isAfter,
    isBefore,
    differenceInCalendarDays,
} from "date-fns";
import { fetchTableAvailabilityRange } from "../../../services/bookingService";
import BookingsCompactView from "./BookingsCompactView";
import BookingsCalendarView from "./BookingsCalendarView";
import BookingsChart from "./BookingsChart";
import DaySchedule from "./DaySchedule";
// NEW
import AddBookingModal from "../Current/AddBookingModal";

const ymd = (d) => format(d, "yyyy-MM-dd");

/* helper – skip TODAY for future view */
function inWindow(d, start, end, mode) {
    const cmp = differenceInCalendarDays(d, new Date()); // <0 past, 0 today, >0 future
    if (mode === "future" && cmp <= 0) return false; // tomorrow+
    if (mode === "past" && cmp >= 0) return false; // strictly yesterday back
    return !isBefore(d, start) && !isAfter(d, end);
}

function filterBookings(bookings, start, end, mode) {
    return bookings.filter((b) => {
        const dStr = b.table_availability?.date || b.date;
        if (!dStr) return false;
        return inWindow(parseISO(dStr), start, end, mode);
    });
}

export default function BookingsOverview({ mode, bookings }) {
    const today = new Date();
    const [rangeDays, setRange] = useState(7);
    const [view, setView] = useState("compact");
    const [selDay, setSelDay] = useState(null);
    const [ta, setTA] = useState({});
    const [loadingTA, setLoading] = useState(false);
    // NEW state
    const [showModal, setModal] = useState(false);

    const start = mode === "future" ? today : subDays(today, rangeDays);
    const end = mode === "future" ? addDays(today, rangeDays) : today;

    /* pull table availability for schedule */
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const data = await fetchTableAvailabilityRange(
                    ymd(start),
                    ymd(end),
                    "lunch"
                );
                setTA(data);
            } catch (e) {
                console.error(e);
                setTA({});
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, rangeDays]);

    const filtered = filterBookings(bookings, start, end, mode);
    const totalBookings = filtered.length;
    const totalClients = filtered.reduce(
        (s, b) => s + (b.total_adults || 0) + (b.total_kids || 0),
        0
    );

    /* save from modal */
    const handleSaved = () => {
        setModal(false);
        window.location.reload();
    };

    return (
        <div className="p-6 bg-white rounded shadow">
            {/* header & summary */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">
                        {mode === "future" ? "Future" : "Past"} Bookings
                    </h2>
                    <p className="text-sm text-gray-500">
                        Window: {ymd(start)} → {ymd(end)}
                    </p>
                </div>

                <div className="flex space-x-2">
                    <select
                        className="border rounded p-1"
                        value={rangeDays}
                        onChange={(e) => setRange(Number(e.target.value))}
                    >
                        {mode === "future" ? (
                            <>
                                <option value={7}>Upcoming 7 d</option>
                                <option value={30}>Upcoming 1 mo</option>
                                <option value={90}>Upcoming 3 mo</option>
                            </>
                        ) : (
                            <>
                                <option value={7}>Past 7 d</option>
                                <option value={30}>Past 1 mo</option>
                                <option value={90}>Past 3 mo</option>
                            </>
                        )}
                    </select>
                    <select
                        className="border rounded p-1"
                        value={view}
                        onChange={(e) => setView(e.target.value)}
                    >
                        <option value="compact">Compact</option>
                        <option value="calendar">Calendar</option>
                        <option value="chart">Chart</option>
                    </select>
                </div>
            </div>

            {/* quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
                <div className="bg-blue-50 p-3 rounded text-center">
                    <p className="text-xs text-gray-600">Bookings</p>
                    <p className="text-xl font-bold">{totalBookings}</p>
                </div>
                <div className="bg-green-50 p-3 rounded text-center">
                    <p className="text-xs text-gray-600">Total Clients</p>
                    <p className="text-xl font-bold">{totalClients}</p>
                </div>
            </div>

            {/* main view */}
            {view === "compact" && (
                <BookingsCompactView
                    mode={mode}
                    rangeDays={rangeDays}
                    selectedDate={selDay}
                    onSelectDay={setSelDay}
                    bookings={filtered}
                />
            )}
            {view === "calendar" && (
                <BookingsCalendarView
                    selectedDate={selDay}
                    onSelectDay={setSelDay}
                    bookings={filtered}
                />
            )}
            {view === "chart" && <BookingsChart bookings={filtered} />}

            {/* schedule & manual‑booking btn */}
            {selDay && (
                <div className="mt-4 relative">
                    {mode === "future" && (
                        <button
                            onClick={() => setModal(true)}
                            className="absolute right-0 -top-10 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            + Manual Booking
                        </button>
                    )}
                    <DaySchedule
                        selectedDate={selDay}
                        bookings={filtered}
                        tableAvailability={ta}
                        onClose={() => setSelDay(null)}
                    />
                </div>
            )}

            {loadingTA && (
                <p className="text-sm text-gray-500 mt-2">Loading table availability…</p>
            )}

            {/* modal */}
            {showModal && selDay && (
                <AddBookingModal
                    dateObj={selDay}
                    onClose={() => setModal(false)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}
