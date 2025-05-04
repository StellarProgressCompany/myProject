// frontend/src/components/admin/settings/OperationalSettings.jsx
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

import BookingsCalendarView from "../sharedBookings/BookingsCalendarView";
import { clearAvailabilityCache } from "../../../services/bookingService";
import { getDayMealTypes } from "../../../services/datePicker";
import { translate, getLanguage } from "../../../services/i18n";

/* HTTP helpers ───────────────────────────── */
async function toggleClosedDay(dateYMD) {
    await fetch("/api/closed-days/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateYMD }),
    });
}

async function toggleOpenDay(dateYMD) {
    await fetch("/api/open-days/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateYMD }),
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

/* ✔ little tick after a successful action */
const SuccessTick = ({ id }) => (
    <AnimatePresence mode="wait">
        <motion.div
            key={id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.25, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="absolute top-2 right-2 text-green-600 pointer-events-none select-none"
        >
            ✓
        </motion.div>
    </AnimatePresence>
);

/* ▶ Animated progress button (generic) */
function ProgressButton({
                            colour = "blue",
                            idleLabel,
                            loadingLabel,
                            successLabel,
                            onClick,
                            disabled = false,
                        }) {
    const [state, setState] = useState("idle"); // idle | loading | success
    const [progress, setProgress] = useState(0);
    const timer = React.useRef(null);

    React.useEffect(() => {
        if (state !== "loading") return;
        timer.current = setInterval(() => {
            setProgress((p) => (p < 95 ? p + 1 : p));
        }, 25);
        return () => clearInterval(timer.current);
    }, [state]);

    const start = () => {
        setProgress(0);
        setState("loading");
    };
    const finish = () => {
        clearInterval(timer.current);
        setProgress(100);
        setState("success");
        setTimeout(() => {
            setState("idle");
            setProgress(0);
        }, 1500);
    };

    const handle = async () => {
        if (state === "loading" || disabled) return;
        try {
            start();
            await onClick();
            finish();
        } catch (e) {
            clearInterval(timer.current);
            console.error(e);
            setState("idle");
            setProgress(0);
            alert(e?.response?.data?.error || "Action failed");
        }
    };

    const baseClr = state === "success" ? "green" : colour;
    const colourClasses = {
        blue: "bg-blue-600 hover:bg-blue-700",
        red: "bg-red-600 hover:bg-red-700",
        green: "bg-green-600 hover:bg-green-700",
    }[baseClr];

    return (
        <button
            onClick={handle}
            disabled={state === "loading" || disabled}
            className={`relative flex-1 px-4 py-2 rounded text-white font-medium disabled:opacity-50 ${colourClasses}`}
        >
      <span className="relative z-10">
        {state === "idle" && idleLabel}
          {state === "loading" && loadingLabel}
          {state === "success" && successLabel}
      </span>
            {state === "loading" && (
                <motion.span
                    style={{ scaleX: progress / 100 }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: progress / 100 }}
                    className="absolute inset-0 bg-white/30 origin-left rounded"
                />
            )}
        </button>
    );
}

/*──────────────────────────────────────────────
  Operational settings – Open / Close specific days
──────────────────────────────────────────────*/
export default function OperationalSettings({ bookings = [] }) {
    /* i18n */
    const lang = getLanguage();
    const t = (k, v) => translate(lang, k, v);

    /* component state */
    const [selDate, setSelDate] = useState(null);
    const [blip, setBlip] = useState(null);
    const [closedDays, setClosed] = useState([]);
    const [openDays, setOpen] = useState([]);

    /* future-bookings slice for calendar */
    const todayYMD = new Date().toISOString().slice(0, 10);
    const futureBookings = bookings.filter((b) => {
        const d = (b.table_availability?.date || b.date || "").slice(0, 10);
        return d >= todayYMD;
    });

    /* fetch helpers */
    const refreshClosed = useCallback(async () => {
        setClosed(await fetchClosedDays());
    }, []);
    const refreshOpen = useCallback(async () => {
        setOpen(await fetchOpenDays());
    }, []);

    useEffect(() => {
        refreshClosed();
        refreshOpen();
    }, [refreshClosed, refreshOpen]);

    /* derive flags */
    const ymd = selDate ? format(selDate, "yyyy-MM-dd") : null;
    const scheduleClosed =
        selDate && getDayMealTypes(selDate.getDay()).length === 0;
    const exceptionallyClosed = selDate && closedDays.includes(ymd);
    const exceptionallyOpen = selDate && openDays.includes(ymd);

    /* overall closed? */
    const isClosedNow =
        (scheduleClosed && !exceptionallyOpen) || exceptionallyClosed;

    /* filter out any “open” exceptions so they don’t stay red */
    const closedEffective = closedDays.filter((d) => !openDays.includes(d));

    /* permissions */
    const canClose =
        selDate && !exceptionallyClosed && !scheduleClosed;
    const canOpen =
        selDate &&
        ((scheduleClosed && !exceptionallyOpen) || exceptionallyClosed);

    /* handlers */
    const doClose = async () => {
        if (!selDate) return;
        await toggleClosedDay(ymd);
        await refreshClosed();
        clearAvailabilityCache();
        setBlip("close");
        setTimeout(() => setBlip(null), 1500);
    };
    const doOpen = async () => {
        if (!selDate) return;
        if (scheduleClosed && !exceptionallyOpen) {
            /* add open-exception */
            await toggleOpenDay(ymd);
            await refreshOpen();
        } else {
            /* undo manual close */
            await toggleClosedDay(ymd);
            await refreshClosed();
        }
        clearAvailabilityCache();
        setBlip("open");
        setTimeout(() => setBlip(null), 1500);
    };

    return (
        <div className="relative space-y-6">
            {blip && <SuccessTick id={blip} />}

            <BookingsCalendarView
                selectedDate={selDate}
                onSelectDay={setSelDate}
                bookings={futureBookings}
                closedDays={closedEffective}
                openDays={openDays}
            />

            <div className="flex gap-4">
                <ProgressButton
                    colour="red"
                    idleLabel={t("settings.closeDay")}
                    loadingLabel={t("settings.closing")}
                    successLabel={t("settings.successClosed")}
                    onClick={doClose}
                    disabled={!canClose}
                />
                <ProgressButton
                    colour="green"
                    idleLabel={t("settings.openDay")}
                    loadingLabel={t("settings.opening")}
                    successLabel={t("settings.successOpened")}
                    onClick={doOpen}
                    disabled={!canOpen}
                />
            </div>

            {selDate && (
                <p className="text-sm text-gray-600">
                    <strong>{format(selDate, "PPP")}</strong> –{" "}
                    {isClosedNow ? t("settings.closed") : t("settings.open")}
                </p>
            )}
        </div>
    );
}
