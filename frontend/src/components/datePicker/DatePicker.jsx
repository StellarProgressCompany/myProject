import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import {
    format,
    addDays,
    startOfMonth,
    endOfMonth,
} from "date-fns";

import Compact from "./Compact";
import Calendar from "./Calendar";
import SkeletonCompact from "./SkeletonCompact";
import SkeletonCalendar from "./SkeletonCalendar";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export default function DatePicker({
                                       selectedDate = null,          // ← default moved here
                                       onDateSelect,
                                   }) {
    const [viewMode, setViewMode] = useState("compact");
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [availabilityMap, setAvailabilityMap] = useState({});
    const [isFetchingRange, setIsFetchingRange] = useState(false);
    const [closedDays, setClosedDays] = useState([]);

    const today = new Date();
    const maxDate = addDays(today, 30);

    // ─── fetch exceptional closed days ──────────────────────
    useEffect(() => {
        (async () => {
            try {
                const { data } = await axios.get(`${API_URL}/closed-days`);
                const normalized = Array.isArray(data)
                    ? data.map((d) => d.slice(0, 10))
                    : [];
                setClosedDays(normalized);
            } catch (e) {
                console.error("Failed to fetch closed days:", e);
            }
        })();
    }, []);

    // ─── compact → next 7 days ─────────────────────────────
    useEffect(() => {
        if (viewMode !== "compact") return;
        (async () => {
            setIsFetchingRange(true);
            try {
                const start = format(today, "yyyy-MM-dd");
                const end = format(addDays(today, 6), "yyyy-MM-dd");
                const [lunchRes, dinnerRes] = await Promise.all([
                    axios.get(`${API_URL}/table-availability-range`, {
                        params: { start, end, mealType: "lunch" },
                    }),
                    axios.get(`${API_URL}/table-availability-range`, {
                        params: { start, end, mealType: "dinner" },
                    }),
                ]);

                const mapCopy = { ...availabilityMap };
                Object.entries(lunchRes.data).forEach(([d, info]) => {
                    mapCopy[`${d}_lunch`] = info === "closed" ? null : info;
                });
                Object.entries(dinnerRes.data).forEach(([d, info]) => {
                    mapCopy[`${d}_dinner`] = info === "closed" ? null : info;
                });
                setAvailabilityMap(mapCopy);
            } catch (e) {
                console.error("Failed fetch 7d:", e);
            } finally {
                setIsFetchingRange(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode]);

    // ─── calendar → full month ─────────────────────────────
    useEffect(() => {
        if (viewMode !== "calendar") return;
        (async () => {
            setIsFetchingRange(true);
            try {
                const ms = format(startOfMonth(currentMonth), "yyyy-MM-dd");
                const me = format(endOfMonth(currentMonth), "yyyy-MM-dd");
                const [lunchRes, dinnerRes] = await Promise.all([
                    axios.get(`${API_URL}/table-availability-range`, {
                        params: { start: ms, end: me, mealType: "lunch" },
                    }),
                    axios.get(`${API_URL}/table-availability-range`, {
                        params: { start: ms, end: me, mealType: "dinner" },
                    }),
                ]);

                const mapCopy = { ...availabilityMap };
                Object.entries(lunchRes.data).forEach(([d, info]) => {
                    mapCopy[`${d}_lunch`] = info === "closed" ? null : info;
                });
                Object.entries(dinnerRes.data).forEach(([d, info]) => {
                    mapCopy[`${d}_dinner`] = info === "closed" ? null : info;
                });
                setAvailabilityMap(mapCopy);
            } catch (e) {
                console.error("Failed month fetch:", e);
            } finally {
                setIsFetchingRange(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode, currentMonth]);

    return (
        <div className="date-picker">
            {/* view-mode toggle */}
            <div className="flex justify-end mb-2">
                <button
                    onClick={() =>
                        setViewMode((prev) =>
                            prev === "compact" ? "calendar" : "compact"
                        )
                    }
                    className="text-sm underline focus:outline-none"
                >
                    {viewMode === "compact" ? "Calendar View" : "Compact View"}
                </button>
            </div>

            {/* skeletons vs. real views */}
            {isFetchingRange ? (
                viewMode === "compact" ? (
                    <SkeletonCompact />
                ) : (
                    <SkeletonCalendar />
                )
            ) : viewMode === "compact" ? (
                <Compact
                    today={today}
                    maxDate={maxDate}
                    selectedDate={selectedDate}
                    onDateSelect={onDateSelect}
                    availabilityMap={availabilityMap}
                    closedDays={closedDays}
                />
            ) : (
                <Calendar
                    currentMonth={currentMonth}
                    setCurrentMonth={setCurrentMonth}
                    today={today}
                    maxDate={maxDate}
                    selectedDate={selectedDate}
                    onDateSelect={onDateSelect}
                    availabilityMap={availabilityMap}
                    closedDays={closedDays}
                />
            )}
        </div>
    );
}

DatePicker.propTypes = {
    selectedDate: PropTypes.instanceOf(Date),
    onDateSelect: PropTypes.func.isRequired,
};
