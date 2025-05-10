import React from "react";
import PropTypes from "prop-types";
import { format, addDays, isSameDay, isBefore, isAfter } from "date-fns";
import { getDayMealTypes } from "../../services/datePicker.js";

export default function Compact({
                                    today,
                                    maxDate,
                                    selectedDate,
                                    onDateSelect,
                                    availabilityMap,
                                    closedDays = [],
                                }) {
    const closedSet = new Set(closedDays);
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

    const getStatus = (d) => {
        const ds = format(d, "yyyy-MM-dd");
        if (isBefore(d, today)) return { status: "past", msg: "Date has passed" };
        if (isAfter(d, maxDate)) return { status: "no-data", msg: "No tables available" };
        if (closedSet.has(ds))  return { status: "closed", msg: "Closed" };

        const mealTypes = getDayMealTypes(d.getDay());
        if (mealTypes.length === 0) return { status: "closed", msg: "Closed" };

        const lunchKey = `${ds}_lunch`;
        const l = availabilityMap[lunchKey];
        if (l === undefined) return { status: "loading", msg: "Loading..." };
        if (l === null) {
            if (mealTypes.includes("dinner")) {
                const dd = availabilityMap[`${ds}_dinner`];
                if (dd === undefined) return { status: "loading", msg: "Loading..." };
                const hasSpace = Object.values(dd.dinner_round.availability || {}).reduce(
                    (sum, v) => sum + v,
                    0
                ) > 0;
                if (hasSpace) return { status: "available", msg: "" };
            }
            return { status: "closed", msg: "Closed" };
        }
        const availLunch = Object.values(l.first_round.availability || {}).reduce((sum, v) => sum + v, 0)
            + Object.values(l.second_round.availability || {}).reduce((sum, v) => sum + v, 0);
        if (availLunch <= 0) {
            if (mealTypes.includes("dinner")) {
                const dd = availabilityMap[`${ds}_dinner`];
                if (dd === undefined) return { status: "loading", msg: "Loading..." };
                const hasSpace = Object.values(dd.dinner_round.availability || {}).reduce(
                    (sum, v) => sum + v,
                    0
                ) > 0;
                if (hasSpace) return { status: "available", msg: "" };
            }
            return { status: "full", msg: "Full" };
        }
        return { status: "available", msg: "" };
    };

    return (
        <div className="flex space-x-2 overflow-x-auto p-2" role="list">
            {days.map((d) => {
                const sel = isSameDay(d, selectedDate);
                const { status, msg } = getStatus(d);
                const disabled = ["past", "closed", "full", "no-data"].includes(status);

                let bg = "bg-gray-100", txt = "text-gray-800";
                if (status === "past")      { bg = "bg-gray-300";  txt = "text-gray-500 line-through"; }
                else if (status === "closed"){ bg = "bg-red-200";   txt = "text-red-900"; }
                else if (status === "full")  { bg = "bg-red-300";   txt = "text-red-900"; }
                else if (status === "no-data"){ bg = "bg-yellow-200"; txt = "text-yellow-800"; }
                if (sel) { bg = "bg-blue-600"; txt = "text-white"; }

                return (
                    <button
                        key={d.toISOString()}
                        onClick={() => !disabled && onDateSelect(d)}
                        disabled={disabled}
                        className={`flex flex-col items-center w-16 py-2 rounded ${bg} ${txt} ${
                            disabled ? "cursor-not-allowed" : "cursor-pointer"
                        } transition hover:bg-blue-200`}
                        title={msg || format(d, "EEEE, MMMM d, yyyy")}
                    >
                        <span className="text-xs">{isSameDay(d, today) ? "Today" : format(d, "EEE")}</span>
                        <span className="text-xl font-bold">{format(d, "d")}</span>
                        <span className="text-xs">{format(d, "MMM")}</span>
                    </button>
                );
            })}
        </div>
    );
}

Compact.propTypes = {
    today:           PropTypes.instanceOf(Date).isRequired,
    maxDate:         PropTypes.instanceOf(Date).isRequired,
    selectedDate:    PropTypes.instanceOf(Date),
    onDateSelect:    PropTypes.func.isRequired,
    availabilityMap: PropTypes.object.isRequired,
    closedDays:      PropTypes.arrayOf(PropTypes.string),
};
