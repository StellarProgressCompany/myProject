// src/components/DatePicker/BookingsCompactView.jsx
import React from "react";
import { format, addDays, isSameDay, isBefore, isAfter } from "date-fns";
import { getDayMealTypes, sumAvailability } from "./datePickerUtils";

export default function CompactView({
                                        today,
                                        maxDate,
                                        selectedDate,
                                        onDateSelect,
                                        availabilityMap,
                                    }) {
    // List next 7 days
    const days = [];
    for (let i = 0; i < 7; i++) {
        days.push(addDays(today, i));
    }

    // Evaluate the status of each day
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

    return (
        <div className="flex space-x-2 overflow-x-auto p-2" role="list">
            {days.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const { status, message } = getDailyStatus(day);
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

                return (
                    <button
                        key={day.toISOString()}
                        onClick={() => !disabled && onDateSelect(day)}
                        disabled={disabled}
                        className={`relative flex flex-col items-center p-2 border rounded 
                      ${bgColor} ${textColor} 
                      ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
                      transition-colors hover:bg-blue-200 focus:outline-none`}
                        title={message}
                    >
            <span className="text-sm">
              {isSameDay(day, today) ? "Today" : format(day, "EEE")}
            </span>
                        <span className="font-bold">{format(day, "d")}</span>
                        <span className="text-xs">{format(day, "MMM")}</span>
                    </button>
                );
            })}
        </div>
    );
}
