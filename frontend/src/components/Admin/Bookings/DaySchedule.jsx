import React, { useState } from "react";
import { format } from "date-fns";
import TableUsage from "./TableUsage";

const prettyRound = (key) => {
    if (key.includes("first")) return { lbl: "Lunch – 1st Round", bg: "bg-green-50" };
    if (key.includes("second")) return { lbl: "Lunch – 2nd Round", bg: "bg-orange-50" };
    return { lbl: "Dinner", bg: "bg-purple-50" };
};

/**
 * DaySchedule – shows 3 rounds & optional floor plan.
 *  • Always shows Lunch 1, Lunch 2, Dinner.
 *  • “Expand floor” toggles a single, consistent TableUsage.
 */
export default function DaySchedule({
                                        selectedDate,
                                        bookings,
                                        tableAvailability,
                                        onClose,
                                        enableZoom = false,
                                    }) {
    const [showFloor, setShowFloor] = useState(false);
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
                <p
                    className={
                        dayInfo === "closed" ? "text-red-600 font-semibold" : "text-gray-700"
                    }
                >
                    {dayInfo === "closed" ? "CLOSED" : "No availability data."}
                </p>
            </div>
        );
    }

    // Gather bookings per round
    const roundKeys = ["first_round", "second_round", "dinner_round"].filter((rk) =>
        rk in dayInfo
    );
    const roundBookings = {};
    roundKeys.forEach((rk) => {
        roundBookings[rk] = bookings
            .filter((b) => {
                const d = b.table_availability?.date;
                if (d !== dateStr) return false;
                if (rk === "first_round") return b.reserved_time < "15:00:00";
                if (rk === "second_round")
                    return b.reserved_time >= "15:00:00" && b.reserved_time < "20:00:00";
                return b.reserved_time >= "20:00:00";
            })
            .sort((a, z) => a.reserved_time.localeCompare(z.reserved_time));
    });

    // Compute total stock from dinner round (seed + bookings)
    const dinnerAvail = dayInfo.dinner_round?.availability || {};
    const dinnerBookedCount = {};
    roundBookings.dinner_round.forEach((b) => {
        const c = b.table_availability?.capacity || 0;
        dinnerBookedCount[c] = (dinnerBookedCount[c] || 0) + 1;
    });
    const fullStock = [2, 4, 6].reduce((acc, cap) => {
        acc[cap] = (dinnerAvail[cap] || 0) + (dinnerBookedCount[cap] || 0);
        return acc;
    }, {});

    return (
        <div className="mt-6 border rounded bg-white p-4 shadow">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">
                    Schedule for {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </h3>
                <div className="space-x-3">
                    {enableZoom && (
                        <button
                            onClick={() => setShowFloor((v) => !v)}
                            className="text-sm px-2 py-1 border rounded hover:bg-gray-100"
                        >
                            {showFloor ? "Hide floor" : "Expand floor"}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="text-sm text-red-500 underline hover:text-red-700"
                    >
                        Close
                    </button>
                </div>
            </div>

            {roundKeys.map((rk) => {
                const { lbl, bg } = prettyRound(rk);
                const rows = roundBookings[rk];

                return (
                    <div key={rk} className="mb-8">
                        <h4 className="text-md font-semibold mb-2">{lbl}</h4>

                        {rows.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200 text-sm mb-3">
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
                                        <td className="px-3 py-2 truncate max-w-[160px]">
                                            {bk.full_name}
                                        </td>
                                        <td className="px-3 py-2">
                                            {bk.total_adults + bk.total_kids}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-gray-500 mb-3">No bookings in this round.</p>
                        )}

                        {showFloor && (
                            <TableUsage
                                capacityTotals={fullStock}
                                bookings={rows}
                                expanded
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
