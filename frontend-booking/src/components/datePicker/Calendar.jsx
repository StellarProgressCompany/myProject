import React from "react";
import PropTypes from "prop-types";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    subMonths,
    addMonths,
    isSameMonth,
    isSameDay,
    isBefore,
    isAfter,
} from "date-fns";
import { getDayMealTypes } from "../../services/datePicker.js";

export default function Calendar({
                                     currentMonth,
                                     setCurrentMonth,
                                     today,
                                     maxDate,
                                     selectedDate,
                                     onDateSelect,
                                     availabilityMap,
                                     closedDays = [],
                                 }) {
    // build a set for O(1) lookups
    const closedSet = new Set(closedDays);

    const renderDayHeaders = () => {
        return (
            <div className="grid grid-cols-7 text-center font-bold mb-1">
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                    <div key={d}>{d}</div>
                ))}
            </div>
        );
    };

    const monthStart = startOfMonth(currentMonth);
    const monthEnd   = endOfMonth(currentMonth);
    const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd    = endOfWeek(monthEnd,   { weekStartsOn: 1 });

    const getStatus = (day) => {
        const ds = format(day, "yyyy-MM-dd");

        if (isBefore(day, today)) {
            return { status: "past", msg: "Date has passed" };
        }
        if (isAfter(day, maxDate)) {
            return { status: "no-data", msg: "No tables available" };
        }
        if (closedSet.has(ds)) {
            return { status: "closed", msg: "Closed" };
        }

        const mealTypes = getDayMealTypes(day.getDay());
        if (mealTypes.length === 0) {
            return { status: "closed", msg: "Closed" };
        }

        // if availabilityMap is missing this day, consider it loading
        const lunchKey = `${ds}_lunch`;
        const lunchData = availabilityMap[lunchKey];
        if (lunchData === undefined) {
            return { status: "loading", msg: "Loading..." };
        }
        // if lunch is closed or full, check dinner if offered
        if (lunchData === null) {
            if (mealTypes.includes("dinner")) {
                const dinnerData = availabilityMap[`${ds}_dinner`];
                if (dinnerData === undefined) {
                    return { status: "loading", msg: "Loading..." };
                }
                const hasSpace = Object.values(dinnerData.dinner_round.availability || {}).reduce(
                    (sum, v) => sum + v,
                    0
                ) > 0;
                if (hasSpace) return { status: "available", msg: "" };
            }
            return { status: "closed", msg: "Closed" };
        }
        // if lunch has capacity
        const availCount = Object.values(lunchData.first_round.availability || {}).reduce(
            (sum, v) => sum + v, 0
        ) + Object.values(lunchData.second_round.availability || {}).reduce(
            (sum, v) => sum + v, 0
        );
        if (availCount <= 0) {
            // same dinner fallback
            if (mealTypes.includes("dinner")) {
                const dinnerData = availabilityMap[`${ds}_dinner`];
                if (dinnerData === undefined) {
                    return { status: "loading", msg: "Loading..." };
                }
                const hasSpace = Object.values(dinnerData.dinner_round.availability || {}).reduce(
                    (sum, v) => sum + v,
                    0
                ) > 0;
                if (hasSpace) return { status: "available", msg: "" };
            }
            return { status: "full", msg: "Full" };
        }
        return { status: "available", msg: "" };
    };

    const rows = [];
    let dayPtr = gridStart;
    while (dayPtr <= gridEnd) {
        const week = [];
        for (let i = 0; i < 7; i++) {
            const d = dayPtr;
            const { status, msg } = getStatus(d);
            const inMonth  = isSameMonth(d, monthStart);
            const selected = selectedDate && isSameDay(d, selectedDate);

            let bg  = "bg-white";
            let txt = inMonth ? "text-gray-800" : "text-gray-400";
            if (status === "closed")   { bg = "bg-red-200";   txt = "text-red-800"; }
            else if (status === "past")   { bg = "bg-gray-300";  txt = "text-gray-500 line-through"; }
            else if (status === "no-data") { bg = "bg-yellow-100"; txt = "text-yellow-800"; }
            else if (status === "full")   { bg = "bg-red-300";   txt = "text-red-900"; }
            if (selected)                { bg = "bg-blue-600";   txt = "text-white"; }

            week.push(
                <button
                    key={d.toISOString()}
                    onClick={() => !["past","closed","full","no-data"].includes(status) && onDateSelect(d)}
                    disabled={["past","closed","full","no-data"].includes(status)}
                    className={`${bg} ${txt} relative p-2 h-24 border border-gray-200 flex flex-col items-center justify-center hover:bg-blue-50 transition`}
                    style={{ minWidth: 50 }}
                    title={msg || format(d, "EEEE, MMMM d, yyyy")}
                >
                    <span className="text-sm font-semibold">{format(d, "d")}</span>
                    {status === "available" && null}
                </button>
            );
            dayPtr = addDays(dayPtr, 1);
        }
        rows.push(<div key={dayPtr.toISOString()} className="grid grid-cols-7">{week}</div>);
    }

    return (
        <div className="bg-white p-4 rounded shadow">
            <div className="flex items-center justify-between mb-2">
                <button onClick={() => setCurrentMonth((m) => subMonths(m, 1))} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">
                    Prev
                </button>
                <h3 className="font-semibold">{format(currentMonth, "MMMM yyyy")}</h3>
                <button onClick={() => setCurrentMonth((m) => addMonths(m, 1))} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">
                    Next
                </button>
            </div>

            {renderDayHeaders()}
            {rows}
        </div>
    );
}

Calendar.propTypes = {
    currentMonth:    PropTypes.instanceOf(Date).isRequired,
    setCurrentMonth: PropTypes.func.isRequired,
    today:           PropTypes.instanceOf(Date).isRequired,
    maxDate:         PropTypes.instanceOf(Date).isRequired,
    selectedDate:    PropTypes.instanceOf(Date),
    onDateSelect:    PropTypes.func.isRequired,
    availabilityMap: PropTypes.object.isRequired,
    closedDays:      PropTypes.arrayOf(PropTypes.string),
};
