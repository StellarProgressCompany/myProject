// frontend/src/components/admin/sharedBookings/BookingsCompactView.jsx

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { enUS, es as esLocale, ca as caLocale } from "date-fns/locale";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import axios from "axios";
import { getDayMealTypes } from "../../../services/datePicker";
import { translate, getLanguage } from "../../../services/i18n";

const localeMap = { en: enUS, es: esLocale, ca: caLocale };

/**
 * Compact 7-day strip (future / past).
 */
export default function BookingsCompactView({
                                                mode,
                                                rangeDays,
                                                offset,
                                                onOffsetChange,
                                                selectedDate = null,
                                                onSelectDay,
                                                bookings,
                                                closedDays = [],
                                            }) {
    const lang = getLanguage();
    const t = (k, p) => translate(lang, k, p);
    const locale = localeMap[lang] || enUS;

    // dynamic booking window horizon
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
                // fallback remains 30
            });
    }, []);

    const today = new Date();
    const closedSet = new Set(closedDays);

    /* build day list for the current window */
    const days = [];
    if (mode === "future") {
        for (let i = offset; i < offset + rangeDays; i++) {
            days.push(addDays(today, i));
        }
    } else {
        for (let i = 1 + offset; i <= rangeDays + offset; i++) {
            days.push(subDays(today, i));
        }
    }

    /* aggregate stats */
    const getDayStats = (day) => {
        const key = format(day, "yyyy-MM-dd");
        const dayBookings = bookings.filter(
            (b) => (b.table_availability?.date || b.date || "").slice(0, 10) === key
        );
        const totalClients = dayBookings.reduce(
            (sum, b) => sum + (b.total_adults || 0) + (b.total_kids || 0),
            0
        );
        return { bookings: dayBookings.length, clients: totalClients };
    };

    /* colouring helpers */
    const isClosed = (d) =>
        closedSet.has(format(d, "yyyy-MM-dd")) ||
        getDayMealTypes(d.getDay()).length === 0;
    const isBlocked = (d) => d > addDays(today, bookingWindowDays);

    return (
        <div className="relative flex w-full items-center">
            {/* left chevron */}
            <button
                onClick={() => onOffsetChange(offset - 1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 flex justify-center items-center bg-white shadow rounded-full hover:bg-gray-100 z-10"
                aria-label={t("calendar.prev")}
            >
                <IconChevronLeft className="w-5 h-5 text-gray-500" />
            </button>

            {/* day buttons container */}
            <div className="flex-1 flex justify-between space-x-4 p-4 bg-white rounded shadow overflow-x-auto">
                {days.map((day) => {
                    const { bookings: bc, clients } = getDayStats(day);
                    const isSel = selectedDate && isSameDay(day, selectedDate);

                    /* colour classes */
                    let bg = "bg-gray-100";
                    let txt = "text-gray-800";

                    if (isClosed(day)) {
                        bg = "bg-red-200";
                        txt = "text-red-800";
                    } else if (isBlocked(day)) {
                        bg = "bg-yellow-100";
                        txt = "text-yellow-800";
                    }
                    if (isSel) {
                        bg = "bg-blue-600";
                        txt = "text-white";
                    }

                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => onSelectDay(day)}
                            className={`${bg} ${txt} flex-shrink-0 flex flex-col items-center w-28 py-3 rounded hover:bg-blue-200 transition`}
                            title={format(day, "EEEE, MMMM d, yyyy", { locale })}
                        >
              <span className="text-xs font-semibold">
                {format(day, "E", { locale })}
              </span>
                            <span className="text-2xl font-bold">
                {format(day, "d", { locale })}
              </span>
                            <span className="text-sm">{format(day, "MMM", { locale })}</span>
                            <span className="mt-2 text-xs leading-none">
                {bc} {t("calendar.badgeBookings")}
              </span>
                            <span className="text-xs leading-none">
                {clients} {t("calendar.badgeClients")}
              </span>
                        </button>
                    );
                })}
            </div>

            {/* right chevron */}
            <button
                onClick={() => onOffsetChange(offset + 1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 flex justify-center items-center bg-white shadow rounded-full hover:bg-gray-100 z-10"
                aria-label={t("calendar.next")}
            >
                <IconChevronRight className="w-5 h-5 text-gray-500" />
            </button>
        </div>
    );
}

BookingsCompactView.propTypes = {
    mode: PropTypes.oneOf(["future", "past"]).isRequired,
    rangeDays: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    onOffsetChange: PropTypes.func.isRequired,
    selectedDate: PropTypes.instanceOf(Date),
    onSelectDay: PropTypes.func.isRequired,
    bookings: PropTypes.arrayOf(PropTypes.object).isRequired,
    closedDays: PropTypes.arrayOf(PropTypes.string),
};
