// frontend/src/components/admin/currentBookings/AddBookingModal.jsx
// (unchanged – reproduced verbatim)

import React, { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { format } from "date-fns";
import { createBooking } from "../../../services/bookingService";
import { getDayMealTypes } from "../../../services/datePicker";
import { translate } from "../../../services/i18n";

// 15-minute helper to build time slots
const buildSlots = (start, end) => {
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
};

const lunchFirstSlots = buildSlots("13:00", "14:00");
const lunchSecondSlots = buildSlots("15:00", "16:00");
const dinnerSlots = buildSlots("20:00", "22:00");

export default function AddBookingModal({ dateObj, onClose, onSaved }) {
    // Determine current language: default Catalan ('ca')
    const lang = localStorage.getItem("lang") || "ca";

    // Meal types allowed today (e.g. ["lunch", "dinner"] or [])
    const allowedMeals = useMemo(
        () => getDayMealTypes(dateObj.getDay()),
        [dateObj]
    );

    // State
    const [mealType, setMealType] = useState(
        allowedMeals.includes("lunch") ? "lunch" : "dinner"
    );
    const [round, setRound] = useState("first");
    const [time, setTime] = useState(lunchFirstSlots[0]);
    const [fullName, setFullName] = useState("");
    const [party, setParty] = useState(2);
    const [phone, setPhone] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Ensure mealType stays valid if allowedMeals change
    useEffect(() => {
        if (!allowedMeals.includes(mealType)) {
            setMealType(allowedMeals[0] || "lunch");
        }
    }, [allowedMeals.join(","), mealType]);

    // Update time options when mealType or round changes
    const timeOptions = useMemo(() => {
        if (mealType === "lunch") {
            return round === "first" ? lunchFirstSlots : lunchSecondSlots;
        }
        return dinnerSlots;
    }, [mealType, round]);

    useEffect(() => {
        if (!timeOptions.includes(time)) {
            setTime(timeOptions[0]);
        }
    }, [timeOptions, time]);

    const saveBooking = async () => {
        if (saving) return;
        if (!fullName.trim() || party < 1) {
            setError(translate(lang, "modal", "fullName") + " " + translate(lang, "modal", "guests") + " " + translate(lang, "modal", "errorRequired", {}));
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
            setError(e.response?.data?.error ?? translate(lang, "modal", "saveError", {}));
        } finally {
            setSaving(false);
        }
    };

    const closedDay = allowedMeals.length === 0;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
                <h3 className="text-lg font-bold mb-4">
                    {translate(lang, "modal", "addTitle")}
                </h3>
                <p className="text-sm mb-4">
                    {translate(lang, "modal", "dateDisplay", {
                        weekday: format(dateObj, "EEEE"),
                        day:     format(dateObj, "d"),
                        month:   format(dateObj, "LLL"),
                        year:    format(dateObj, "yyyy"),
                    })}
                </p>

                {closedDay ? (
                    <p className="text-red-600 font-semibold mb-4">
                        {translate(lang, "modal", "closedDay", {})}
                    </p>
                ) : (
                    <>
                        <label className="block mb-1 text-sm font-medium">
                            {translate(lang, "modal", "fullName")}
                        </label>
                        <input
                            className="w-full border p-2 mb-3 rounded"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />

                        <label className="block mb-1 text-sm font-medium">
                            {translate(lang, "modal", "guests")}
                        </label>
                        <input
                            type="number"
                            min={1}
                            className="w-full border p-2 mb-3 rounded"
                            value={party}
                            onChange={(e) => setParty(Number(e.target.value))}
                        />

                        <label className="block mb-1 text-sm font-medium">
                            {translate(lang, "modal", "phoneOptional")}
                        </label>
                        <input
                            className="w-full border p-2 mb-3 rounded"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />

                        <div className="flex space-x-4 mb-3">
                            {allowedMeals.includes("lunch") && (
                                <label className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        checked={mealType === "lunch"}
                                        onChange={() => setMealType("lunch")}
                                    />
                                    <span>{translate(lang, "modal", "meal.lunch")}</span>
                                </label>
                            )}
                            {allowedMeals.includes("dinner") && (
                                <label className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        checked={mealType === "dinner"}
                                        onChange={() => setMealType("dinner")}
                                    />
                                    <span>{translate(lang, "modal", "meal.dinner")}</span>
                                </label>
                            )}
                        </div>

                        {mealType === "lunch" && (
                            <div className="flex space-x-4 mb-3">
                                <label className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        checked={round === "first"}
                                        onChange={() => setRound("first")}
                                    />
                                    <span>{translate(lang, "modal", "round.first")}</span>
                                </label>
                                <label className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        checked={round === "second"}
                                        onChange={() => setRound("second")}
                                    />
                                    <span>{translate(lang, "modal", "round.second")}</span>
                                </label>
                            </div>
                        )}

                        <label className="block mb-1 text-sm font-medium">
                            {translate(lang, "modal", "time")}
                        </label>
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
                        {translate(lang, "modal", "close")}
                    </button>
                    {!closedDay && (
                        <button
                            onClick={saveBooking}
                            className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            disabled={saving}
                        >
                            {saving
                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : translate(lang, "modal", "save")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

AddBookingModal.propTypes = {
    dateObj: PropTypes.instanceOf(Date).isRequired,
    onClose: PropTypes.func.isRequired,
    onSaved: PropTypes.func.isRequired,
};
