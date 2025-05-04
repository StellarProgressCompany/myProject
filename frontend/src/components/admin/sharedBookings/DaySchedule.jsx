// frontend/src/components/admin/sharedBookings/DaySchedule.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import { format } from "date-fns";
import { enUS, es as esLocale, ca as caLocale } from "date-fns/locale";
import TableUsage from "./TableUsage";
import { translate, getLanguage } from "../../../services/i18n";

const localeMap = { en: enUS, es: esLocale, ca: caLocale };
const getBookingDate = (b) =>
    (b.table_availability?.date || b.date || "").slice(0, 10);

export default function DaySchedule({
                                        selectedDate,
                                        bookings,
                                        tableAvailability,
                                        onClose,
                                        enableZoom = false,
                                    }) {
    const lang   = getLanguage();
    const t      = (k, p) => translate(lang, k, p);
    const locale = localeMap[lang] || enUS;

    const [showFloor, setShowFloor] = useState(false);

    if (!selectedDate) return null;

    const dateStr = format(selectedDate, "yyyy-MM-dd", { locale });
    const dayInfo = tableAvailability[dateStr];

    if (!dayInfo || dayInfo === "closed") {
        return (
            <div className="mt-6 border rounded bg-white p-4 shadow">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">
                        {t("schedule.header", {
                            date: format(selectedDate, "EEEE, MMMM d, yyyy", { locale }),
                        })}
                    </h3>
                    <button onClick={onClose} className="text-sm text-red-500 underline">
                        {t("admin.close")}
                    </button>
                </div>
                <p
                    className={
                        dayInfo === "closed"
                            ? "text-red-600 font-semibold"
                            : "text-gray-700"
                    }
                >
                    {dayInfo === "closed" ? "CLOSED" : t("schedule.noBookings")}
                </p>
            </div>
        );
    }

    const roundKeys = ["first_round", "second_round", "dinner_round"].filter(
        (rk) => rk in dayInfo
    );

    const roundBookings = {};
    roundKeys.forEach((rk) => {
        roundBookings[rk] = bookings
            .filter((b) => {
                if (getBookingDate(b) !== dateStr) return false;
                if (rk.includes("first")) return b.reserved_time < "15:00:00";
                if (rk.includes("second"))
                    return b.reserved_time >= "15:00:00" && b.reserved_time < "20:00:00";
                return b.reserved_time >= "20:00:00";
            })
            .sort((a, b) => a.reserved_time.localeCompare(b.reserved_time));
    });

    const fullStock = { 2: 0, 4: 0, 6: 0 };
    roundKeys.forEach((rk) => {
        const avail  = dayInfo[rk]?.availability || {};
        const booked = {};
        (roundBookings[rk] || []).forEach((bk) => {
            const cap = bk.table_availability?.capacity || 0;
            booked[cap] = (booked[cap] || 0) + 1;
        });
        [2, 4, 6].forEach((cap) => {
            const totalHere = (avail[cap] || 0) + (booked[cap] || 0);
            fullStock[cap] = Math.max(fullStock[cap], totalHere);
        });
    });

    const prettyRound = (key) => {
        if (key.includes("first"))
            return { lbl: t("schedule.round.lunchFirst"), bg: "bg-green-50" };
        if (key.includes("second"))
            return { lbl: t("schedule.round.lunchSecond"), bg: "bg-orange-50" };
        return { lbl: t("schedule.round.dinner"), bg: "bg-purple-50" };
    };

    return (
        <div className="mt-6 border rounded bg-white p-4 shadow">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">
                    {t("schedule.header", {
                        date: format(selectedDate, "EEEE, MMMM d, yyyy", { locale }),
                    })}
                </h3>
                <div className="space-x-3">
                    {enableZoom && (
                        <button
                            onClick={() => setShowFloor((v) => !v)}
                            className="text-sm px-2 py-1 border rounded hover:bg-gray-100"
                        >
                            {showFloor ? t("admin.hideFloor") : t("admin.expandFloor")}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="text-sm text-red-500 underline hover:text-red-700"
                    >
                        {t("admin.close")}
                    </button>
                </div>
            </div>

            {roundKeys.map((rk) => {
                const { lbl, bg } = prettyRound(rk);
                const rows        = roundBookings[rk] || [];

                return (
                    <div key={rk} className="mb-8">
                        <h4 className="text-md font-semibold mb-2">{lbl}</h4>

                        {rows.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200 text-sm mb-3">
                                <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-3 py-2 text-left font-semibold">
                                        {t("schedule.table.time")}
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold">
                                        {t("schedule.table.name")}
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold">
                                        {t("schedule.table.totalClients")}
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                {rows.map((bk) => (
                                    <tr
                                        key={bk.id}
                                        className={`${bg} hover:bg-yellow-50 transition`}
                                    >
                                        <td className="px-3 py-2">
                                            {bk.reserved_time.slice(0, 5)}
                                        </td>
                                        <td className="px-3 py-2 truncate max-w-[160px]">
                                            {bk.full_name}
                                        </td>
                                        <td className="px-3 py-2">
                                            {bk.total_adults + bk.total_kids}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-gray-500 mb-3">
                                {t("schedule.noBookings")}
                            </p>
                        )}

                        {showFloor && (
                            <TableUsage
                                capacityTotals={fullStock}
                                bookings={rows}
                                expanded
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

DaySchedule.propTypes = {
    selectedDate:      PropTypes.instanceOf(Date),
    bookings:          PropTypes.arrayOf(PropTypes.object).isRequired,
    tableAvailability: PropTypes.object.isRequired,
    onClose:           PropTypes.func.isRequired,
    enableZoom:        PropTypes.bool,
};
