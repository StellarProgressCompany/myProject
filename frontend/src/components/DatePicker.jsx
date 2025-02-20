import React, { useState, useEffect } from "react";
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
import { fetchAvailableTimeSlots } from "../services/bookingService"; // Adjust path as needed

/**
 * Helper to sum up availability from the API's response.
 *
 * Example of `dayAvailability` from your API:
 * {
 *   "first_round": {
 *     "time": "12:30",
 *     "availability": { "2": 4, "4": 3, "6": 3 },
 *     "note": "Must leave by 15:00"
 *   },
 *   "second_round": {
 *     "time": "15:00",
 *     "availability": { "2": 4, "4": 3, "6": 3 },
 *     "note": "Must leave by 17:30"
 *   }
 * }
 */
function sumAvailability(dayAvailability) {
    if (!dayAvailability) return 0;

    let sum = 0;
    // For lunch, you might have "first_round" and "second_round"
    if (dayAvailability.first_round?.availability) {
        const obj = dayAvailability.first_round.availability;
        Object.values(obj).forEach((val) => {
            sum += val;
        });
    }
    if (dayAvailability.second_round?.availability) {
        const obj = dayAvailability.second_round.availability;
        Object.values(obj).forEach((val) => {
            sum += val;
        });
    }
    // For dinner, you might have "dinner_round"
    if (dayAvailability.dinner_round?.availability) {
        const obj = dayAvailability.dinner_round.availability;
        Object.values(obj).forEach((val) => {
            sum += val;
        });
    }
    return sum;
}

