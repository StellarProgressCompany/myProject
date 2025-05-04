// src/components/admin/sharedBookings/BookingsOverview.jsx
import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import {
    format,
    addDays,
    subDays,
    parseISO,
    startOfMonth,
    endOfMonth,
    startOfDay,
} from "date-fns";

import { fetchTableAvailabilityRange } from "../../../services/bookingService";
import BookingsCompactView   from "./BookingsCompactView";
import BookingsCalendarView  from "./BookingsCalendarView";
import BookingsChart         from "./BookingsChart";
import DaySchedule           from "./DaySchedule";
import AddBookingModal       from "../currentBookings/AddBookingModal";
import { translate, getLanguage } from "../../../services/i18n";

/* helper ― consistent “yyyy-MM-dd” string */
const ymd = (d) => format(d, "yyyy-MM-dd");

export default function BookingsOverview({
                                             mode,
                                             bookings,
                                             showChart   = true,
                                             allowDrill  = true,
                                             onWindowChange = () => {},
                                         }) {
    /* ───────── i18n ───────── */
    const lang = getLanguage();
    const t    = (k, v) => translate(lang, k, v);

    /* ───────── constants ───────── */
    const rangeDays = 7;
    const today     = useMemo(() => startOfDay(new Date()), []);   // stable “today”

    /* ───────── local state ───────── */
    const [offset,    setOffset]    = useState(0);        // window offset
    const [view,      setView]      = useState("compact"); // compact | calendar
    const [selDay,    setSelDay]    = useState(null);     // drilled-in date
    const [ta,        setTA]        = useState({});       // table availability
    const [loadingTA, setLoadingTA] = useState(false);
    const [showModal, setShowModal] = useState(false);

    /* ───────── window boundaries ───────── */
    const compactStart = useMemo(
        () =>
            mode === "future"
                ? addDays(today, offset)
                : subDays(today, rangeDays + offset),
        [mode, today, offset]
    );
    const compactEnd = useMemo(
        () =>
            mode === "future"
                ? addDays(compactStart, rangeDays - 1)
                : subDays(today, 1 + offset),
        [mode, compactStart, today, offset]
    );

    /* ───────── helpers ───────── */
    const inFuture = (d) => d >= today;
    const inPast   = (d) => d <  today;

    /* ╭─────────────────────────────────────────────────────────╮
       │ bookings slices (memoised → stable reference)           │
       ╰─────────────────────────────────────────────────────────╯ */
    const compactFiltered = useMemo(
        () =>
            bookings.filter((b) => {
                const d = parseISO(b.table_availability?.date || b.date);
                return d >= compactStart && d <= compactEnd;
            }),
        [bookings, compactStart, compactEnd]
    );

    const calendarBookings = useMemo(
        () =>
            bookings.filter((b) => {
                const d = parseISO(b.table_availability?.date || b.date);
                return mode === "future" ? inFuture(d) : inPast(d);
            }),
        [bookings, mode, today]
    );

    /* which set to expose to MetricsDashboard for KPIs */
    const statsBookings = view === "calendar" ? calendarBookings : compactFiltered;

    /* ╭─────────────────────────────────────────────────────────╮
       │ notify parent when statsBookings **content** changes    │
       ╰─────────────────────────────────────────────────────────╯ */
    useEffect(() => {
        onWindowChange(statsBookings);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statsBookings]);         // safe – memo gives stable reference unless real diff

    const totalBookings = statsBookings.length;
    const totalClients  = statsBookings.reduce(
        (sum, b) => sum + (b.total_adults || 0) + (b.total_kids || 0),
        0
    );

    /* ╭─────────────────────────────────────────────────────────╮
       │ Fetch table availability for the visible window         │
       ╰─────────────────────────────────────────────────────────╯ */

    /*  stringify dates so dependency identity is stable  */
    const viewWinStart = useMemo(
        () =>
            view === "calendar"
                ? startOfMonth(addDays(today, offset))
                : compactStart,
        [view, today, offset, compactStart]
    );
    const viewWinEnd = useMemo(
        () =>
            view === "calendar"
                ? endOfMonth(viewWinStart)
                : compactEnd,
        [view, viewWinStart, compactEnd]
    );
    const winStartStr = ymd(viewWinStart);
    const winEndStr   = ymd(viewWinEnd);

    useEffect(() => {
        let cancelled = false;
        setLoadingTA(true);

        Promise.all([
            fetchTableAvailabilityRange(winStartStr, winEndStr, "lunch"),
            fetchTableAvailabilityRange(winStartStr, winEndStr, "dinner"),
        ])
            .then(([lunch, dinner]) => {
                if (cancelled) return;
                /* merge */
                const merged = {};
                [lunch, dinner].forEach((src) =>
                    Object.entries(src).forEach(([d, info]) => {
                        merged[d] = merged[d] ? { ...merged[d], ...info } : info;
                    })
                );
                setTA(merged);
            })
            .catch(() => !cancelled && setTA({}))
            .finally(() => !cancelled && setLoadingTA(false));

        return () => void (cancelled = true);
    }, [winStartStr, winEndStr, view]);  // ← primitive deps, no endless loop

    /* ensure TA for drilled-in day inside calendar view (once) */
    useEffect(() => {
        if (!selDay || view !== "calendar") return;
        const key = ymd(selDay);
        if (ta[key]) return; // already present

        (async () => {
            try {
                const [lunch, dinner] = await Promise.all([
                    fetchTableAvailabilityRange(key, key, "lunch"),
                    fetchTableAvailabilityRange(key, key, "dinner"),
                ]);
                setTA((prev) => ({
                    ...prev,
                    [key]: { ...(lunch[key] || {}), ...(dinner[key] || {}) },
                }));
            } catch {
                /* swallow */
            }
        })();
    }, [selDay, view, ta]);

    /* manual booking saved → refresh full page */
    const handleSaved = () => {
        setShowModal(false);
        window.location.reload();
    };

    /* ───────── UI ───────── */
    return (
        <div className="p-6 bg-white rounded shadow space-y-6">
            {/* header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold capitalize">
                        {t(`overview.${mode}Bookings`)}
                    </h2>
                    <p className="text-sm text-gray-500">
                        {t("overview.dataWindow", {
                            start: winStartStr,
                            end:   winEndStr,
                        })}
                    </p>
                </div>

                <select
                    className="border rounded p-1"
                    value={view}
                    onChange={(e) => setView(e.target.value)}
                >
                    <option value="compact">{t("admin.compact")}</option>
                    <option value="calendar">{t("admin.calendar")}</option>
                </select>
            </div>

            {/* stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded text-center">
                    <p className="text-xs text-gray-600">
                        {t("overview.bookings30d")}
                    </p>
                    <p className="text-xl font-bold">{totalBookings}</p>
                </div>
                <div className="bg-green-50 p-3 rounded text-center">
                    <p className="text-xs text-gray-600">
                        {t("overview.guests30d")}
                    </p>
                    <p className="text-xl font-bold">{totalClients}</p>
                </div>
            </div>

            {/* list view */}
            {view === "compact" ? (
                <BookingsCompactView
                    mode={mode}
                    rangeDays={rangeDays}
                    offset={offset}
                    onOffsetChange={setOffset}
                    selectedDate={allowDrill ? selDay : null}
                    onSelectDay={allowDrill ? setSelDay : () => {}}
                    bookings={statsBookings}
                />
            ) : (
                <BookingsCalendarView
                    selectedDate={allowDrill ? selDay : null}
                    onSelectDay={allowDrill ? setSelDay : () => {}}
                    bookings={calendarBookings}
                />
            )}

            {/* chart */}
            {showChart && (
                <BookingsChart
                    key={`${mode}-${offset}-${view}`}
                    bookings={statsBookings}
                    startDate={compactStart}
                    days={rangeDays}
                />
            )}

            {/* drill-in panel */}
            {allowDrill && selDay && (
                <div className="mt-4 relative">
                    {mode === "future" && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="absolute right-0 -top-10 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            {t("admin.manualBooking")}
                        </button>
                    )}
                    <DaySchedule
                        selectedDate={selDay}
                        bookings={bookings}
                        tableAvailability={ta}
                        onClose={() => setSelDay(null)}
                        enableZoom
                    />
                </div>
            )}

            {/* manual-add modal */}
            {allowDrill && showModal && selDay && (
                <AddBookingModal
                    dateObj={selDay}
                    onClose={() => setShowModal(false)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}

BookingsOverview.propTypes = {
    mode:            PropTypes.oneOf(["future", "past"]).isRequired,
    bookings:        PropTypes.arrayOf(PropTypes.object).isRequired,
    showChart:       PropTypes.bool,
    allowDrill:      PropTypes.bool,
    onWindowChange:  PropTypes.func,
};
