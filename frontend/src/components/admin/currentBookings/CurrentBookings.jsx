// src/components/Admin/CurrentBookings/CurrentBookings.jsx
import React, { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { format, addDays } from "date-fns";

import AddBookingModal from "./AddBookingModal";
import EditBookingModal from "./EditBookingModal";
import DaySchedule from "../SharedBookings/DaySchedule";
import { fetchTableAvailabilityRange } from "../../../services/bookingService";

export default function CurrentBookings({ bookings, onDataRefresh }) {
    const [offset, setOffset] = useState(0);
    const [isAdding, setIsAdding] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);

    const [tableAvailability, setTableAvailability] = useState({});
    const [loadingTA, setLoadingTA] = useState(false);

    const dateObj = useMemo(() => addDays(new Date(), offset), [offset]);
    const dateStr = format(dateObj, "yyyy-MM-dd");

    // only bookings for that day
    const todaysBookings = useMemo(
        () => bookings.filter(b => (b.table_availability?.date || b.date) === dateStr),
        [bookings, dateStr]
    );

    const totalBookings = todaysBookings.length;
    const totalClients  = todaysBookings.reduce(
        (sum, b) => sum + (b.total_adults || 0) + (b.total_kids || 0),
        0
    );

    // fetch table availability (lunch + dinner) whenever date changes
    useEffect(() => {
        let cancelled = false;
        setLoadingTA(true);

        Promise.all([
            fetchTableAvailabilityRange(dateStr, dateStr, "lunch"),
            fetchTableAvailabilityRange(dateStr, dateStr, "dinner"),
        ])
            .then(([lunch, dinner]) => {
                if (cancelled) return;
                // merge both into a single map keyed by dateStr
                const merged = {};
                [lunch, dinner].forEach(src =>
                    Object.entries(src).forEach(([d, info]) => {
                        merged[d] = merged[d] ? { ...merged[d], ...info } : info;
                    })
                );
                setTableAvailability(merged);
            })
            .catch(() => {
                if (!cancelled) setTableAvailability({});
            })
            .finally(() => {
                if (!cancelled) setLoadingTA(false);
            });

        return () => {
            cancelled = true;
        };
    }, [dateStr]);

    const title =
        offset === 0 ? "Today"
            : offset === 1 ? "Tomorrow"
                : format(dateObj, "EEEE, MMM d");

    return (
        <div className="bg-white p-4 rounded shadow">
            {/* header + controls */}
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <h2 className="text-xl font-bold">{title}</h2>
                <div className="space-x-2">
                    <button onClick={() => setOffset(o => o - 1)} className="px-2 py-1 border rounded">
                        ◀
                    </button>
                    <button onClick={() => setOffset(o => o + 1)} className="px-2 py-1 border rounded">
                        ▶
                    </button>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        + Manual Booking
                    </button>
                </div>
            </div>

            {/* metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded text-center">
                    <p className="text-xs text-gray-600">Bookings</p>
                    <p className="text-xl font-bold">{totalBookings}</p>
                </div>
                <div className="bg-green-50 p-3 rounded text-center">
                    <p className="text-xs text-gray-600">Total Clients</p>
                    <p className="text-xl font-bold">{totalClients}</p>
                </div>
            </div>

            {/* day schedule */}
            <DaySchedule
                selectedDate={dateObj}
                bookings={todaysBookings}
                tableAvailability={tableAvailability}
                onClose={() => {}}
                enableZoom
            />

            {loadingTA && (
                <p className="text-sm text-gray-500 mt-2">Loading table availability…</p>
            )}

            {/* add / edit modals */}
            {isAdding && (
                <AddBookingModal
                    dateObj={dateObj}
                    onClose={() => setIsAdding(false)}
                    onSaved={() => {
                        setIsAdding(false);
                        onDataRefresh();
                    }}
                />
            )}
            {editingBooking && (
                <EditBookingModal
                    booking={editingBooking}
                    onClose={() => setEditingBooking(null)}
                    onSaved={() => {
                        setEditingBooking(null);
                        onDataRefresh();
                    }}
                />
            )}
        </div>
    );
}

CurrentBookings.propTypes = {
    bookings:      PropTypes.array.isRequired,
    onDataRefresh: PropTypes.func.isRequired,
};
