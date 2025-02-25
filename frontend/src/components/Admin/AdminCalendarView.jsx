import React, { useState } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    isSameMonth,
    isSameDay,
} from "date-fns";

export default function AdminCalendarView({ selectedDate, onSelectDay, bookings }) {
    // We'll keep an internal “monthToShow” in local state
    const [monthToShow, setMonthToShow] = useState(new Date());

    // Build day-of-week headers (Mon-Sun)
    const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const monthStart = startOfMonth(monthToShow);
    const monthEnd = endOfMonth(monthToShow);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    // Helper: get # bookings, # clients for a date
    function getDayStats(date) {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayBookings = bookings.filter((b) => b.date === dateStr);
        const totalClients = dayBookings.reduce((acc, b) => {
            const cap = b?.table_availability?.capacity || 0;
            return acc + cap;
        }, 0);
        return {
            bookingsCount: dayBookings.length,
            totalClients,
        };
    }

    // Build the day grid
    const rows = [];
    let day = gridStart;
    while (day <= gridEnd) {
        const daysInRow = [];
        for (let i = 0; i < 7; i++) {
            const cloneDay = day;
            const { bookingsCount, totalClients } = getDayStats(cloneDay);
            const isCurrentMonth = isSameMonth(cloneDay, monthToShow);
            const isSelected = selectedDate && isSameDay(cloneDay, selectedDate);

            // Styles
            let textColor = isCurrentMonth ? "text-gray-900" : "text-gray-400";
            let bgColor = "bg-white";
            if (isSelected) {
                bgColor = "bg-blue-600";
                textColor = "text-white";
            }

            daysInRow.push(
                <button
                    key={cloneDay.toString()}
                    onClick={() => onSelectDay(cloneDay)}
                    className={`p-2 h-20 border border-gray-100 flex flex-col items-center ${bgColor} ${textColor}`}
                >
                    <span className="text-sm leading-none">{format(cloneDay, "d")}</span>
                    <span className="text-xs">{bookingsCount} Bkg</span>
                    <span className="text-xs">{totalClients} Cl</span>
                </button>
            );
            day = addDays(day, 1);
        }
        rows.push(
            <div key={day.toString()} className="grid grid-cols-7">
                {daysInRow}
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded shadow">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={() =>
                        setMonthToShow((prev) => {
                            const newDate = new Date(prev);
                            newDate.setMonth(prev.getMonth() - 1);
                            return newDate;
                        })
                    }
                    className="px-2 py-1 bg-gray-200 rounded"
                >
                    Prev
                </button>
                <h3 className="font-semibold">{format(monthToShow, "MMMM yyyy")}</h3>
                <button
                    onClick={() =>
                        setMonthToShow((prev) => {
                            const newDate = new Date(prev);
                            newDate.setMonth(prev.getMonth() + 1);
                            return newDate;
                        })
                    }
                    className="px-2 py-1 bg-gray-200 rounded"
                >
                    Next
                </button>
            </div>
            {/* Day-of-week labels */}
            <div className="grid grid-cols-7 text-center font-bold text-xs mb-1">
                {weekdayLabels.map((lbl) => (
                    <div key={lbl}>{lbl}</div>
                ))}
            </div>
            {/* The days grid */}
            {rows}
        </div>
    );
}
