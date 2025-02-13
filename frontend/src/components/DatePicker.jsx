import React, { useState } from "react";
import {
    format,
    addDays,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addMonths,
    subMonths,
    isSameDay,
    isBefore,
} from "date-fns";

const DatePicker = ({ selectedDate, onDateSelect }) => {
    const [viewMode, setViewMode] = useState("compact"); // "compact" or "calendar"
    const today = new Date();

    // --- Helper Functions for Availability ---
    const isRestaurantClosed = (date) => date.getDay() === 1 || date.getDay() === 2;
    const isFullyBooked = (date) =>
        !isRestaurantClosed(date) && date.getDate() % 7 === 0;

    // --- Compact View: Next 7 Days ---
    const renderCompact = () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = addDays(today, i);
            days.push(day);
        }
        return (
            <div className="flex space-x-2 overflow-x-auto p-2" role="list">
                {days.map((day) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isClosed = isRestaurantClosed(day);
                    const isFull = isFullyBooked(day);
                    const dayLabel = isSameDay(day, today) ? "AVUI" : format(day, "EEE");

                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => onDateSelect(day)}
                            disabled={isClosed || isFull}
                            title={isClosed ? "Restaurant Closed" : isFull ? "Fully Booked" : ""}
                            className={`relative flex flex-col items-center p-2 border rounded transition-colors hover:bg-blue-200 focus:outline-none ${
                                isClosed || isFull
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : isSelected
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-800"
                            }`}
                        >
                            <span className="text-sm">{dayLabel}</span>
                            <span className="font-bold">{format(day, "d")}</span>
                            <span className="text-xs">{format(day, "MMM")}</span>
                            {(isClosed || isFull) && (
                                <span className="absolute top-0 right-0 text-xs font-bold text-red-500">
                  {isClosed ? "Closed" : "Full"}
                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    };

    // --- Calendar (Full Month) View ---
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const renderCalendar = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const rows = [];
        let days = [];
        let day = startDate;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = day;
                const isPast = isBefore(cloneDay, today);
                const closed = isRestaurantClosed(cloneDay);
                const full = isFullyBooked(cloneDay);
                const disabled = isPast || closed || full;
                const isSelected = selectedDate && isSameDay(cloneDay, selectedDate);

                days.push(
                    <button
                        key={cloneDay.toISOString()}
                        onClick={() => !disabled && onDateSelect(cloneDay)}
                        disabled={disabled}
                        className={`w-10 h-10 flex flex-col items-center justify-center m-1 rounded transition-colors hover:bg-blue-200 focus:outline-none ${
                            disabled
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : isSelected
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-800"
                        }`}
                        title={
                            closed
                                ? "Restaurant Closed"
                                : full
                                    ? "Fully Booked"
                                    : format(cloneDay, "EEEE, MMMM d, yyyy")
                        }
                        aria-label={format(cloneDay, "EEEE, MMMM d, yyyy")}
                    >
                        <span className="text-xs">{format(cloneDay, "EEE")}</span>
                        <span className="text-sm font-bold">{format(cloneDay, "d")}</span>
                        {(closed || full) && (
                            <span className="absolute top-0 right-0 text-xs font-bold text-red-500">
                {closed ? "Closed" : "Full"}
              </span>
                        )}
                    </button>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div key={day.toISOString()} className="flex justify-center">
                    {days}
                </div>
            );
            days = [];
        }

        return (
            <div>
                <div className="flex justify-between items-center mb-2">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-2 focus:outline-none"
                        aria-label="Previous Month"
                    >
                        {"<"}
                    </button>
                    <div className="font-bold">{format(currentMonth, "MMMM yyyy")}</div>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-2 focus:outline-none"
                        aria-label="Next Month"
                    >
                        {">"}
                    </button>
                </div>
                {rows}
            </div>
        );
    };

    return (
        <div className="date-picker">
            <div className="flex justify-end mb-2">
                <button
                    onClick={() =>
                        setViewMode(viewMode === "compact" ? "calendar" : "compact")
                    }
                    className="text-sm underline focus:outline-none"
                >
                    {viewMode === "compact" ? "Calendar View" : "Compact View"}
                </button>
            </div>
            {viewMode === "compact" ? renderCompact() : renderCalendar()}
        </div>
    );
};

export default DatePicker;
