// frontend/src/components/admin/settings/OperationalSettings.jsx
import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
} from "react";
import { format }          from "date-fns";
import toast, { Toaster }   from "react-hot-toast";

import BookingsCalendarView       from "../sharedBookings/BookingsCalendarView";
import SkeletonCalendar           from "./SkeletonCalendar.jsx"

import {
    clearAvailabilityCache,
} from "../../../services/bookingService";
import {
    getDayMealTypes,
} from "../../../services/datePicker";
import {
    fetchMealOverrides,
    toggleMealOverride,
} from "../../../services/mealOverrides";

import { translate, getLanguage } from "../../../services/i18n";

/* ────── simple fetch helpers for open / close endpoints ────── */
async function toggleClosedDay(dateYMD) {
    await fetch("/api/closed-days/toggle", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ date: dateYMD }),
    });
}
async function toggleOpenDay(dateYMD) {
    await fetch("/api/open-days/toggle", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ date: dateYMD }),
    });
}
async function fetchClosedDays() {
    const r = await fetch("/api/closed-days");
    const j = await r.json();
    return Array.isArray(j) ? j.map((d) => d.slice(0, 10)) : [];
}
async function fetchOpenDays() {
    const r = await fetch("/api/open-days");
    const j = await r.json();
    return Array.isArray(j) ? j.map((d) => d.slice(0, 10)) : [];
}

/* ──────────────────────────────────────────────────────────────
   UI helpers
────────────────────────────────────────────────────────────────*/
function PillButton({
                        label,
                        colour,           // "green" | "red" | "gray"
                        onClick,
                        disabled = false,
                    }) {
    const colours = {
        green: "bg-green-600 hover:bg-green-700",
        red  : "bg-red-600 hover:bg-red-700",
        gray : "bg-gray-200 hover:bg-gray-300 text-gray-600",
    };
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`px-4 py-2 rounded shadow text-white font-medium disabled:opacity-50 ${colours[colour]}`}
        >
            {label}
        </button>
    );
}

function MealToggle({
                        label,
                        isOpen,
                        onToggle,
                    }) {
    return (
        <button
            onClick={onToggle}
            className={`
        min-w-[110px] py-3 rounded text-white font-semibold shadow
        ${isOpen ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"}
      `}
        >
            {label}
        </button>
    );
}

