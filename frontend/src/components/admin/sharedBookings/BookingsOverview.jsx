// src/components/Admin/SharedBookings/BookingsOverview.jsx
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
    format,
    addDays,
    subDays,
    parseISO,
    differenceInCalendarDays,
} from "date-fns";
import { fetchTableAvailabilityRange } from "../../../services/bookingService";
import BookingsCompactView from "./BookingsCompactView";
import BookingsCalendarView from "./BookingsCalendarView";
import BookingsChart from "./BookingsChart";
import DaySchedule from "./DaySchedule";
import AddBookingModal from "../CurrentBookings/AddBookingModal";

const ymd = (d) => format(d, "yyyy-MM-dd");

export default function BookingsOverview({ mode, bookings }) {
    /* ------------------------------------------------------------------
       Local state
    ------------------------------------------------------------------*/
    const today = new Date();
    const [rangeDays, setRangeDays] = useState(7); // CHART window only
    const [view, setView] = useState("compact");  // calendar | compact
    const [selDay, setSelDay] = useState(null);
    const [ta, setTA] = useState({});
    const [loadingTA, setLoadingTA] = useState(false);
    const [showModal, setShowModal] = useState(false);

    /* ------------------------------------------------------------------
       Derived start / end for fetch + chart filtering
    ------------------------------------------------------------------*/
    const start = mode === "future" ? today : subDays(today, rangeDays);
    const end = mode === "future" ? addDays(today, rangeDays) : today;

    /* compact allowed only on 7‑day window */
    useEffect(() => {
        if (view === "compact" && rangeDays !== 7) setView("calendar");
    }, [view, rangeDays]);

    /* Fetch table availability for [start,end] whenever window changes */
    useEffect(() => {
        (async () => {
            setLoadingTA(true);
            try {
                const [lunch, dinner] = await Promise.all([
                    fetchTableAvailabilityRange(ymd(start), ymd(end), "lunch"),
                    fetchTableAvailabilityRange(ymd(start), ymd(end), "dinner"),
                ]);
                const merged = {};
                [lunch, dinner].forEach((src) =>
                    Object.entries(src).forEach(([d, info]) => {
                        merged[d] = merged[d] ? { ...merged[d], ...info } : info;
                    })
                );
                setTA(merged);
            } catch (e) {
                console.error(e);
                setTA({});
            } finally {
                setLoadingTA(false);
            }
        })();
    }, [mode, rangeDays]);

    /* Filter bookings according to MODE + WINDOW */
    const filtered = bookings.filter((b) => {
        const dateStr = b.table_availability?.date || b.date;
        const d = parseISO(dateStr);
        if (mode === "future" && differenceInCalendarDays(d, today) <= 0) return false;
        if (mode === "past" && differenceInCalendarDays(d, today) >= 0) return false;
        return d >= start && d <= end;
    });

    const totalBookings = filtered.length;
    const totalClients = filtered.reduce(
        (sum, b) => sum + (b.total_adults || 0) + (b.total_kids || 0),
        0
    );

    const handleSaved = () => {
        setShowModal(false);
        window.location.reload();
    };

    /* ------------------------------------------------------------------
       Render
    ------------------------------------------------------------------*/
    return (
        <div className="p-6 bg-white rounded shadow space-y-6">
            {/* Header -----------------------------------------------------------*/}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">
                        {mode === "future" ? "Future" : "Past"} Bookings
                    </h2>
                    <p className="text-sm text-gray-500">
                        Data window for chart: {ymd(start)} → {ymd(end)}
                    </p>
                </div>
                {/* Only list-view selector stays here */}
                <div>
                    <select
                        className="border rounded p-1"
                        value={view}
                        onChange={(e) => setView(e.target.value)}
                    >
                        {rangeDays === 7 && <option value="compact">Compact</option>}
                        <option value="calendar">Calendar</option>
                    </select>
                </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded text-center">
                    <p className="text-xs text-gray-600">Bookings</p>
                    <p className="text-xl font-bold">{totalBookings}</p>
                </div>
                <div className="bg-green-50 p-3 rounded text-center">
                    <p className="text-xs text-gray-600">Total Clients</p>
                    <p className="text-xl font-bold">{totalClients}</p>
                </div>
            </div>

            {/* List view (Calendar / Compact) */}
            {view === "compact" && (
                <BookingsCompactView
                    mode={mode}
                    rangeDays={7}
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

            {/* Chart controls ----------------------------------------------------*/}
            <div className="flex justify-end mt-6 mb-2">
                <select
                    className="border rounded p-1"
                    value={rangeDays}
                    onChange={(e) => setRangeDays(Number(e.target.value))}
                >
                    {mode === "future" ? (
                        <>
                            <option value={7}>Upcoming 7 d</option>
                            <option value={30}>Upcoming 1 mo</option>
                            <option value={90}>Upcoming 3 mo</option>
                        </>
                    ) : (
                        <>
                            <option value={7}>Past 7 d</option>
                            <option value={30}>Past 1 mo</option>
                            <option value={90}>Past 3 mo</option>
                        </>
                    )}
                </select>
            </div>

            {/* Chart */}
            <BookingsChart
                key={`${mode}-${rangeDays}`}
                bookings={filtered}
                startDate={start}
                days={rangeDays}
            />

            {/* Day drill‑in */}
            {selDay && (
                <div className="mt-4 relative">
                    {mode === "future" && (
                        <button
                            onClick={() => setShowModal(true)}
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
                        enableZoom
                    />
                </div>
            )}

            {/* Manual add */}
            {showModal && selDay && (
                <AddBookingModal
                    dateObj={selDay}
                    onClose={() => setShowModal(false)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}

BookingsOverview.propTypes = {
    mode: PropTypes.oneOf(["future", "past"]).isRequired,
    bookings: PropTypes.arrayOf(PropTypes.object).isRequired,
};
