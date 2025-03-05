// src/components/Admin/Bookings/BookingsCompactView.jsx
import React from "react";
import { format, addDays, isSameDay } from "date-fns";

export default function BookingsCompactView({ selectedDate, onSelectDay, bookings }) {
    const today = new Date();
    const days = [];
    // Display next 7 days
    for (let i = 0; i < 7; i++) {
        days.push(addDays(today, i));
    }

    function getDayStats(day) {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayBookings = bookings.filter((b) => {
            const bookingDate = b.table_availability?.date || b.date;
            return bookingDate === dayStr;
        });
        const totalClients = dayBookings.reduce((acc, b) => {
            const cap = b.table_availability?.capacity || 0;
            return acc + cap;
        }, 0);
        return {
            bookingsCount: dayBookings.length,
            totalClients,
        };
    }

    return (
        <div className="flex space-x-2 overflow-x-auto p-2 bg-white rounded shadow">
            {days.map((day) => {
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const { bookingsCount, totalClients } = getDayStats(day);
                let bgColor = "bg-gray-100";
                let textColor = "text-gray-800";
                if (isSelected) {
                    bgColor = "bg-blue-600";
                    textColor = "text-white";
                }
                return (
                    <button
                        key={day.toISOString()}
                        onClick={() => onSelectDay(day)}
                        className={`flex flex-col items-center w-16 py-2 rounded ${bgColor} ${textColor}`}
                    >
                        <span className="text-xs font-semibold">{format(day, "E")}</span>
                        <span className="text-xl font-bold leading-none">{format(day, "d")}</span>
                        <span className="text-xs">{format(day, "MMM")}</span>
                        <span className="mt-1 text-xs">{bookingsCount} Bkg</span>
                        <span className="text-xs">{totalClients} Cl</span>
                    </button>
                );
            })}
        </div>
    );
}
