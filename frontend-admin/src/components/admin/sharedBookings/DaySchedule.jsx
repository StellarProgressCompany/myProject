// frontend-admin/src/components/admin/sharedBookings/DaySchedule.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import { format } from "date-fns";
import { enUS, es as esLocale, ca as caLocale } from "date-fns/locale";
import TableUsage from "./TableUsage";
import { translate, getLanguage } from "../../../services/i18n";
import { IconPencil } from "@tabler/icons-react";

const localeMap = { en: enUS, es: esLocale, ca: caLocale };
const getBookingDate = (b) =>
    (b.table_availability?.date || b.date || "").slice(0, 10);

/**
 * Renders a single-day schedule **with multi-room support**.
 *
 * • Accepts data from the new `/api/table-availability-multi` endpoint:
 *   ```js
 *   {
 *     first_round : { time, note, rooms:{ interior:{2:4,4:6,…}, terrace:{…} } },
 *     second_round: { … },
 *     dinner_round: { … }
 *   }
 *   ```
 *
 * • Continues to accept legacy shapes so nothing else breaks.
 */
export default function DaySchedule({
                                        selectedDate,
                                        bookings,
                                        tableAvailability,
                                        onClose,
                                        enableZoom = false,
                                        onBookingClick = () => {},
                                        onRefresh = () => {},
                                    }) {
    /* ─── i18n helpers ───────────────────────────────────────────── */
    const lang = getLanguage();
    const t = (k, p) => translate(lang, k, p);
    const locale = localeMap[lang] || enUS;

    /* ─── local state ───────────────────────────────────────────── */
    const [showFloor, setShowFloor] = useState(false);
    if (!selectedDate) return null;

    /* ─── pull data for this day ────────────────────────────────── */
    const dateStr = format(selectedDate, "yyyy-MM-dd", { locale });
    const dayInfo = tableAvailability[dateStr];
    const indicator = typeof dayInfo === "string" ? dayInfo : null;
    const dayObj = indicator ? {} : dayInfo || {};

    const roundKeys = ["first_round", "second_round", "dinner_round"].filter(
        (rk) => rk in dayObj
    );

    /* group bookings by round */
    const roundBookings = {};
    roundKeys.forEach((rk) => {
        roundBookings[rk] = bookings
            .filter((b) => getBookingDate(b) === dateStr)
            .filter((b) => {
                if (rk === "first_round") return b.reserved_time < "15:00:00";
                if (rk === "second_round")
                    return (
                        b.reserved_time >= "15:00:00" && b.reserved_time < "20:00:00"
                    );
                return b.reserved_time >= "20:00:00"; // dinner
            })
            .sort((a, b) => a.reserved_time.localeCompare(b.reserved_time));
    });

    /* build   room → { cap → avail }   map on every round */
    roundKeys.forEach((rk) => {
        const info = dayObj[rk];
        if (!info) return;

        let perRoom = {};

        /* ── NEW SHAPE ── */
        if (info.rooms && typeof info.rooms === "object") {
            perRoom = { ...info.rooms };
        }

        /* ── LEGACY SHAPES (keep backward compatibility) ── */
        else if (info.availability) {
            const raw = info.availability;
            const keys = Object.keys(raw);
            if (keys.length && isNaN(Number(keys[0]))) {
                // { interior:{2:4,4:6}, terrace:{…} }
                perRoom = { ...raw };
            } else {
                // { "2":4,"4":6 } → single pseudo-room “all”
                perRoom = { all: raw };
            }
        }

        /* Derive __roomTotals so TableUsage renders correctly */
        info.__roomTotals = perRoom;

        /* Hide the synthetic “all” bucket when real rooms exist */
        const realRooms = Object.keys(perRoom).filter((r) => r !== "all");
        if (realRooms.length > 0) delete perRoom.all;
    });

    const prettyRound = (rk) => {
        if (rk === "first_round")
            return { lbl: t("schedule.round.lunchFirst"), bg: "bg-green-50" };
        if (rk === "second_round")
            return { lbl: t("schedule.round.lunchSecond"), bg: "bg-orange-50" };
        return { lbl: t("schedule.round.dinner"), bg: "bg-purple-50" };
    };

    /* ─── render ────────────────────────────────────────────────── */
    return (
        <div className="mt-6 border rounded bg-white p-4 shadow">
            {/* header --------------------------------------------------- */}
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

            {/* CLOSED / HOLIDAY indicator ------------------------------ */}
            {indicator && (
                <p
                    className={
                        indicator === "closed"
                            ? "text-red-600 font-semibold mb-4"
                            : "text-yellow-600 font-semibold mb-4"
                    }
                >
                    {indicator.toUpperCase()}
                </p>
            )}

            {/* one block per round ------------------------------------- */}
            {roundKeys.map((rk) => {
                const { lbl, bg } = prettyRound(rk);
                const rows = roundBookings[rk] || [];
                const roomTotals = dayObj[rk]?.__roomTotals || {};
                const rooms = Object.keys(roomTotals);

                return (
                    <div key={rk} className="mb-8">
                        <h4 className="text-md font-semibold mb-2">{lbl}</h4>

                        {/* BOOKINGS TABLE ------------------------------------ */}
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
                                    <th className="px-3 py-2 text-left font-semibold">
                                        {t("schedule.table.edit") || "Edit"}
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                {rows.map((bk) => (
                                    <tr
                                        key={bk.id}
                                        className={`${bg} hover:bg-yellow-50 transition cursor-pointer`}
                                        onClick={() => onBookingClick(bk)}
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
                                        <td className="px-3 py-2 text-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onBookingClick(bk);
                                                }}
                                                className="text-gray-600 hover:text-gray-900"
                                                title={t("schedule.table.edit") || "Edit"}
                                            >
                                                <IconPencil className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-gray-500 mb-3">{t("schedule.noBookings")}</p>
                        )}

                        {/* TABLE-USAGE GRIDS -------------------------------- */}
                        {showFloor && (
                            <TableUsage
                                rooms={rooms}
                                capacityTotalsByRoom={roomTotals}
                                bookings={rows}
                                expanded
                                onRefresh={onRefresh}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

DaySchedule.propTypes = {
    selectedDate: PropTypes.instanceOf(Date),
    bookings: PropTypes.arrayOf(PropTypes.object).isRequired,
    tableAvailability: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    enableZoom: PropTypes.bool,
    onBookingClick: PropTypes.func,
    onRefresh: PropTypes.func,
};
