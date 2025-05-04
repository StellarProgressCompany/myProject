import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BookingsCalendarView from "../sharedBookings/BookingsCalendarView";
import {
    closeSpecificDay,
    openBookingWindowUntil,
} from "../../../services/settingsService.js";
import { translate } from "../../../services/i18n";

/**
 * ✔ little tick after a successful action
 */
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

/**
 * ▶ animated progress button
 */
function ProgressButton({
                            colour = "blue",
                            idleLabel,
                            loadingLabel,
                            successLabel,
                            onClick,
                        }) {
    const [state, setState] = useState("idle"); // idle | loading | success
    const [progress, setProgress] = useState(0);
    const timerRef = React.useRef(null);

    React.useEffect(() => {
        if (state !== "loading") return;
        timerRef.current = setInterval(() => {
            setProgress((p) => (p < 95 ? p + 1 : p));
        }, 25);
        return () => clearInterval(timerRef.current);
    }, [state]);

    const start = () => {
        setProgress(0);
        setState("loading");
    };
    const finish = () => {
        clearInterval(timerRef.current);
        setProgress(100);
        setState("success");
        setTimeout(() => {
            setState("idle");
            setProgress(0);
        }, 1500);
    };

    const handleClick = async () => {
        if (state === "loading") return;
        try {
            start();
            await onClick();
            finish();
        } catch (e) {
            clearInterval(timerRef.current);
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
            onClick={handleClick}
            disabled={state === "loading"}
            className={`relative flex-1 px-4 py-2 rounded text-white font-medium disabled:opacity-60 ${colourClasses}`}
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

/**
 * Operational settings panel
 */
export default function OperationalSettings({ bookings = [] }) {
    const [lang] = useState(() => localStorage.getItem("adminLang") || "ca");
    const t = (k, v) => translate(lang, k, v);

    const [selDate, setSelDate] = useState(null);
    const [blip, setBlip] = useState(null);

    // filter to only today or future bookings for calendar badges
    const todayYMD = new Date().toISOString().slice(0, 10);
    const futureBookings = bookings.filter((b) => {
        const d = (b.table_availability?.date || b.date || "").slice(0, 10);
        return d >= todayYMD;
    });

    const closeDay = async () => {
        if (!selDate) return;
        await closeSpecificDay(selDate.toISOString().slice(0, 10));
        setBlip("close");
        setTimeout(() => setBlip(null), 1600);
    };

    const openWindow = async () => {
        if (!selDate) return;
        await openBookingWindowUntil(selDate.toISOString().slice(0, 10));
        setBlip("open");
        setTimeout(() => setBlip(null), 1600);
    };

    return (
        <div className="relative space-y-6">
            {blip && <SuccessTick id={blip} />}

            <BookingsCalendarView
                selectedDate={selDate}
                onSelectDay={setSelDate}
                bookings={futureBookings}
            />

            <div className="flex gap-4">
                <ProgressButton
                    colour="red"
                    idleLabel={t("settings.closeDay")}
                    loadingLabel={t("settings.closed")}
                    successLabel={t("settings.successClosed")}
                    onClick={closeDay}
                />

                <ProgressButton
                    colour="blue"
                    idleLabel={t("settings.openUntil")}
                    loadingLabel={t("settings.save")}
                    successLabel={t("settings.successWindow")}
                    onClick={openWindow}
                />
            </div>
        </div>
    );
}
