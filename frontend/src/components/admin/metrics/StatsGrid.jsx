// src/components/admin/metrics/StatsGrid.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import {
    IconArrowDownRight,
    IconArrowUpRight,
    IconCalendarStats,
    IconUsers,
    IconLayoutGrid,
    IconTrendingUp,
} from "@tabler/icons-react";
import { parseISO, subDays } from "date-fns";

/* ---------- helper to crunch the last-30-days stats --------------- */
function computeMetrics(bookings) {
    const today = new Date();
    const startCurr = subDays(today, 30);
    const startPrev = subDays(today, 60);

    let currBookings = 0,
        prevBookings = 0,
        currGuests = 0,
        prevGuests = 0,
        uniqueGuests = new Set();

    bookings.forEach((b) => {
        const dateStr = b.table_availability?.date || b.date;
        if (!dateStr) return;
        const d = parseISO(dateStr);
        const guests = (b.total_adults || 0) + (b.total_kids || 0);
        uniqueGuests.add(b.full_name?.trim() || `#${b.id}`);
        if (d >= startCurr && d <= today) {
            currBookings++;
            currGuests += guests;
        } else if (d >= startPrev && d < startCurr) {
            prevBookings++;
            prevGuests += guests;
        }
    });

    const bookingDiff =
        prevBookings === 0 ? 100 : ((currBookings - prevBookings) / prevBookings) * 100;
    const guestDiff =
        prevGuests === 0 ? 100 : ((currGuests - prevGuests) / prevGuests) * 100;

    return {
        currBookings,
        currGuests,
        uniqueGuests: uniqueGuests.size,
        avgGuests: currBookings === 0 ? 0 : (currGuests / currBookings).toFixed(1),
        bookingDiff: bookingDiff.toFixed(0),
        guestDiff: guestDiff.toFixed(0),
    };
}

const icons = {
    calendar: IconCalendarStats,
    users: IconUsers,
    grid: IconLayoutGrid,
    trend: IconTrendingUp,
};

export default function StatsGrid({ bookings = [] }) {
    const m = useMemo(() => computeMetrics(bookings), [bookings]);

    const data = [
        {
            key: "bookings",
            title: "Bookings (30 d)",
            icon: "calendar",
            value: m.currBookings,
            diff: m.bookingDiff,
        },
        {
            key: "guests",
            title: "Guests (30 d)",
            icon: "users",
            value: m.currGuests,
            diff: m.guestDiff,
        },
        {
            key: "avg",
            title: "Avg Guests / booking",
            icon: "grid",
            value: m.avgGuests,
            diff: 0,
        },
        {
            key: "unique",
            title: "Unique Names",
            icon: "trend",
            value: m.uniqueGuests,
            diff: 0,
        },
    ];

    return (
        <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {data.map((stat) => {
                    const StatIcon = icons[stat.icon];
                    const positive = Number(stat.diff) >= 0;
                    const DiffIcon = positive ? IconArrowUpRight : IconArrowDownRight;
                    const diffColor = positive ? "text-teal-500" : "text-red-500";

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
                            <div className="flex items-end space-x-2 mt-4">
                                <span className="text-2xl font-bold">{stat.value}</span>
                                {stat.diff !== 0 && (
                                    <span
                                        className={`flex items-center text-sm font-semibold ${diffColor}`}
                                    >
                    {stat.diff}% <DiffIcon className="w-4 h-4 ml-1" />
                  </span>
                                )}
                            </div>
                            {(stat.key === "bookings" || stat.key === "guests") && (
                                <p className="text-xs text-gray-500 mt-2">vs previous 30 d</p>
                            )}
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
