import React from "react";
import PropTypes from "prop-types";
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
import { sumAvailability, getDayMealTypes } from "../../services/datePicker.js";

export default function Calendar({
                                     currentMonth,
                                     setCurrentMonth,
                                     today,
                                     maxDate,
                                     selectedDate,
                                     onDateSelect,
                                     availabilityMap,
                                 }) {
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
    const gridStart  = startOfWeek(monthStart, {weekStartsOn:1});
    const gridEnd    = endOfWeek(monthEnd,   {weekStartsOn:1});

    const getStatus = (day) => {
        if (isBefore(day, today)) return {status:"past", msg:"Date has passed"};
        if (isAfter(day, maxDate)) return {status:"no-data", msg:"No tables available"};
        const mealTypes = getDayMealTypes(day.getDay());
        if (mealTypes.length===0) return {status:"closed", msg:"Closed"};
        const ds = format(day,"yyyy-MM-dd");
        const lunchKey = `${ds}_lunch`;
        const lunchData = availabilityMap[lunchKey];
        if (lunchData===undefined) return {status:"loading", msg:"Loading..."};
        if (lunchData===null) {
            if (mealTypes.includes("dinner")) {
                const dinnerData = availabilityMap[`${ds}_dinner`];
                if (dinnerData===undefined) return {status:"loading", msg:"Loading..."};
                if (sumAvailability(dinnerData)>0) return {status:"available", msg:""};
            }
            return {status:"closed", msg:"Closed"};
        }
        const availCount = sumAvailability(lunchData);
        if (availCount<=0) {
            if (mealTypes.includes("dinner")) {
                const dinnerData = availabilityMap[`${ds}_dinner`];
                if (dinnerData===undefined) return {status:"loading", msg:"Loading..."};
                if (sumAvailability(dinnerData)>0) return {status:"available", msg:""};
            }
            return {status:"full", msg:"Full"};
        }
        return {status:"available", msg:""};
    };

    const rows = [];
    let day = gridStart;
    while (day <= gridEnd) {
        const week = [];
        for (let i=0; i<7; i++) {
            const d = day;
            const sel = isSameDay(d, selectedDate);
            const {status,msg} = getStatus(d);
            const disabled = ["past","closed","full","no-data"].includes(status);

            let bg="bg-gray-100", txt="text-gray-800";
            if (status==="past")      { bg="bg-gray-300"; txt="text-gray-500 line-through"; }
            else if (status==="closed"){ bg="bg-red-200"; txt="text-red-900"; }
            else if (status==="full")  { bg="bg-red-300"; txt="text-red-900"; }
            else if (status==="no-data"){ bg="bg-yellow-200"; txt="text-yellow-800"; }
            if (sel) { bg="bg-blue-600"; txt="text-white"; }

            week.push(
                <button
                    key={d.toISOString()}
                    onClick={()=>!disabled && onDateSelect(d)}
                    disabled={disabled}
                    className={`w-10 h-10 m-1 rounded flex items-center justify-center ${bg} ${txt} ${
                        disabled?"cursor-not-allowed":"cursor-pointer"
                    } transition hover:bg-blue-200`}
                    title={msg||format(d,"EEEE, MMMM d, yyyy")}
                >
                    {format(d,"d")}
                </button>
            );

            day = addDays(day,1);
        }
        rows.push(<div key={day.toISOString()} className="flex justify-center">{week}</div>);
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <button onClick={()=>setCurrentMonth(m=>subMonths(m,1))}>&lt;</button>
                <div className="font-bold">{format(currentMonth,"MMMM yyyy")}</div>
                <button onClick={()=>setCurrentMonth(m=>addMonths(m,1))}>&gt;</button>
            </div>
            {renderDayHeaders()}
            {rows}
        </div>
    );
}

Calendar.propTypes = {
    currentMonth:     PropTypes.instanceOf(Date).isRequired,
    setCurrentMonth:  PropTypes.func.isRequired,
    today:            PropTypes.instanceOf(Date).isRequired,
    maxDate:          PropTypes.instanceOf(Date).isRequired,
    selectedDate:     PropTypes.instanceOf(Date),
    onDateSelect:     PropTypes.func.isRequired,
    availabilityMap:  PropTypes.object.isRequired,
};
