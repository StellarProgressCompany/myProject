import React, { useEffect, useState } from "react";
import { format, addDays, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";
import axios from "axios";

// Sub-components (or could be inline if you prefer)
import CompactView from "./CompactView";
import CalendarView from "./CalendarView";
import SkeletonCompact from "./SkeletonCompact";
import SkeletonCalendar from "./SkeletonCalendar";

// Suppose your backend is at:
const API_URL = "http://127.0.0.1:8000/api";

export default function DatePicker({ selectedDate, onDateSelect }) {
    const [viewMode, setViewMode] = useState("compact"); // "compact" or "calendar"
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [availabilityMap, setAvailabilityMap] = useState({});

    const [isFetchingRange, setIsFetchingRange] = useState(false);

    const today = new Date();
    const maxDate = addDays(today, 30); // 30 days from now

    // -- In "compact" mode, fetch next 7 days (both lunch & dinner).
    useEffect(() => {
        if (viewMode !== "compact") return;

        async function loadNext7Days() {
            try {
                setIsFetchingRange(true);

                const startStr = format(today, "yyyy-MM-dd");
                const endStr = format(addDays(today, 6), "yyyy-MM-dd");

                // 1) Fetch lunch
                const [respLunch, respDinner] = await Promise.all([
                    axios.get(`${API_URL}/table-availability-range`, {
                        params: { start: startStr, end: endStr, mealType: "lunch" },
                    }),
                    axios.get(`${API_URL}/table-availability-range`, {
                        params: { start: startStr, end: endStr, mealType: "dinner" },
                    }),
                ]);

                const mapCopy = { ...availabilityMap };

                // Merge lunch data
                // respLunch.data is an object keyed by date: { "2025-02-24": {...} | "closed" }
                Object.entries(respLunch.data).forEach(([dateStr, dayData]) => {
                    const keyLunch = dateStr + "_lunch";
                    mapCopy[keyLunch] = dayData === "closed" ? null : dayData;
                });

                // Merge dinner data
                Object.entries(respDinner.data).forEach(([dateStr, dayData]) => {
                    const keyDinner = dateStr + "_dinner";
                    mapCopy[keyDinner] = dayData === "closed" ? null : dayData;
                });

                setAvailabilityMap(mapCopy);
            } catch (err) {
                console.error("Failed to fetch 7-day range:", err);
            } finally {
                setIsFetchingRange(false);
            }
        }

        loadNext7Days();
    }, [viewMode]);

    // -- In "calendar" mode, fetch entire month (both lunch & dinner).
    useEffect(() => {
        if (viewMode !== "calendar") return;

        async function loadMonth() {
            try {
                setIsFetchingRange(true);

                const monthStartStr = format(startOfMonth(currentMonth), "yyyy-MM-dd");
                const monthEndStr = format(endOfMonth(currentMonth), "yyyy-MM-dd");

                // 2) Similar approach: fetch both lunch + dinner
                const [respLunch, respDinner] = await Promise.all([
                    axios.get(`${API_URL}/table-availability-range`, {
                        params: { start: monthStartStr, end: monthEndStr, mealType: "lunch" },
                    }),
                    axios.get(`${API_URL}/table-availability-range`, {
                        params: { start: monthStartStr, end: monthEndStr, mealType: "dinner" },
                    }),
                ]);

                const mapCopy = { ...availabilityMap };

                Object.entries(respLunch.data).forEach(([dateStr, dayData]) => {
                    const keyLunch = dateStr + "_lunch";
                    mapCopy[keyLunch] = dayData === "closed" ? null : dayData;
                });
                Object.entries(respDinner.data).forEach(([dateStr, dayData]) => {
                    const keyDinner = dateStr + "_dinner";
                    mapCopy[keyDinner] = dayData === "closed" ? null : dayData;
                });

                setAvailabilityMap(mapCopy);
            } catch (err) {
                console.error("Failed to fetch month range:", err);
            } finally {
                setIsFetchingRange(false);
            }
        }

        loadMonth();
    }, [viewMode, currentMonth]);

    return (
        <div className="date-picker">
            {/* Toggle between compact & calendar */}
            <div className="flex justify-end mb-2">
                <button
                    onClick={() =>
                        setViewMode((prev) => (prev === "compact" ? "calendar" : "compact"))
                    }
                    className="text-sm underline focus:outline-none"
                >
                    {viewMode === "compact" ? "Calendar View" : "Compact View"}
                </button>
            </div>

            {isFetchingRange ? (
                // Show skeleton placeholders while fetching
                viewMode === "compact" ? <SkeletonCompact /> : <SkeletonCalendar />
            ) : (
                // After fetch, show normal views
                <>
                    {viewMode === "compact" ? (
                        <CompactView
                            today={today}
                            maxDate={maxDate}
                            selectedDate={selectedDate}
                            onDateSelect={onDateSelect}
                            availabilityMap={availabilityMap}
                        />
                    ) : (
                        <CalendarView
                            currentMonth={currentMonth}
                            setCurrentMonth={setCurrentMonth}
                            today={today}
                            maxDate={maxDate}
                            selectedDate={selectedDate}
                            onDateSelect={onDateSelect}
                            availabilityMap={availabilityMap}
                        />
                    )}
                </>
            )}
        </div>
    );
}
