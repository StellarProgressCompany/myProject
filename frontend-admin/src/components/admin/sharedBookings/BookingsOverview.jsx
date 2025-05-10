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
    differenceInCalendarDays,
} from "date-fns";

import { fetchTableAvailabilityRange } from "../../../services/bookingService";
import BookingsCompactView  from "./BookingsCompactView";
import BookingsCalendarView from "./BookingsCalendarView";
import BookingsChart        from "./BookingsChart";
import DaySchedule          from "./DaySchedule";
import AddBookingModal      from "../currentBookings/AddBookingModal";
import EditBookingModal     from "../currentBookings/EditBookingModal";   // ← NEW
import { translate, getLanguage } from "../../../services/i18n";

/* helper – stable “YYYY-MM-DD” */
const ymd = (d) => format(d, "yyyy-MM-dd");

/* ────────────────────────────────────────────────────────────────
   Segmented-control toggle
   ────────────────────────────────────────────────────────────────*/
function ViewToggle({ value, onChange }) {
    const t = (k, p) => translate(getLanguage(), k, p);
    const opts = [
        { key: "compact",  label: t("admin.compact")  },
        { key: "calendar", label: t("admin.calendar") },
    ];
    return (
        <div className="inline-flex bg-gray-100 rounded-full p-1 shadow-inner">
            {opts.map(({ key, label }) => (
                <button
                    key={key}
                    onClick={() => onChange(key)}
                    className={`px-4 py-1 text-sm font-medium rounded-full transition ${
                        value === key
                            ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow"
                            : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
ViewToggle.propTypes = { value: PropTypes.string.isRequired, onChange: PropTypes.func.isRequired };

export default function BookingsOverview({
                                             mode,
                                             bookings,
                                             showChart      = true,
                                             allowDrill     = true,
                                             view: controlledView,
                                             hideViewToggle = false,
                                             onViewChange   = () => {},
                                             onWindowChange = () => {},
                                             customTitle    = null,
                                         }) {
    /* i18n */
    const t = (k, v) => translate(getLanguage(), k, v);

    /* constants */
    const rangeDays = 7;
    const today     = useMemo(() => startOfDay(new Date()), []);

    /* ─────── view / window state ─────── */
    const [viewState, setViewState] = useState("compact");
    const view = controlledView ?? viewState;
    const changeView = (v) => {
        if (controlledView !== undefined) onViewChange(v);
        else setViewState(v);
    };

    /* compact offset (days); calendar uses month instead */
    const [offset, setOffset] = useState(0);

    /* month being shown in calendar view (1st of month) */
    const [calMonth, setCalMonth] = useState(startOfMonth(today));

    /* day selected for drill-down */
    const [selDay, setSelDay] = useState(null);

    /* table-availability cache */
    const [ta, setTA]       = useState({});
    const [loadingTA, setL] = useState(false);

    /* CLOSED days list */
    const [closedDays, setClosedDays] = useState([]);
    useEffect(() => {
        fetch("/api/closed-days")
            .then((r) => r.json())
            .then((arr) => Array.isArray(arr) && setClosedDays(arr))
            .catch(() => setClosedDays([]));
    }, []);

    /* ─────── window boundaries ─────── */
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

    const viewWinStart = useMemo(
        () => (view === "calendar" ? calMonth : compactStart),
        [view, calMonth, compactStart]
    );
    const viewWinEnd = useMemo(
        () => (view === "calendar" ? endOfMonth(calMonth) : compactEnd),
        [view, calMonth, compactEnd]
    );

    /* slices for current window --------------------------------- */
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
                return mode === "future" ? d >= today : d < today;
            }),
        [bookings, mode, today]
    );

    const statsBookings = useMemo(
        () =>
            view === "calendar"
                ? calendarBookings.filter((b) => {
                    const d = parseISO(b.table_availability?.date || b.date);
                    return d >= viewWinStart && d <= viewWinEnd;
                })
                : compactFiltered,
        [view, calendarBookings, compactFiltered, viewWinStart, viewWinEnd]
    );

    useEffect(() => {
        onWindowChange(statsBookings);
    }, [statsBookings]);

    /* KPI counters */
    const totalBookings = statsBookings.length;
    const totalClients = statsBookings.reduce(
        (s, b) => s + (b.total_adults || 0) + (b.total_kids || 0),
        0
    );

    /* ─────── table-availability fetch ─────── */
    const winStartStr = ymd(viewWinStart);
    const winEndStr = ymd(viewWinEnd);

    useEffect(() => {
        let cancelled = false;
        setL(true);
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
            .finally(() => !cancelled && setL(false));
        return () => {
            cancelled = true;
        };
    }, [winStartStr, winEndStr, view]);

    /* manual-add */
    const [showModal, setShowModal] = useState(false);
    const handleSaved = () => {
        setShowModal(false);
        window.location.reload();
    };

    /* editing booking */
    const [editingBooking, setEditingBooking] = useState(null);
    const handleEditSaved = () => {
        setEditingBooking(null);
        window.location.reload();
    };

    /* ─────── chart start / length ─────── */
    const chartStart = view === "calendar" ? viewWinStart : compactStart;
    const chartDays =
        view === "calendar"
            ? differenceInCalendarDays(viewWinEnd, viewWinStart) + 1
            : rangeDays;

    /* ─────── UI ─────── */
    return (
        <div className="p-6 bg-white rounded shadow space-y-6">
            {/* header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold capitalize">
                        {customTitle || t(`overview.${mode}Bookings`)}
                    </h2>
                    <p className="text-sm text-gray-500">
                        {t("overview.dataWindow", {
                            start: ymd(viewWinStart),
                            end: ymd(viewWinEnd),
                        })}
                    </p>
                </div>
                {!hideViewToggle && (
                    <ViewToggle value={view} onChange={changeView} />
                )}
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded text-center">
                    <p className="text-xs text-gray-600">
                        {t("overview.bookings")}
                    </p>
                    <p className="text-xl font-bold">{totalBookings}</p>
                </div>
                <div className="bg-green-50 p-3 rounded text-center">
                    <p className="text-xs text-gray-600">
                        {t("overview.guests")}
                    </p>
                    <p className="text-xl font-bold">{totalClients}</p>
                </div>
            </div>

            {/* main view */}
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
                    month={calMonth}
                    onMonthChange={(m) => setCalMonth(startOfMonth(m))}
                    selectedDate={allowDrill ? selDay : null}
                    onSelectDay={allowDrill ? setSelDay : () => {}}
                    bookings={calendarBookings}
                    closedDays={closedDays}
                />
            )}

            {/* chart */}
            {showChart && (
                <BookingsChart
                    key={`${mode}-${offset}-${view}-${chartStart.toISOString()}`}
                    bookings={statsBookings}
                    startDate={chartStart}
                    days={chartDays}
                />
            )}

            {/* drill-down schedule */}
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
                        onBookingClick={setEditingBooking}
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

            {/* edit modal */}
            {allowDrill && editingBooking && (
                <EditBookingModal
                    booking={editingBooking}
                    onClose={() => setEditingBooking(null)}
                    onSaved={handleEditSaved}
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
    customTitle:     PropTypes.string,
};
