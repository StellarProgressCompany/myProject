// frontend/src/components/admin/sharedBookings/BookingsCompactView.jsx
import React from "react";
import PropTypes from "prop-types";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { enUS, es as esLocale, ca as caLocale } from "date-fns/locale";
import { translate, getLanguage } from "../../../services/i18n";

const localeMap = { en: enUS, es: esLocale, ca: caLocale };
const getBookingDate = (b) =>
    (b.table_availability?.date || b.date || "").slice(0, 10);

export default function BookingsCompactView({
                                                mode,
                                                rangeDays,
                                                offset,
                                                onOffsetChange,
                                                selectedDate = null,
                                                onSelectDay,
                                                bookings,
                                            }) {
    const lang   = getLanguage();
    const t      = (k, p) => translate(lang, k, p);
    const locale = localeMap[lang] || enUS;

    const today = new Date();
    const days  = [];

    if (mode === "future") {
        for (let i = offset; i < offset + rangeDays; i++) {
            days.push(addDays(today, i));
        }
    } else {
        for (let i = 1 + offset; i <= rangeDays + offset; i++) {
            days.push(subDays(today, i));
        }
    }

    const getDayStats = (day) => {
        const key = format(day, "yyyy-MM-dd", { locale });
        const dayBookings = bookings.filter((b) => getBookingDate(b) === key);
        const totalClients = dayBookings.reduce(
            (sum, b) => sum + (b.total_adults || 0) + (b.total_kids || 0),
            0
        );
        return { bookings: dayBookings.length, clients: totalClients };
    };

    return (
        <div className="relative">
            {/* arrows */}
            <button
                onClick={() => onOffsetChange(offset - 1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 px-1 text-gray-500 hover:text-gray-800"
                aria-label="Previous window"
            >
                ‹
            </button>
            <button
                onClick={() => onOffsetChange(offset + 1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 px-1 text-gray-500 hover:text-gray-800"
                aria-label="Next window"
            >
                ›
            </button>

            <div className="flex space-x-2 overflow-x-auto p-2 bg-white rounded shadow mx-6">
                {days.map((day) => {
                    const { bookings: bc, clients } = getDayStats(day);
                    const isSel = selectedDate && isSameDay(day, selectedDate);
                    const bg    = isSel ? "bg-blue-600" : "bg-gray-100";
                    const txt   = isSel ? "text-white"  : "text-gray-800";

                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => onSelectDay(day)}
                            className={`${bg} ${txt} flex flex-col items-center w-16 py-2 rounded hover:bg-blue-200 transition`}
                            title={format(day, "EEEE, MMMM d, yyyy", { locale })}
                        >
                            <span className="text-xs font-semibold">
                                {format(day, "E", { locale })}
                            </span>
                            <span className="text-xl font-bold">
                                {format(day, "d", { locale })}
                            </span>
                            <span className="text-xs">
                                {format(day, "MMM", { locale })}
                            </span>
                            <span className="mt-1 text-[10px]">
                                {bc} {t("calendar.badgeBookings")}
                            </span>
                            <span className="text-[10px]">
                                {clients} {t("calendar.badgeClients")}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

BookingsCompactView.propTypes = {
    mode:            PropTypes.oneOf(["future", "past"]).isRequired,
    rangeDays:       PropTypes.number.isRequired,
    offset:          PropTypes.number.isRequired,
    onOffsetChange:  PropTypes.func.isRequired,
    selectedDate:    PropTypes.instanceOf(Date),
    onSelectDay:     PropTypes.func.isRequired,
    bookings:        PropTypes.arrayOf(PropTypes.object).isRequired,
};
