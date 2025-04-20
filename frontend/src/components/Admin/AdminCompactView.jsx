import React from "react";
import {
    format,
    addDays,
    subDays,
    isSameDay,
    startOfDay,
    differenceInCalendarDays,
} from "date-fns";

/**
 * Props
 *  • mode        – "future" | "past"
 *  • rangeDays   – number (7 / 30 / 90)
 *  • selectedDate / onSelectDay / bookings  – same as before
 */
export default function AdminCompactView({
                                             mode = "future",
                                             rangeDays = 7,
                                             selectedDate,
                                             onSelectDay,
                                             bookings,
                                         }) {
    const today = startOfDay(new Date());

    /* build list of day objects within the chosen range */
    const days = [];
    if (mode === "future") {
        // today … today+rangeDays‑1
        for (let i = 0; i < rangeDays; i++) {
            days.push(addDays(today, i));
        }
    } else {
        // mode === "past" → today‑rangeDays … yesterday
        const start = subDays(today, rangeDays);
        for (let i = 0; i < rangeDays; i++) {
            days.push(addDays(start, i));
        }
    }

    /* stat helpers */
    function getDayStats(dateObj) {
        const dateStr = format(dateObj, "yyyy-MM-dd");
        const dayBookings = bookings.filter((b) => {
            const bookingDate = b.table_availability?.date || b.date;
            return bookingDate === dateStr;
        });
        const totalClients = dayBookings.reduce((acc, b) => {
            return acc + (b.total_adults || 0) + (b.total_kids || 0);
        }, 0);
        return {
            bookingsCount: dayBookings.length,
            totalClients,
        };
    }

    return (
        <div className="flex space-x-2 overflow-x-auto p-2 bg-white rounded shadow">
            {days.map((day) => {
                const { bookingsCount, totalClients } = getDayStats(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                let bg = "bg-gray-100";
                let txt = "text-gray-800";
                if (isSelected) {
                    bg = "bg-blue-600";
                    txt = "text-white";
                }

                return (
                    <button
                        key={day.toISOString()}
                        onClick={() => onSelectDay(day)}
                        className={`flex flex-col items-center w-16 py-2 rounded ${bg} ${txt}`}
                    >
                        <span className="text-xs font-semibold">{format(day, "E")}</span>
                        <span className="text-xl font-bold">{format(day, "d")}</span>
                        <span className="text-xs">{format(day, "MMM")}</span>
                        <span className="mt-1 text-xs">{bookingsCount} Bkg</span>
                        <span className="text-xs">{totalClients} Cl</span>
                    </button>
                );
            })}
        </div>
    );
}
