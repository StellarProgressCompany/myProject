// frontend/src/components/admin/metrics/StatsGrid.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import {
    IconCalendarStats,
    IconUsers,
    IconLayoutGrid,
    IconTrophy,
} from "@tabler/icons-react";
import { parseISO } from "date-fns";
import { translate, getLanguage } from "../../../services/i18n";

function computeMetrics(bookings) {
    let totalBookings = 0;
    let totalGuests   = 0;
    const uniqueGuests = new Set();
    const perDayGuests = {};

    bookings.forEach((b) => {
        const dateStr = b.table_availability?.date || b.date;
        if (!dateStr) return;

        const guests = (b.total_adults || 0) + (b.total_kids || 0);
        totalBookings += 1;
        totalGuests   += guests;

        /* per-day count */
        const dKey = parseISO(dateStr).toISOString().slice(0,10);
        perDayGuests[dKey] = (perDayGuests[dKey] || 0) + guests;

        /* unique guest counted by full name (fallback id) */
        uniqueGuests.add(b.full_name?.trim() || `#${b.id}`);
    });

    const peakGuests = Object.values(perDayGuests).reduce(
        (m, v) => Math.max(m, v),
        0
    );

    return {
        totalBookings,
        totalGuests,
        uniqueGuests: uniqueGuests.size,
        avgGuests:    totalBookings === 0 ? 0 : (totalGuests / totalBookings).toFixed(1),
        peakGuests,
    };
}

export default function StatsGrid({ bookings = [] }) {
    const lang = getLanguage();
    const t    = (k, vars) => translate(lang, k, vars);

    const m = useMemo(() => computeMetrics(bookings), [bookings]);

    const data = [
        {
            key:   "bookings",
            title: t("overview.bookings"),
            icon:  IconCalendarStats,
            value: m.totalBookings,
        },
        {
            key:   "guests",
            title: t("overview.guests"),
            icon:  IconUsers,
            value: m.totalGuests,
        },
        {
            key:   "avg",
            title: t("overview.avgGuests"),
            icon:  IconLayoutGrid,
            value: m.avgGuests,
        },
        {
            key:   "peak",
            title: t("overview.peakDayGuests"),
            icon:  IconTrophy,
            value: m.peakGuests,
        },
        {
            key:   "unique",
            title: t("overview.uniqueNames"),
            icon:  IconUsers,
            value: m.uniqueGuests,
        },
    ];

    return (
        <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                {data.map((stat) => {
                    const StatIcon = stat.icon;
                    return (
                        <div
                            key={stat.key}
                            className="border rounded-md p-4 shadow bg-white"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500 font-semibold uppercase">
                                    {stat.title}
                                </p>
                                <StatIcon className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="mt-4 text-2xl font-bold text-gray-800">
                                {stat.value}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

StatsGrid.propTypes = {
    bookings: PropTypes.arrayOf(PropTypes.object),
};