/* ──────────────────────────────────────────────────────────────
   Main component
────────────────────────────────────────────────────────────────*/
export default function OperationalSettings({
                                                bookings = [],
                                                onRefresh = () => {},
                                            }) {
    const t = (k, p) => translate(getLanguage(), k, p);

    /* ─── local state ─── */
    const [selDate,         setSelDate] = useState(null);
    const [closedDays,      setClosed]  = useState([]);
    const [openDays,        setOpen]    = useState([]);
    const [mealOverrides,   setMealOv]  = useState([]);
    const [loading,         setLoad]    = useState(true);

    /* ─── pull future bookings for the calendar ─── */
    const todayYMD = new Date().toISOString().slice(0, 10);
    const futureBookings = useMemo(
        () =>
            bookings.filter((b) => {
                const d = (b.table_availability?.date || b.date || "").slice(0, 10);
                return d >= todayYMD;
            }),
        [bookings, todayYMD]
    );

    /* ─── remote fetch helpers ─── */
    const refreshClosed = useCallback(
        async () => setClosed(await fetchClosedDays()),
        []
    );
    const refreshOpen   = useCallback(
        async () => setOpen(await fetchOpenDays()),
        []
    );
    const refreshMealOv = useCallback(
        async () => setMealOv(await fetchMealOverrides()),
        []
    );

    /* ─── initial load ─── */
    useEffect(() => {
        (async () => {
            setLoad(true);
            await Promise.all([refreshClosed(), refreshOpen(), refreshMealOv()]);
            setLoad(false);
        })();
    }, [refreshClosed, refreshOpen, refreshMealOv]);

    /* ─── derive status for the selected day ─── */
    const ymdKey = selDate && format(selDate, "yyyy-MM-dd");

    const scheduleMeals    = selDate ? getDayMealTypes(selDate.getDay()) : [];
    const scheduleIsClosed = scheduleMeals.length === 0;

    const exceptionallyClosed = selDate && closedDays.includes(ymdKey);
    const exceptionallyOpen   = selDate && openDays.includes(ymdKey);

    const mealRow =
        mealOverrides.find((row) => row.date === ymdKey) || {};
    const lunchClosed  = !!mealRow.lunch_closed;
    const dinnerClosed = !!mealRow.dinner_closed;

    /* master flags */
    const dayIsClosed =
        (scheduleIsClosed && !exceptionallyOpen) ||
        exceptionallyClosed ||
        (lunchClosed && dinnerClosed);

    const dayIsOpen = !dayIsClosed;

    /* ─── action wrappers with toast feedback ─── */
    const withToast = (label, fn) => async () => {
        const id = toast.loading(label);
        try {
            await fn();
            await Promise.all([refreshClosed(), refreshOpen(), refreshMealOv()]);
            await onRefresh();
            clearAvailabilityCache();
            toast.success(t("settings.done"), { id });
        } catch (e) {
            console.error(e);
            toast.error(e?.response?.data?.error || "Error", { id });
        }
    };

    /* ─── handlers ─── */
    const handleToggleDay = withToast(
        dayIsClosed ? t("settings.opening") : t("settings.closing"),
        async () => {
            if (dayIsClosed) {
                await toggleOpenDay(ymdKey);
            } else {
                await toggleClosedDay(ymdKey);
            }
        }
    );

    const handleToggleLunch = withToast(
        lunchClosed ? t("settings.opening") : t("settings.closing"),
        async () => {
            await toggleMealOverride(ymdKey, "lunch");
        }
    );

    const handleToggleDinner = withToast(
        dinnerClosed ? t("settings.opening") : t("settings.closing"),
        async () => {
            await toggleMealOverride(ymdKey, "dinner");
        }
    );

    /* ─── closed colouring for calendar ─── */
    const closedEffective = [
        ...closedDays.filter((d) => !openDays.includes(d)),
        ...mealOverrides
            .filter((o) => o.lunch_closed && o.dinner_closed)
            .map((o) => o.date),
    ];

    /* ─── UI ─── */
    return (
        <div className="relative space-y-6">
            {/* react-hot-toast needs one toaster host */}
            <Toaster position="top-center" />

            {loading ? (
                <SkeletonCalendar />
            ) : (
                <BookingsCalendarView
                    month={new Date()}
                    onMonthChange={() => {}}
                    selectedDate={selDate}
                    onSelectDay={setSelDate}
                    bookings={futureBookings}
                    closedDays={closedEffective}
                    openDays={openDays}
                />
            )}

            {/* info + actions for the selected date */}
            {selDate && (
                <div className="bg-white rounded shadow p-6 space-y-6">
                    {/* headline */}
                    <div className="flex items-start justify-between">
                        <h2 className="text-xl font-bold">
                            {format(selDate, "PPPP")}
                        </h2>
                        <button
                            className="text-red-600 underline"
                            onClick={() => setSelDate(null)}
                        >
                            {t("admin.close")}
                        </button>
                    </div>

                    {/* DAY status + toggle */}
                    <div className="flex items-center gap-4">
            <span
                className={`
                font-semibold
                ${dayIsOpen ? "text-green-600" : "text-red-600"}
              `}
            >
              {dayIsOpen
                  ? t("settings.open") + " "
                  : t("settings.closed") + " "}
                ({t("settings.clickToToggle") || "clic per tancar"})
            </span>

                        <PillButton
                            label={
                                dayIsOpen
                                    ? t("settings.closeDay")
                                    : t("settings.openDay")
                            }
                            colour={dayIsOpen ? "red" : "green"}
                            onClick={handleToggleDay}
                        />
                    </div>

                    {/* Meal toggles – only when the *day* is open */}
                    {dayIsOpen && (
                        <>
                            <hr />

                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Lunch */}
                                {scheduleMeals.includes("lunch") && (
                                    <MealToggle
                                        label={
                                            lunchClosed
                                                ? t("settings.openLunch") || "Obrir Dinar"
                                                : t("settings.closeLunch") || "Tancar Dinar"
                                        }
                                        isOpen={!lunchClosed}
                                        onToggle={handleToggleLunch}
                                    />
                                )}

                                {/* Dinner */}
                                {scheduleMeals.includes("dinner") && (
                                    <MealToggle
                                        label={
                                            dinnerClosed
                                                ? t("settings.openDinner") || "Obrir Sopar"
                                                : t("settings.closeDinner") || "Tancar Sopar"
                                        }
                                        isOpen={!dinnerClosed}
                                        onToggle={handleToggleDinner}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
