// frontend/src/components/admin/sharedBookings/BookingsOverview.jsx
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
import BookingsCompactView  from "./BookingsCompactView";
import BookingsCalendarView from "./BookingsCalendarView";
import BookingsChart        from "./BookingsChart";
import DaySchedule          from "./DaySchedule";
import AddBookingModal      from "../currentBookings/AddBookingModal";
import { translate, getLanguage } from "../../../services/i18n";

/* helper – stable “YYYY-MM-DD” */
const ymd = (d) => format(d, "yyyy-MM-dd");

export default function BookingsOverview({
                                             mode,               // "future" | "past"
                                             bookings,
                                             showChart        = true,
                                             allowDrill       = true,
                                             view:            controlledView,
                                             hideViewToggle   = false,
                                             onViewChange     = () => {},
                                             onWindowChange   = () => {},
                                         }) {
    /* ────── i18n ────── */
    const lang = getLanguage();
    const t    = (k, v) => translate(lang, k, v);

    /* ────── constants ────── */
    const rangeDays = 7;
    const today     = useMemo(() => startOfDay(new Date()), []);

    /* ────── local state ────── */
    const [viewState, setViewState]   = useState("compact");
    const view = controlledView ?? viewState;

    const changeView = (v) => {
        if (controlledView !== undefined) onViewChange(v);
        else                              setViewState(v);
    };

    const [offset,    setOffset]    = useState(0);
    const [selDay,    setSelDay]    = useState(null);
    const [ta,        setTA]        = useState({});
    const [loadingTA, setLoadingTA] = useState(false);

    /* CLOSED-DAYS support */
    const [closedDays, setClosedDays] = useState([]);

    useEffect(() => {
        fetch("/api/closed-days")
            .then((r) => r.json())
            .then((arr) => Array.isArray(arr) && setClosedDays(arr))
            .catch(() => setClosedDays([]));
    }, []);

    /* ────── window boundaries ────── */
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

    /* helpers */
    const inFuture = (d) => d >= today;
    const inPast   = (d) => d <  today;

    /* bookings slices */
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

    const statsBookings = view === "calendar" ? calendarBookings : compactFiltered;

    /* notify parent */
    useEffect(() => { onWindowChange(statsBookings); }, [statsBookings]); // eslint-disable-line

    /* KPI counters */
    const totalBookings = statsBookings.length;
    const totalClients  = statsBookings.reduce(
        (sum, b) => sum + (b.total_adults || 0) + (b.total_kids || 0),
        0
    );

    /* ────── table-availability payload for the visible window ────── */
    const viewWinStart = useMemo(
        () =>
            view === "calendar" ? startOfMonth(addDays(today, offset)) : compactStart,
        [view, today, offset, compactStart]
    );
    const viewWinEnd   = useMemo(
        () => (view === "calendar" ? endOfMonth(viewWinStart) : compactEnd),
        [view, viewWinStart, compactEnd]
    );
    const winStartStr  = ymd(viewWinStart);
    const winEndStr    = ymd(viewWinEnd);

    useEffect(() => {
        let cancelled = false;
        setLoadingTA(true);

        Promise.all([
            fetchTableAvailabilityRange(winStartStr, winEndStr, "lunch"),
            fetchTableAvailabilityRange(winStartStr, winEndStr, "dinner"),
        ])
            .then(([lunch, dinner]) => {
                if (cancelled) return;
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
    }, [winStartStr, winEndStr, view]);

    /* ensure TA present for drilled-in day */
    useEffect(() => {
        if (!selDay || view !== "calendar") return;
        const key = ymd(selDay);
        if (ta[key]) return;

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
            } catch {/* ignore */}
        })();
    }, [selDay, view, ta]);

    /* manual add */
    const [showModal, setShowModal] = useState(false);
    const handleSaved = () => { setShowModal(false); window.location.reload(); };

    /* ────── UI ────── */
    return (
        <div className="p-6 bg-white rounded shadow space-y-6">
            {/* header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold capitalize">
                        {t(`overview.${mode}Bookings`)}
                    </h2>
                    <p className="text-sm text-gray-500">
                        {t("overview.dataWindow", { start: winStartStr, end: winEndStr })}
                    </p>
                </div>

                {!hideViewToggle && (
                    <select
                        className="border rounded p-1"
                        value={view}
                        onChange={(e) => changeView(e.target.value)}
                    >
                        <option value="compact">{t("admin.compact")}</option>
                        <option value="calendar">{t("admin.calendar")}</option>
                    </select>
                )}
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded text-center">
                    <p className="text-xs text-gray-600">{t("overview.bookings")}</p>
                    <p className="text-xl font-bold">{totalBookings}</p>
                </div>
                <div className="bg-green-50 p-3 rounded text-center">
                    <p className="text-xs text-gray-600">{t("overview.guests")}</p>
                    <p className="text-xl font-bold">{totalClients}</p>
                </div>
            </div>

            {/* list / calendar */}
            {view === "compact" ? (
                <BookingsCompactView
                    mode={mode}
                    rangeDays={rangeDays}
                    offset={offset}
                    onOffsetChange={setOffset}
                    selectedDate={allowDrill ? selDay : null}
                    onSelectDay={allowDrill ? setSelDay : () => {}}
                    bookings={statsBookings}
                    closedDays={closedDays}
                />
            ) : (
                <BookingsCalendarView
                    selectedDate={allowDrill ? selDay : null}
                    onSelectDay={allowDrill ? setSelDay : () => {}}
                    bookings={calendarBookings}
                    closedDays={closedDays}
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

            {/* drilled-in schedule */}
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
    view:            PropTypes.oneOf(["compact", "calendar"]),
    hideViewToggle:  PropTypes.bool,
    onViewChange:    PropTypes.func,
    onWindowChange:  PropTypes.func,
};
