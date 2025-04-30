// frontend/src/components/admin/sharedBookings/BookingsCalendarView.jsx

import React, { useState } from "react";
import PropTypes from "prop-types";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    isSameMonth,
    isSameDay,
} from "date-fns";
import {
    enUS,
    es as esLocale,
    ca as caLocale,
} from "date-fns/locale";
import { translate, getLanguage } from "../../../services/i18n";

const localeMap = {
    en: enUS,
    es: esLocale,
    ca: caLocale,
};

export default function BookingsCalendarView({
                                                 selectedDate = null,
                                                 onSelectDay,
                                                 bookings,
                                             }) {
    const lang   = getLanguage();
    const t      = (k, p) => translate(lang, k, p);
    const locale = localeMap[lang] || enUS;

    const [monthToShow, setMonthToShow] = useState(new Date());

    // weekday headers localized
    const weekdayLabels = Array.from({ length: 7 }).map((_, i) =>
        format(
            addDays(
                startOfWeek(new Date(), { weekStartsOn: 1, locale }),
                i
            ),
            "EEE",
            { locale }
        )
    );

    const monthStart = startOfMonth(monthToShow);
    const monthEnd   = endOfMonth(monthToShow);
    const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1, locale });
    const gridEnd    = endOfWeek(monthEnd, { weekStartsOn: 1, locale });

    function getDayStats(date) {
        const dateStr = format(date, "yyyy-MM-dd", { locale });
        const dayBookings = bookings.filter((b) => {
            const bd = b.table_availability?.date || b.date;
            return bd === dateStr;
        });
        const totalClients = dayBookings.reduce(
            (acc, b) => acc + (b.table_availability?.capacity || 0),
            0
        );
        return { bookingsCount: dayBookings.length, totalClients };
    }

    const rows = [];
    let day = gridStart;
    while (day <= gridEnd) {
        const week = [];
        for (let i = 0; i < 7; i++) {
            const cloneDay     = day;
            const { bookingsCount, totalClients } = getDayStats(cloneDay);
            const isCurrentMonth = isSameMonth(cloneDay, monthToShow);
            const isSelected     = selectedDate && isSameDay(cloneDay, selectedDate);

            let bg  = isSelected ? "bg-blue-600" : "bg-white";
            let txt = isSelected
                ? "text-white"
                : isCurrentMonth
                    ? "text-gray-800"
                    : "text-gray-400";

            week.push(
                <button
                    key={cloneDay.toISOString()}
                    onClick={() => onSelectDay(cloneDay)}
                    className={`${bg} ${txt} relative p-2 h-24 border border-gray-200 flex items-center justify-center hover:bg-blue-50 transition`}
                    style={{ minWidth: 50 }}
                    title={format(cloneDay, "EEEE, MMMM d, yyyy", { locale })}
                >
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-semibold">
                            {format(cloneDay, "d", { locale })}
                        </span>
                        {bookingsCount > 0 && (
                            <span className="text-xs mt-1 inline-block bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                                {bookingsCount} {t("calendar.badgeBookings")}
                            </span>
                        )}
                        {totalClients > 0 && (
                            <span className="text-xs mt-1 inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                {totalClients} {t("calendar.badgeClients")}
                            </span>
                        )}
                    </div>
                </button>
            );
            day = addDays(day, 1);
        }
        rows.push(
            <div key={rows.length} className="grid grid-cols-7">
                {week}
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded shadow">
            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={() =>
                        setMonthToShow((prev) =>
                            new Date(prev.setMonth(prev.getMonth() - 1))
                        )
                    }
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                    {t("calendar.prev")}
                </button>
                <h3 className="font-semibold">
                    {format(monthToShow, "MMMM yyyy", { locale })}
                </h3>
                <button
                    onClick={() =>
                        setMonthToShow((prev) =>
                            new Date(prev.setMonth(prev.getMonth() + 1))
                        )
                    }
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                    {t("calendar.next")}
                </button>
            </div>

            <div className="grid grid-cols-7 text-center font-bold text-xs mb-1">
                {weekdayLabels.map((lbl) => (
                    <div key={lbl}>{lbl}</div>
                ))}
            </div>

            {rows}
        </div>
    );
}

BookingsCalendarView.propTypes = {
    selectedDate: PropTypes.instanceOf(Date),
    onSelectDay:  PropTypes.func.isRequired,
    bookings:     PropTypes.arrayOf(PropTypes.object).isRequired,
};
