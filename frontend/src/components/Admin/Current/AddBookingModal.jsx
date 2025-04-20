import React, { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { createBooking } from "../../../services/bookingService";
import { getDayMealTypes } from "../../DatePicker/datePickerUtils";

/* 15‑minute helper */
const build = (start, end) => {
    const out = [];
    let [h, m] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    for (; h < eh || (h === eh && m <= em); ) {
        out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
        m += 15;
        if (m === 60) {
            h += 1;
            m = 0;
        }
    }
    return out;
};

/* official slot‑sets */
const lunchFirst  = build("13:00", "14:00");
const lunchSecond = build("15:00", "16:00");
const dinnerSlots = build("20:00", "22:00");

export default function AddBookingModal({ dateObj, onClose, onSaved }) {
    /* which meals are actually allowed that day? */
    const allowedMeals = useMemo(
        () => getDayMealTypes(dateObj.getDay()),
        [dateObj]
    );

    /* pick first allowed meal as default */
    const [mealType, setMealType] = useState(
        allowedMeals.includes("lunch") ? "lunch" : "dinner"
    );

    /* snap state if user flips to a date without dinner */
    useEffect(() => {
        if (!allowedMeals.includes(mealType)) {
            setMealType(allowedMeals[0] || "lunch");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allowedMeals.join(",")]);

    const [round, setRound] = useState("first");          // lunch only
    const [time, setTime]   = useState(lunchFirst[0]);

    const [fullName, setFullName] = useState("");
    const [party, setParty]       = useState(2);
    const [phone, setPhone]       = useState("");
    const [saving, setSaving]     = useState(false);
    const [error,  setError]      = useState("");

    /* derive slots for UI */
    const timeOptions = useMemo(() => {
        if (mealType === "lunch") {
            return round === "first" ? lunchFirst : lunchSecond;
        }
        return dinnerSlots;
    }, [mealType, round]);

    /* keep selected time in range */
    useEffect(() => {
        if (!timeOptions.includes(time)) setTime(timeOptions[0]);
    }, [timeOptions]);                        // eslint-disable-line

    /* submit */
    const save = async () => {
        if (!fullName.trim() || party < 1) {
            return setError("Name and guest count required.");
        }
        setSaving(true);
        setError("");
        try {
            await createBooking({
                date:          format(dateObj, "yyyy-MM-dd"),
                meal_type:     mealType,
                reserved_time: time,
                total_adults:  party,
                total_kids:    0,
                full_name:     fullName,
                phone:         phone || null,
                email:         null,
                special_requests: null,
                gdpr_consent:     false,
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

    const closedDay = allowedMeals.length === 0;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
                <h3 className="text-lg font-bold mb-4">Add Manual Booking</h3>

                {/* date label */}
                <p className="text-sm mb-4">
                    {format(dateObj, "EEEE, d LLL yyyy")}
                </p>

                {/* closed day guard */}
                {closedDay && (
                    <p className="text-red-600 font-semibold mb-4">
                        Restaurant closed on this day.
                    </p>
                )}

                {!closedDay && (
                    <>
                        {/* name */}
                        <label className="block mb-1 text-sm font-medium">Full Name</label>
                        <input
                            className="w-full border p-2 mb-3 rounded"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />

                        {/* party size */}
                        <label className="block mb-1 text-sm font-medium">Guests</label>
                        <input
                            type="number"
                            min={1}
                            className="w-full border p-2 mb-3 rounded"
                            value={party}
                            onChange={(e) => setParty(Number(e.target.value))}
                        />

                        {/* phone */}
                        <label className="block mb-1 text-sm font-medium">
                            Phone (optional)
                        </label>
                        <input
                            className="w-full border p-2 mb-3 rounded"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />

                        {/* meal‑type radios */}
                        <div className="flex space-x-4 mb-3">
                            {allowedMeals.includes("lunch") && (
                                <label className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        checked={mealType === "lunch"}
                                        onChange={() => setMealType("lunch")}
                                    />
                                    <span>Lunch</span>
                                </label>
                            )}
                            {allowedMeals.includes("dinner") && (
                                <label className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        checked={mealType === "dinner"}
                                        onChange={() => setMealType("dinner")}
                                    />
                                    <span>Dinner</span>
                                </label>
                            )}
                        </div>

                        {/* lunch‑round switch */}
                        {mealType === "lunch" && (
                            <div className="flex space-x-4 mb-3">
                                <label className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        checked={round === "first"}
                                        onChange={() => setRound("first")}
                                    />
                                    <span>1st Round</span>
                                </label>
                                <label className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        checked={round === "second"}
                                        onChange={() => setRound("second")}
                                    />
                                    <span>2nd Round</span>
                                </label>
                            </div>
                        )}

                        {/* time selector */}
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
                    </>
                )}

                {error && <p className="text-red-600 mb-2">{error}</p>}

                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-1 border rounded"
                        disabled={saving}
                    >
                        Close
                    </button>
                    {!closedDay && (
                        <button
                            onClick={save}
                            className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            disabled={saving}
                        >
                            {saving ? "Saving…" : "Save"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
