// frontend/src/components/admin/sharedBookings/BookingsCalendarView.jsx
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
} from "date-fns";
import { enUS, es as esLocale, ca as caLocale } from "date-fns/locale";

import axios from "axios";
import { getDayMealTypes } from "../../../services/datePicker";
import { translate, getLanguage } from "../../../services/i18n";

const localeMap = { en: enUS, es: esLocale, ca: caLocale };

export default function BookingsCalendarView({
                                                 selectedDate = null,
                                                 onSelectDay,
                                                 bookings,
                                                 closedDays = [],
                                                 openDays = [],
                                             }) {
    const lang = getLanguage();
    const t = (k, p) => translate(lang, k, p);
    const locale = localeMap[lang] || enUS;

    // ─── dynamic booking window horizon ───
    const [bookingWindowDays, setBookingWindowDays] = useState(30);
    useEffect(() => {
        axios
            .get("/api/meta/horizon-days")
            .then(({ data }) => {
                const n = parseInt(data, 10);
                if (Number.isFinite(n) && n > 0) {
                    setBookingWindowDays(n);
                }
            })
            .catch(() => {
                // leave default = 30
            });
    }, []);

    const [monthToShow, setMonthToShow] = useState(new Date());
    const today = new Date();
    const closedSet = new Set(closedDays);
    const openSet = new Set(openDays);

    /* helpers */
    const weekdayLabels = Array.from({ length: 7 }).map((_, i) =>
        format(
            addDays(startOfWeek(new Date(), { weekStartsOn: 1, locale }), i),
            "EEE",
            { locale }
        )
    );

    const monthStart = startOfMonth(monthToShow);
    const monthEnd = endOfMonth(monthToShow);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1, locale });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1, locale });

    const getDayStats = (date) => {
        const key = format(date, "yyyy-MM-dd");
        const dayBk = bookings.filter(
            (b) =>
                (b.table_availability?.date || b.date || "").slice(0, 10) === key
        );
        const tot = dayBk.reduce(
            (n, b) => n + (b.total_adults || 0) + (b.total_kids || 0),
            0
        );
        return { bookings: dayBk.length, clients: tot };
    };

    /* colour helpers */
    const isClosed = (d) => {
        const key = format(d, "yyyy-MM-dd");
        if (openSet.has(key)) return false; // exception overrides
        return (
            closedSet.has(key) || getDayMealTypes(d.getDay()).length === 0
        );
    };
    const isBlocked = (d) => d > addDays(today, bookingWindowDays);

    /* build grid */
    const rows = [];
    let dayPtr = gridStart;
    while (dayPtr <= gridEnd) {
        const week = [];
        for (let i = 0; i < 7; i++) {
            const d = dayPtr;
            const { bookings: bc, clients } = getDayStats(d);
            const inMonth = isSameMonth(d, monthToShow);
            const selected = selectedDate && isSameDay(d, selectedDate);

            /* colour classes */
            let bg = "bg-white";
            let txt = inMonth ? "text-gray-800" : "text-gray-400";

            if (isClosed(d)) {
                bg = "bg-red-200";
                txt = "text-red-800";
            } else if (isBlocked(d)) {
                bg = "bg-yellow-100";
                txt = "text-yellow-800";
            }

            if (selected) {
                bg = "bg-blue-600";
                txt = "text-white";
            }

            week.push(
                <button
                    key={d.toISOString()}
                    onClick={() => onSelectDay(d)}
                    className={`${bg} ${txt} relative p-2 h-24 border border-gray-200 flex flex-col items-center justify-center hover:bg-blue-50 transition`}
                    style={{ minWidth: 50 }}
                    title={format(d, "EEEE, MMMM d, yyyy", { locale })}
                >
          <span className="text-sm font-semibold">
            {format(d, "d", { locale })}
          </span>

                    {bc > 0 && (
                        <span className="text-[10px] mt-1 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
              {bc} {t("calendar.badgeBookings")}
            </span>
                    )}
                    {clients > 0 && (
                        <span className="text-[10px] mt-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
              {clients} {t("calendar.badgeClients")}
            </span>
                    )}
                </button>
            );

            dayPtr = addDays(dayPtr, 1);
        }
        rows.push(
            <div key={rows.length} className="grid grid-cols-7">
                {week}
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded shadow">
            {/* month controls */}
            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={() => setMonthToShow((prev) => subMonths(prev, 1))}
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                    {t("calendar.prev")}
                </button>
                <h3 className="font-semibold">
                    {format(monthToShow, "MMMM yyyy", { locale })}
                </h3>
                <button
                    onClick={() => setMonthToShow((prev) => addMonths(prev, 1))}
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                    {t("calendar.next")}
                </button>
            </div>

            {/* weekday headers */}
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
    onSelectDay: PropTypes.func.isRequired,
    bookings: PropTypes.arrayOf(PropTypes.object).isRequired,
    closedDays: PropTypes.arrayOf(PropTypes.string),
    openDays: PropTypes.arrayOf(PropTypes.string),
};
