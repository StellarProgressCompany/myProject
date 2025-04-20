import React, { useMemo, useState } from "react";
import { format, addDays } from "date-fns";
import AddBookingModal from "./AddBookingModal";

function ymd(d) {
    return format(d, "yyyy-MM-dd");
}

// helper to bucket by meal/round
function classify(booking) {
    const time = booking.reserved_time?.slice(0, 5) || "";
    const meal = booking.meal_type || "lunch";

    if (meal === "lunch") {
        return time < "15:00" ? "Lunch – 1st Round" : "Lunch – 2nd Round";
    }
    return "Dinner";
}

export default function CurrentBookings({ bookings, onDataRefresh }) {
    const [dayOffset, setDayOffset] = useState(0); // 0 = today
    const [showModal, setShowModal] = useState(false);

    const dateObj = useMemo(() => addDays(new Date(), dayOffset), [dayOffset]);
    const dateStr = ymd(dateObj);

    const buckets = useMemo(() => {
        const init = {
            "Lunch – 1st Round": [],
            "Lunch – 2nd Round": [],
            Dinner: [],
        };
        bookings.forEach((b) => {
            const d = b.table_availability?.date || b.date;
            if (d === dateStr) {
                init[classify(b)].push(b);
            }
        });
        return init;
    }, [bookings, dateStr]);

    const title =
        dayOffset === 0
            ? "Today"
            : dayOffset === 1
                ? "Tomorrow"
                : format(dateObj, "EEEE, MMM d");

    return (
        <div className="bg-white p-4 rounded shadow">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{title}</h2>
                <div className="space-x-2">
                    <button
                        onClick={() => setDayOffset((o) => o - 1)}
                        className="px-2 py-1 border rounded"
                    >
                        ◀
                    </button>
                    <button
                        onClick={() => setDayOffset((o) => o + 1)}
                        className="px-2 py-1 border rounded"
                    >
                        ▶
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="ml-4 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        + Manual Booking
                    </button>
                </div>
            </div>

            {Object.entries(buckets).every(([, arr]) => arr.length === 0) ? (
                <p className="text-gray-500">No bookings for this day.</p>
            ) : (
                Object.entries(buckets).map(([label, rows]) =>
                    rows.length === 0 ? null : (
                        <div key={label} className="mb-6">
                            <h3 className="font-semibold mb-2">{label}</h3>
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left">Time</th>
                                    <th className="px-3 py-2 text-left">Name</th>
                                    <th className="px-3 py-2 text-left">Guests</th>
                                    <th className="px-3 py-2 text-left">Phone</th>
                                </tr>
                                </thead>
                                <tbody>
                                {rows
                                    .sort((a, b) =>
                                        a.reserved_time.localeCompare(b.reserved_time)
                                    )
                                    .map((bk) => (
                                        <tr key={bk.id} className="odd:bg-gray-50">
                                            <td className="px-3 py-2">
                                                {bk.reserved_time.slice(0, 5)}
                                            </td>
                                            <td className="px-3 py-2">{bk.full_name}</td>
                                            <td className="px-3 py-2">
                                                {bk.total_adults + bk.total_kids}
                                            </td>
                                            <td className="px-3 py-2">{bk.phone ?? "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )
            )}

            {showModal && (
                <AddBookingModal
                    dateObj={dateObj}
                    onClose={() => setShowModal(false)}
                    onSaved={() => {
                        setShowModal(false);
                        onDataRefresh();
                    }}
                />
            )}
        </div>
    );
}