const DatePicker = ({ selectedDate, onDateSelect }) => {
    const [viewMode, setViewMode] = useState("compact"); // "compact" or "calendar"
    const today = new Date();

    // This will store availability data keyed by "YYYY-MM-dd + mealType"
    // e.g. availabilityMap["2025-02-20_lunch"] = { ...first_round, second_round... }
    const [availabilityMap, setAvailabilityMap] = useState({});

    // Determine if the restaurant is closed: Monday (1) or Tuesday (2)
    const isRestaurantClosed = (date) => {
        const dayOfWeek = date.getDay();
        return dayOfWeek === 1 || dayOfWeek === 2;
    };

    // Basic meal type assumptions:
    //   - In your real code, you might have the user pick "lunch" or "dinner"
    //     but for the date picker, you might allow both?
    //   - Or you might store a selectedMealType in context or pass it in as props.
    // For the sake of example, let's assume we only check "lunch" availability
    // for the date picker. Modify to suit your real logic:
    const mealType = "lunch"; // Hard-coded for demonstration

    // Fetch data for the next 7 days (compact)
    useEffect(() => {
        if (viewMode !== "compact") return;

        const loadNext7Days = async () => {
            const newMap = { ...availabilityMap };
            for (let i = 0; i < 7; i++) {
                const date = addDays(today, i);
                const dateKey = format(date, "yyyy-MM-dd") + "_" + mealType;

                // Skip if we already fetched
                if (newMap[dateKey] !== undefined) continue;
                if (isRestaurantClosed(date)) {
                    // Mark as closed in the map
                    newMap[dateKey] = null;
                    continue;
                }

                try {
                    const response = await fetchAvailableTimeSlots({
                        date: format(date, "yyyy-MM-dd"),
                        mealType,
                    });
                    newMap[dateKey] = response; // store the data
                } catch (err) {
                    console.error("Failed to fetch day availability", err);
                    // Mark as null or an error state if you like
                    newMap[dateKey] = null;
                }
            }
            setAvailabilityMap(newMap);
        };
        loadNext7Days();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode]);

    // Fetch data for the entire month (calendar)
    const [currentMonth, setCurrentMonth] = useState(today);
    useEffect(() => {
        if (viewMode !== "calendar") return;

        const loadMonth = async () => {
            const newMap = { ...availabilityMap };

            // figure out the start and end of the month
            const monthStart = startOfMonth(currentMonth);
            const monthEnd = endOfMonth(monthStart);

            // walk day by day in that month
            let day = startOfWeek(monthStart, { weekStartsOn: 1 });
            const finalDay = endOfWeek(monthEnd, { weekStartsOn: 1 });

            while (day <= finalDay) {
                const dateKey = format(day, "yyyy-MM-dd") + "_" + mealType;

                // Skip if we already fetched
                if (!newMap.hasOwnProperty(dateKey)) {
                    if (isRestaurantClosed(day)) {
                        newMap[dateKey] = null; // indicate closed
                    } else if (!isBefore(day, today)) {
                        // Only fetch for today or future dates
                        try {
                            const response = await fetchAvailableTimeSlots({
                                date: format(day, "yyyy-MM-dd"),
                                mealType,
                            });
                            newMap[dateKey] = response;
                        } catch (err) {
                            console.error("Failed to fetch day availability", err);
                            newMap[dateKey] = null;
                        }
                    } else {
                        // Past date => mark as closed or null
                        newMap[dateKey] = null;
                    }
                }

                day = addDays(day, 1);
            }

            setAvailabilityMap(newMap);
        };

        loadMonth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode, currentMonth]);

    // Helper to get daily status from availabilityMap
    const getDailyStatus = (date) => {
        // If Monday or Tuesday => closed
        if (isRestaurantClosed(date)) {
            return { status: "closed", message: "Closed" };
        }

        // If it's in the past, you can decide to show "past" or just do "closed"
        if (isBefore(date, today)) {
            return { status: "closed", message: "Closed" };
        }

        // Key in the map
        const dateKey = format(date, "yyyy-MM-dd") + "_" + mealType;
        const dayData = availabilityMap[dateKey];
        // If not loaded or explicitly `undefined`, we might say “loading”
        if (dayData === undefined) {
            return { status: "loading", message: "Loading…" };
        }
        // If dayData == null => we treat it as closed or no data
        if (dayData === null) {
            // Could also interpret null as an error or closed
            return { status: "closed", message: "Closed" };
        }

        // We have actual availability data. Sum it:
        const sum = sumAvailability(dayData);
        // 0 => Full
        if (sum <= 0) return { status: "full", message: "Full" };
        // < 20% => few
        const totalTables = 20; // or fetch from your API, or define as you prefer
        if (sum < 0.2 * totalTables) {
            return { status: "nearly", message: "Few Tables Left" };
        }

        // Otherwise, all good
        return { status: "available", message: "" };
    };

    // Renders the next 7 days (compact mode)
    const renderCompact = () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(addDays(today, i));
        }

        return (
            <div className="flex space-x-2 overflow-x-auto p-2" role="list">
                {days.map((day) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const { status, message } = getDailyStatus(day);

                    // If “closed” or “full,” we disable the button
                    const disabled = status === "closed" || status === "full" || status === "loading";

                    // If it's “today,” label might say “AVUI,” else the 3-letter day name
                    const dayLabel = isSameDay(day, today) ? "AVUI" : format(day, "EEE");

                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => !disabled && onDateSelect(day)}
                            disabled={disabled}
                            title={message}
                            className={`relative flex flex-col items-center p-2 border rounded transition-colors hover:bg-blue-200 focus:outline-none 
                ${
                                disabled
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : isSelected
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-800"
                            }`}
                        >
                            <span className="text-sm">{dayLabel}</span>
                            <span className="font-bold">{format(day, "d")}</span>
                            <span className="text-xs">{format(day, "MMM")}</span>
                            {message && status !== "available" && (
                                <span className="absolute top-0 right-0 text-xs font-bold text-red-500">
                  {message}
                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    };

    // Renders the entire month (calendar mode)
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
                const isSelected = selectedDate && isSameDay(cloneDay, selectedDate);
                const { status, message } = getDailyStatus(cloneDay);

                const disabled =
                    status === "closed" || status === "full" || status === "loading";

                days.push(
                    <button
                        key={cloneDay.toISOString()}
                        onClick={() => !disabled && onDateSelect(cloneDay)}
                        disabled={disabled}
                        className={`w-10 h-10 relative flex flex-col items-center justify-center m-1 rounded transition-colors hover:bg-blue-200 focus:outline-none 
              ${
                            disabled
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : isSelected
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-800"
                        }`}
                        title={message || format(cloneDay, "EEEE, MMMM d, yyyy")}
                        aria-label={format(cloneDay, "EEEE, MMMM d, yyyy")}
                    >
                        <span className="text-xs">{format(cloneDay, "EEE")}</span>
                        <span className="text-sm font-bold">{format(cloneDay, "d")}</span>
                        {message && status !== "available" && (
                            <span className="absolute top-0 right-0 text-xs font-bold text-red-500">
                {message}
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
