import React, { useState, useEffect } from "react";
import { format, parseISO, isValid, addMinutes } from "date-fns";
import {
    IconPlayerPlay,
    IconCheck,
    IconX,
    IconClock,
} from "@tabler/icons-react";
import {
    createBooking,
    fetchTableAvailabilityRange,
} from "../../../services/bookingService";
import DaySchedule from "../SharedBookings/DaySchedule";

export default function AlgorithmTester({ bookings = [], onRefresh }) {
    const todayISO = format(new Date(), "yyyy-MM-dd");
    const [sizesRaw, setSizesRaw] = useState("");
    const [dateStr, setDateStr] = useState(todayISO);
    const [meal, setMeal] = useState("lunch");
    const [time, setTime] = useState("13:00");
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState([]);
    const [ta, setTA] = useState({});
    const [loadingTA, setLoadingTA] = useState(false);

    const dateObj = isValid(parseISO(dateStr)) ? parseISO(dateStr) : null;

    const loadTA = async () => {
        if (!dateStr) return;
        setLoadingTA(true);
        try {
            const [lunch, dinner] = await Promise.all([
                fetchTableAvailabilityRange(dateStr, dateStr, "lunch"),
                fetchTableAvailabilityRange(dateStr, dateStr, "dinner"),
            ]);
            const merged = {};
            [lunch, dinner].forEach((src) =>
                Object.entries(src).forEach(([d, obj]) => {
                    merged[d] = merged[d] ? { ...merged[d], ...obj } : obj;
                })
            );
            setTA(merged);
        } catch {
            setTA({});
        } finally {
            setLoadingTA(false);
        }
    };

    useEffect(() => {
        loadTA();
    }, [dateStr]);

    const run = async () => {
        const parts = sizesRaw
            .split(/[,\s]+/)
            .map((t) => parseInt(t, 10))
            .filter((n) => n > 0 && Number.isFinite(n));

        if (parts.length === 0) return alert("Enter at least one valid integer ≥ 1.");

        setRunning(true);
        setResults([]);
        let baseTime = time;
        const log = [];

        for (let i = 0; i < parts.length; i++) {
            const guests = parts[i];
            if (i > 0) {
                const [h, m] = baseTime.split(":").map(Number);
                const t2 = addMinutes(new Date(0, 0, 0, h, m), 2);
                baseTime = format(t2, "HH:mm");
            }
            try {
                await createBooking({
                    date: dateStr,
                    meal_type: meal,
                    reserved_time: `${baseTime}:00`,
                    total_adults: guests,
                    total_kids: 0,
                    full_name: `TEST-${guests}-${Date.now()}`,
                    phone: null,
                    email: null,
                    special_requests: null,
                    gdpr_consent: false,
                    marketing_opt_in: false,
                    long_stay: false,
                });
                log.push({ size: guests, ok: true, msg: "✓ booked" });
            } catch (e) {
                log.push({ size: guests, ok: false, msg: e?.response?.data?.error || "rejected" });
            }
        }

        setResults(log);
        setRunning(false);
        if (typeof onRefresh === "function") await onRefresh();
        await loadTA();
    };

    const dayBookings = bookings.filter(
        (b) => (b.table_availability?.date || b.date) === dateStr
    );

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded shadow max-w-lg">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                    <IconClock className="w-5 h-5 mr-2" /> Algorithm Tester
                </h2>

                <label className="block text-sm font-medium mb-1">
                    Party sizes (comma-separated)
                </label>
                <input
                    className="w-full border rounded p-2 mb-4"
                    placeholder="e.g. 4,5,2,5"
                    value={sizesRaw}
                    onChange={(e) => setSizesRaw(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <input
                            type="date"
                            className="w-full border rounded p-2"
                            value={dateStr}
                            onChange={(e) => setDateStr(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Meal</label>
                        <select
                            className="w-full border rounded p-2"
                            value={meal}
                            onChange={(e) => setMeal(e.target.value)}
                        >
                            <option value="lunch">Lunch</option>
                            <option value="dinner">Dinner</option>
                        </select>
                    </div>
                </div>

                <label className="block text-sm font-medium mb-1">Starting time (HH:MM)</label>
                <input
                    type="time"
                    step={900}
                    className="w-full border rounded p-2 mb-6"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                />

                <button
                    onClick={run}
                    disabled={running}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    <IconPlayerPlay className="w-5 h-5 mr-2" />
                    {running ? "Running…" : "Run Test"}
                </button>

                {results.length > 0 && (
                    <div className="mt-6">
                        <h4 className="font-semibold mb-2">Results</h4>
                        <ul className="space-y-1 text-sm">
                            {results.map((r, i) => (
                                <li
                                    key={i}
                                    className={`flex items-center ${
                                        r.ok ? "text-green-700" : "text-red-600"
                                    }`}
                                >
                                    {r.ok ? <IconCheck className="w-4 h-4 mr-1" /> : <IconX className="w-4 h-4 mr-1" />}
                                    {r.size} → {r.msg}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {dateObj && (
                <DaySchedule
                    selectedDate={dateObj}
                    bookings={dayBookings}
                    tableAvailability={ta}
                    onClose={() => {}}
                    enableZoom
                />
            )}

            {loadingTA && <p className="text-sm text-gray-500">Loading table availability…</p>}
        </div>
    );
}
