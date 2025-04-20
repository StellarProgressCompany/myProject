import React from "react";
import { format } from "date-fns";

/* util – map round key to nicer label & colour */
const prettyRound = (key) => {
    if (key.includes("first")) return { lbl: "Lunch – 1st Round", bg: "bg-green-50" };
    if (key.includes("second")) return { lbl: "Lunch – 2nd Round", bg: "bg-orange-50" };
    return { lbl: "Dinner", bg: "bg-purple-50" };
};

export default function DaySchedule({
                                        selectedDate,
                                        bookings,
                                        tableAvailability,
                                        onClose,
                                    }) {
    if (!selectedDate) return null;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const dayInfo = tableAvailability[dateStr];

    if (!dayInfo || dayInfo === "closed") {
        return (
            <div className="mt-6 border rounded bg-white p-4 shadow">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">
                        Schedule for {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </h3>
                    <button onClick={onClose} className="text-sm text-red-500 underline">
                        Close
                    </button>
                </div>
                <p className="text-red-600 font-semibold">
                    {dayInfo === "closed" ? "CLOSED" : "No availability data."}
                </p>
            </div>
        );
    }

    /* build map of bookings per round */
    const roundKeys = Object.keys(dayInfo);
    const roundBookings = {};
    roundKeys.forEach((rk) => {
        const { time } = dayInfo[rk];
        const startHHMM = time.slice(0, 5);
        // quick test: first round < 15:00, second >= 15, dinner >= 20
        roundBookings[rk] = bookings
            .filter((b) => {
                const d = b.table_availability?.date;
                if (d !== dateStr) return false;
                if (rk.includes("first")) return b.reserved_time < "15:00:00";
                if (rk.includes("second"))
                    return b.reserved_time >= "15:00:00" && b.reserved_time < "20:00:00";
                return b.reserved_time >= "20:00:00"; // dinner
            })
            .sort((a, b) => a.reserved_time.localeCompare(b.reserved_time));
    });

    return (
        <div className="mt-6 border rounded bg-white p-4 shadow">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">
                    Schedule for {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </h3>
                <button
                    onClick={onClose}
                    className="text-sm text-red-500 underline hover:text-red-700"
                >
                    Close
                </button>
            </div>

            {roundKeys.map((rk) => {
                const { lbl, bg } = prettyRound(rk);
                const rows = roundBookings[rk];
                if (rows.length === 0) return null;
                return (
                    <div key={rk} className="mb-6">
                        <h4 className="text-md font-semibold mb-2">{lbl}</h4>
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead>
                            <tr className="bg-gray-50">
                                <th className="px-3 py-2 text-left font-semibold">Time</th>
                                <th className="px-3 py-2 text-left font-semibold">Name</th>
                                <th className="px-3 py-2 text-left font-semibold">Total Clients</th>
                            </tr>
                            </thead>
                            <tbody>
                            {rows.map((bk) => (
                                <tr
                                    key={bk.id}
                                    className={`${bg} hover:bg-yellow-50 transition`}
                                >
                                    <td className="px-3 py-2">{bk.reserved_time.slice(0, 5)}</td>
                                    <td className="px-3 py-2">{bk.full_name}</td>
                                    <td className="px-3 py-2">
                                        {bk.total_adults + bk.total_kids}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                );
            })}
        </div>
    );
}
