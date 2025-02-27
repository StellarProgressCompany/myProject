// src/components/Admin/Bookings/BookingsCalendarView.jsx
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

export default function BookingsCalendarView({ selectedDate, onSelectDay, bookings }) {
    const [monthToShow, setMonthToShow] = useState(new Date());
    const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const monthStart = startOfMonth(monthToShow);
    const monthEnd = endOfMonth(monthToShow);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    function getDayStats(date) {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayBookings = bookings.filter((b) => {
            const bookingDate = b.table_availability?.date || b.date;
            return bookingDate === dateStr;
        });
        const totalClients = dayBookings.reduce((acc, b) => {
            const cap = b?.table_availability?.capacity || 0;
            return acc + cap;
        }, 0);
        return {
            bookingsCount: dayBookings.length,
            totalClients,
        };
    }

    const rows = [];
    let day = gridStart;
    while (day <= gridEnd) {
        const daysInRow = [];
        for (let i = 0; i < 7; i++) {
            const cloneDay = day;
            const { bookingsCount, totalClients } = getDayStats(cloneDay);
            const isCurrentMonth = isSameMonth(cloneDay, monthToShow);
            const isSelected = selectedDate && isSameDay(cloneDay, selectedDate);
            let textColor = isCurrentMonth ? "text-gray-800" : "text-gray-400";
            let bgColor = "bg-white";
            if (isSelected) {
                bgColor = "bg-blue-600";
                textColor = "text-white";
            }
            daysInRow.push(
                <button
                    key={cloneDay.toString()}
                    onClick={() => onSelectDay(cloneDay)}
                    className={`relative p-2 h-24 border border-gray-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition`}
                    style={{ minWidth: 50 }}
                >
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-semibold">{format(cloneDay, "d")}</span>
                        {bookingsCount > 0 && (
                            <span className="text-xs mt-1 inline-block bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                {bookingsCount} Bkg
              </span>
                        )}
                        {totalClients > 0 && (
                            <span className="text-xs mt-1 inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {totalClients} Cl
              </span>
                        )}
                    </div>
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
            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={() =>
                        setMonthToShow((prev) => {
                            const newDate = new Date(prev);
                            newDate.setMonth(prev.getMonth() - 1);
                            return newDate;
                        })
                    }
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
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
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                    Next
                </button>
            </div>
            <div className="grid grid-cols-7 text-center font-bold text-xs mb-1">
                {weekdayLabels.map((lbl) => (
                    <div key={lbl}>{lbl}</div>
                ))}
            </div>
            {rows}
        </div>
    );
}
