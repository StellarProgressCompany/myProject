// src/components/Admin/AdminDaySchedule.jsx
import React from "react";
import { format, parse, addMinutes, isAfter, isEqual } from "date-fns";

function buildTimeSlots(roundInfo, selectedDate) {
    const timeRegex = /(\d{1,2}:\d{2})/; // attempts to find HH:mm in roundInfo.note
    const startTime = parse(roundInfo.time, "HH:mm", selectedDate);

    let endMatches = roundInfo.note.match(timeRegex);
    let endTime = null;
    if (endMatches && endMatches[1]) {
        endTime = parse(endMatches[1], "HH:mm", selectedDate);
    }
    if (!endTime) {
        // fallback +3h
        endTime = addMinutes(startTime, 180);
    }

    const slots = [];
    let current = startTime;
    while (isAfter(endTime, current) || isEqual(endTime, current)) {
        slots.push(current);
        current = addMinutes(current, 15);
    }
    return slots;
}

export default function AdminDaySchedule({
                                             selectedDate,
                                             bookings,
                                             tableAvailability,
                                             onClose,
                                         }) {
    if (!selectedDate) return null;

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const dayInfo = tableAvailability[dateStr];

    if (!dayInfo) {
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
                <p className="text-gray-700">No table availability data for this date.</p>
            </div>
        );
    }

    if (dayInfo === "closed") {
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
                <p className="text-red-600 font-semibold">CLOSED</p>
            </div>
        );
    }

    const mealRounds = Object.keys(dayInfo).map((roundKey) => ({
        roundKey,
        roundData: dayInfo[roundKey],
    }));

    function getBookingsForTimeSlot(slot) {
        const slotHHmm = format(slot, "HH:mm");
        return bookings.filter((b) => {
            const bDate = b.table_availability?.date;
            if (bDate !== dateStr) return false;
            return b.reserved_time.slice(0, 5) === slotHHmm;
        });
    }

    // color-coded row backgrounds for each round
    function getRoundColor(roundKey) {
        if (roundKey.toLowerCase().includes("first")) return "bg-green-50";
        if (roundKey.toLowerCase().includes("second")) return "bg-orange-50";
        if (roundKey.toLowerCase().includes("dinner")) return "bg-purple-50";
        return "bg-gray-50";
    }

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

            {mealRounds.map(({ roundKey, roundData }) => {
                const slots = buildTimeSlots(roundData, selectedDate);
                const rowBgColor = getRoundColor(roundKey);

                return (
                    <div key={roundKey} className="mb-6">
                        <h4 className="text-md font-semibold capitalize mb-2">
                            {roundKey.replace("_", " ")} – {roundData.time} to {roundData.note}
                        </h4>
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead>
                            <tr className="bg-gray-50">
                                <th className="px-3 py-2 text-left font-semibold">Time</th>
                                <th className="px-3 py-2 text-left font-semibold">Bookings</th>
                                <th className="px-3 py-2 text-left font-semibold">Total Clients</th>
                            </tr>
                            </thead>
                            <tbody>
                            {slots.map((slot) => {
                                const slotBookings = getBookingsForTimeSlot(slot);
                                const totalClients = slotBookings.reduce((acc, b) => {
                                    const cap = b?.table_availability?.capacity || 0;
                                    return acc + cap;
                                }, 0);
                                return (
                                    <tr
                                        key={format(slot, "HH:mm")}
                                        className={`${rowBgColor} hover:bg-yellow-50 transition`}
                                    >
                                        <td className="px-3 py-2">
                                            {format(slot, "HH:mm")}
                                        </td>
                                        <td className="px-3 py-2">
                                            {slotBookings.length}
                                            {slotBookings.length > 0 && (
                                                <ul className="list-disc list-inside text-xs text-gray-700 mt-1">
                                                    {slotBookings.map((bk) => (
                                                        <li key={bk.id}>
                                                            {bk.full_name} ({bk.total_adults} adults,
                                                            {bk.total_kids} kids)
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">{totalClients}</td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                );
            })}
        </div>
    );
}
