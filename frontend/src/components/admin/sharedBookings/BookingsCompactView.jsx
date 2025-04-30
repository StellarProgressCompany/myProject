import React from "react";
import PropTypes from "prop-types";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { translate } from "../../../services/i18n";

const lang = localStorage.getItem("adminLang") || "ca";
const t = (key, vars) => translate(lang, key, vars);

export default function BookingsCompactView({
                                                mode,
                                                rangeDays,
                                                selectedDate = null,
                                                onSelectDay,
                                                bookings,
                                            }) {
    const today = new Date();
    const days = [];
    if (mode === "future") {
        for (let i = 0; i < rangeDays; i++) days.push(addDays(today, i));
    } else {
        for (let i = 1; i <= rangeDays; i++) days.push(subDays(today, i));
    }

    function getDayStats(day) {
        const key = format(day, "yyyy-MM-dd");
        const dayBookings = bookings.filter((b) => {
            const bd = b.table_availability?.date || b.date;
            return bd === key;
        });
        const totalClients = dayBookings.reduce(
            (sum, b) => sum + (b.total_adults || 0) + (b.total_kids || 0),
            0
        );
        return { bookingsCount: dayBookings.length, totalClients };
    }

    return (
        <div className="flex space-x-2 overflow-x-auto p-2 bg-white rounded shadow">
            {days.map((day) => {
                const { bookingsCount, totalClients } = getDayStats(day);
                const isSel = selectedDate && isSameDay(day, selectedDate);
                const bg = isSel ? "bg-blue-600" : "bg-gray-100";
                const txt = isSel ? "text-white" : "text-gray-800";

                return (
                    <button
                        key={day.toISOString()}
                        onClick={() => onSelectDay(day)}
                        className={`${bg} ${txt} flex flex-col items-center w-16 py-2 rounded`}
                        title={format(day, "EEEE, MMMM d, yyyy")}
                    >
                        <span className="text-xs font-semibold">
                            {format(day, "E")}
                        </span>
                        <span className="text-xl font-bold">
                            {format(day, "d")}
                        </span>
                        <span className="text-xs">{format(day, "MMM")}</span>
                        <span className="mt-1 text-xs">
                            {bookingsCount}
                            {t("calendar.badgeBookings")}
                        </span>
                        <span className="text-xs">
                            {totalClients}
                            {t("calendar.badgeClients")}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

BookingsCompactView.propTypes = {
    mode: PropTypes.oneOf(["future", "past"]).isRequired,
    rangeDays: PropTypes.number.isRequired,
    selectedDate: PropTypes.instanceOf(Date),
    onSelectDay: PropTypes.func.isRequired,
    bookings: PropTypes.arrayOf(PropTypes.object).isRequired,
};
