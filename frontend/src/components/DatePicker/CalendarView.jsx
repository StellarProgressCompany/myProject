// src/components/DatePicker/CalendarView.jsx
import React from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    isSameDay,
    isBefore,
    isAfter,
    subMonths,
    addMonths,
} from "date-fns";
import { sumAvailability, getDayMealTypes } from "./datePickerUtils";

export default function CalendarView({
                                         currentMonth,
                                         setCurrentMonth,
                                         today,
                                         maxDate,
                                         selectedDate,
                                         onDateSelect,
                                         availabilityMap,
                                     }) {
    // Render day-of-week headers
    const renderDayOfWeekHeaders = () => {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        return (
            <div className="grid grid-cols-7 text-center font-bold mb-1">
                {days.map((dayName) => (
                    <div key={dayName}>{dayName}</div>
                ))}
            </div>
        );
    };

    // Determine grid start and end dates
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = gridStart;

    const getDailyStatus = (date) => {
        if (isBefore(date, today)) {
            return { status: "past", message: "Date has passed" };
        }
        if (isAfter(date, maxDate)) {
            return { status: "no-data", message: "No tables available. Contact restaurant" };
        }
        const dayOfWeek = date.getDay();
        const mealTypesForDay = getDayMealTypes(dayOfWeek);
        if (mealTypesForDay.length === 0) {
            return { status: "closed", message: "Closed" };
        }
        const dateStr = format(date, "yyyy-MM-dd");
        const lunchKey = dateStr + "_lunch";
        const lunchData = availabilityMap[lunchKey];
        if (lunchData === undefined) {
            return { status: "loading", message: "Loading..." };
        }
        if (lunchData === null) {
            if (mealTypesForDay.includes("dinner")) {
                const dinnerKey = dateStr + "_dinner";
                const dinnerData = availabilityMap[dinnerKey];
                if (dinnerData === undefined) {
                    return { status: "loading", message: "Loading..." };
                }
                if (dinnerData && sumAvailability(dinnerData) > 0) {
                    return { status: "available", message: "" };
                }
            }
            return { status: "closed", message: "Closed" };
        }
        const lunchAvail = sumAvailability(lunchData);
        if (lunchAvail <= 0) {
            if (mealTypesForDay.includes("dinner")) {
                const dinnerKey = dateStr + "_dinner";
                const dinnerData = availabilityMap[dinnerKey];
                if (dinnerData === undefined) {
                    return { status: "loading", message: "Loading..." };
                }
                if (dinnerData && sumAvailability(dinnerData) > 0) {
                    return { status: "available", message: "" };
                }
            }
            return { status: "full", message: "Full" };
        }
        return { status: "available", message: "" };
    };

    while (day <= gridEnd) {
        for (let i = 0; i < 7; i++) {
            const cloneDay = day;
            const isSelected = isSameDay(cloneDay, selectedDate);
            const { status, message } = getDailyStatus(cloneDay);
            const disabled = ["past", "closed", "full", "no-data"].includes(status);

            let bgColor = "bg-gray-100";
            let textColor = "text-gray-800";

            if (status === "past") {
                bgColor = "bg-gray-300";
                textColor = "text-gray-500 line-through";
            } else if (status === "closed") {
                bgColor = "bg-red-200";
                textColor = "text-red-900";
            } else if (status === "full") {
                bgColor = "bg-red-300";
                textColor = "text-red-900";
            } else if (status === "no-data") {
                bgColor = "bg-yellow-200";
                textColor = "text-yellow-800";
            }

            if (isSelected) {
                bgColor = "bg-blue-600";
                textColor = "text-white";
            }

            days.push(
                <button
                    key={cloneDay.toISOString()}
                    onClick={() => !disabled && onDateSelect(cloneDay)}
                    disabled={disabled}
                    className={`w-10 h-10 relative flex flex-col items-center justify-center m-1 rounded 
                      ${bgColor} ${textColor} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
                      transition-colors hover:bg-blue-200 focus:outline-none`}
                    title={message || format(cloneDay, "EEEE, MMMM d, yyyy")}
                >
                    <span className="text-xs">{format(cloneDay, "d")}</span>
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
            {/* Navigation */}
            <div className="flex justify-between items-center mb-2">
                <button
                    onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
                    className="p-2 focus:outline-none"
                    aria-label="Previous Month"
                >
                    {"<"}
                </button>
                <div className="font-bold">{format(currentMonth, "MMMM yyyy")}</div>
                <button
                    onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                    className="p-2 focus:outline-none"
                    aria-label="Next Month"
                >
                    {">"}
                </button>
            </div>

            {/* Day-of-week headers */}
            {renderDayOfWeekHeaders()}

            {/* Calendar grid */}
            {rows}
        </div>
    );
}
