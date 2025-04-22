import React, { useState, useMemo, useEffect } from "react";
import { format, addDays } from "date-fns";
import AddBookingModal from "./AddBookingModal";
import EditBookingModal from "./EditBookingModal";
import DaySchedule from "../SharedBookings/DaySchedule";
import { fetchTableAvailabilityRange } from "../../../services/bookingService";

export default function CurrentBookings({ bookings, onDataRefresh }) {
    const [offset, setOffset] = useState(0);
    const [addModal, setAdd] = useState(false);
    const [editBk, setEdit] = useState(null);

    const [ta, setTA] = useState({});
    const [loadingTA, setLoadingTA] = useState(false);

    const dateObj = useMemo(() => addDays(new Date(), offset), [offset]);
    const dateStr = format(dateObj, "yyyy-MM-dd");

    const filtered = useMemo(
        () => bookings.filter((b) => (b.table_availability?.date || b.date) === dateStr),
        [bookings, dateStr]
    );

    const totalB = filtered.length;
    const totalC = filtered.reduce((sum, b) => sum + b.total_adults + b.total_kids, 0);

    useEffect(() => {
        (async () => {
            setLoadingTA(true);
            try {
                const [lunch, dinner] = await Promise.all([
                    fetchTableAvailabilityRange(dateStr, dateStr, "lunch"),
                    fetchTableAvailabilityRange(dateStr, dateStr, "dinner"),
                ]);
                const merged = {};
                [lunch, dinner].forEach((src) =>
                    Object.entries(src).forEach(([d, obj]) => {
                        merged[d] = merged[d] ? { ...merged[d], ...obj } : obj;
                    })
                );
                setTA(merged);
            } catch {
                setTA({});
            } finally {
                setLoadingTA(false);
            }
        })();
    }, [dateStr]);

    const title =
        offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : format(dateObj, "EEEE, MMM d");

    return (
        <div className="bg-white p-4 rounded shadow">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <h2 className="text-xl font-bold">{title}</h2>
                <div className="space-x-2">
                    <button onClick={() => setOffset((o) => o - 1)} className="px-2 py-1 border rounded">
                        ◀
                    </button>
                    <button onClick={() => setOffset((o) => o + 1)} className="px-2 py-1 border rounded">
                        ▶
                    </button>
                    <button
                        onClick={() => setAdd(true)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        + Manual Booking
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded text-center">
                    <p className="text-xs text-gray-600">Bookings</p>
                    <p className="text-xl font-bold">{totalB}</p>
                </div>
                <div className="bg-green-50 p-3 rounded text-center">
                    <p className="text-xs text-gray-600">Total Clients</p>
                    <p className="text-xl font-bold">{totalC}</p>
                </div>
            </div>

            <DaySchedule
                selectedDate={dateObj}
                bookings={filtered}
                tableAvailability={ta}
                onClose={() => {}}
                enableZoom
            />

            {loadingTA && <p className="text-sm text-gray-500 mt-2">Loading table availability…</p>}

            {addModal && (
                <AddBookingModal
                    dateObj={dateObj}
                    onClose={() => setAdd(false)}
                    onSaved={() => {
                        setAdd(false);
                        onDataRefresh();
                    }}
                />
            )}
            {editBk && (
                <EditBookingModal
                    booking={editBk}
                    onClose={() => setEdit(null)}
                    onSaved={() => {
                        setEdit(null);
                        onDataRefresh();
                    }}
                />
            )}
        </div>
    );
}
