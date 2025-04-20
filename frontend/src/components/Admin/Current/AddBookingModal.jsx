import React, { useState, useMemo } from "react";
import { createBooking } from "../../../services/bookingService";
import { format } from "date-fns";

// helper to build 15‑minute slots
function buildTimes(start, end) {
    const slots = [];
    let [h, m] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);

    while (h < eh || (h === eh && m <= em)) {
        slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
        m += 15;
        if (m === 60) {
            h += 1;
            m = 0;
        }
    }
    return slots;
}

const lunchFirst = buildTimes("13:00", "14:00");
const lunchSecond = buildTimes("15:00", "16:00");
const dinnerTimes = buildTimes("20:00", "22:00");

export default function AddBookingModal({ dateObj, onClose, onSaved }) {
    const [fullName, setFullName] = useState("");
    const [party, setParty] = useState(2);
    const [phone, setPhone] = useState("");

    const [mealType, setMealType] = useState("lunch");
    const [round, setRound] = useState("first");
    const [time, setTime] = useState(lunchFirst[0]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // rebuild slot list when selectors change
    const timeOptions = useMemo(() => {
        if (mealType === "lunch") {
            return round === "first" ? lunchFirst : lunchSecond;
        }
        return dinnerTimes;
    }, [mealType, round]);

    // keep selected time in range
    useMemo(() => {
        if (!timeOptions.includes(time)) setTime(timeOptions[0]);
    }, [timeOptions]); //eslint-disable-line

    const handleSave = async () => {
        if (!fullName.trim() || party < 1) {
            setError("Name and party size required.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            await createBooking({
                date: format(dateObj, "yyyy-MM-dd"),
                meal_type: mealType,
                reserved_time: time,
                total_adults: party,
                total_kids: 0,
                full_name: fullName,
                phone: phone || null,
                email: null,
                special_requests: null,
                gdpr_consent: false,
                marketing_opt_in: false,
            });
            onSaved();
        } catch (e) {
            console.error(e);
            setError(e.response?.data?.error ?? "Failed to save booking");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
                <h3 className="text-lg font-bold mb-4">Add Manual Booking</h3>

                {/* Name */}
                <label className="block mb-1 text-sm font-medium">Full Name</label>
                <input
                    className="w-full border p-2 mb-3 rounded"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                />

                {/* Party */}
                <label className="block mb-1 text-sm font-medium">Guests</label>
                <input
                    type="number"
                    min={1}
                    className="w-full border p-2 mb-3 rounded"
                    value={party}
                    onChange={(e) => setParty(Number(e.target.value))}
                />

                {/* Phone */}
                <label className="block mb-1 text-sm font-medium">
                    Phone (optional)
                </label>
                <input
                    className="w-full border p-2 mb-3 rounded"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                />

                {/* Meal type */}
                <div className="flex space-x-4 mb-3">
                    <label className="flex items-center space-x-1">
                        <input
                            type="radio"
                            checked={mealType === "lunch"}
                            onChange={() => setMealType("lunch")}
                        />
                        <span>Lunch</span>
                    </label>
                    <label className="flex items-center space-x-1">
                        <input
                            type="radio"
                            checked={mealType === "dinner"}
                            onChange={() => setMealType("dinner")}
                        />
                        <span>Dinner</span>
                    </label>
                </div>

                {/* Round selector for lunch */}
                {mealType === "lunch" && (
                    <div className="flex space-x-4 mb-3">
                        <label className="flex items-center space-x-1">
                            <input
                                type="radio"
                                checked={round === "first"}
                                onChange={() => setRound("first")}
                            />
                            <span>1st&nbsp;Round</span>
                        </label>
                        <label className="flex items-center space-x-1">
                            <input
                                type="radio"
                                checked={round === "second"}
                                onChange={() => setRound("second")}
                            />
                            <span>2nd&nbsp;Round</span>
                        </label>
                    </div>
                )}

                {/* Time dropdown */}
                <label className="block mb-1 text-sm font-medium">Time</label>
                <select
                    className="w-full border p-2 mb-3 rounded"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                >
                    {timeOptions.map((t) => (
                        <option key={t} value={t}>
                            {t.slice(0, 5)}
                        </option>
                    ))}
                </select>

                {error && <p className="text-red-600 mb-2">{error}</p>}

                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-1 border rounded"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        disabled={saving}
                    >
                        {saving ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}
