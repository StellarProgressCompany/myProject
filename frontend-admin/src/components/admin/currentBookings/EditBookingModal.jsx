// frontend/src/components/admin/currentBookings/EditBookingModal.jsx
import React, { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import {
    updateBooking,
    deleteBooking,
} from "../../../services/bookingService";
import { translate, getLanguage } from "../../../services/i18n";
import { IconTrash, IconDeviceFloppy } from "@tabler/icons-react";

/* ─── slot helpers (same as AddBookingModal) ───────────────────── */
const buildSlots = (start, end) => {
    const out = [];
    let [h, m] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    while (h < eh || (h === eh && m <= em)) {
        out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
        m += 15;
        if (m === 60) {
            h += 1;
            m = 0;
        }
    }
    return out;
};
const lunchFirstSlots  = buildSlots("13:00", "14:00");
const lunchSecondSlots = buildSlots("15:00", "16:00");
const dinnerSlots      = buildSlots("20:00", "22:00");
/* ──────────────────────────────────────────────────────────────── */

export default function EditBookingModal({ booking, onClose, onSaved }) {
    /* ─── i18n ─── */
    const lang = getLanguage();
    const t    = (k, p) => translate(lang, k, p);

    /* ─── form state ─── */
    const [fullName, setFullName] = useState(booking.full_name);
    const [adults,   setAdults]   = useState(booking.total_adults);
    const [kids,     setKids]     = useState(booking.total_kids);
    const [phone,    setPhone]    = useState(booking.phone || "");

    /* meal / round derived from original booking */
    const mealType = booking.table_availability?.meal_type || "lunch";
    const initialRound =
        mealType === "lunch"
            ? booking.reserved_time < "15:00:00"
                ? "first"
                : "second"
            : null;

    const [round, setRound] = useState(initialRound);

    /* time select options depend on meal / round */
    const timeOptions = useMemo(() => {
        if (mealType === "dinner") return dinnerSlots;
        return round === "first" ? lunchFirstSlots : lunchSecondSlots;
    }, [mealType, round]);

    /* ensure selected time always valid */
    const [time, setTime] = useState(booking.reserved_time.slice(0, 5));
    useEffect(() => {
        if (!timeOptions.includes(`${time}:00`)) {
            const fallback = timeOptions[0];
            setTime(fallback.slice(0, 5));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeOptions]);

    /* saving / error state */
    const [saving, setSaving] = useState(false);
    const [error,  setError]  = useState("");

    /* ─── save handler ─── */
    const handleSave = async () => {
        if (saving) return;

        if (!fullName.trim() || adults < 1) {
            return setError(t("modal.errorRequired"));
        }
        setSaving(true);
        setError("");

        try {
            await updateBooking(booking.id, {
                full_name:
                    fullName.trim() !== booking.full_name ? fullName.trim() : undefined,
                total_adults: adults,
                total_kids:   kids,
                phone:        phone || null,
                reserved_time: `${time}:00`,
            });
            onSaved();
        } catch (e) {
            console.error(e);
            setError(e.response?.data?.error ?? t("modal.saveError"));
        } finally {
            setSaving(false);
        }
    };

    /* ─── delete handler ─── */
    const handleDelete = async () => {
        if (!window.confirm(t("modal.confirmDelete") || "Delete this booking?")) return;
        setSaving(true);

        try {
            await deleteBooking(booking.id);
            onSaved();
        } catch (e) {
            console.error(e);
            setError(t("modal.deleteError") || "Delete failed");
        } finally {
            setSaving(false);
        }
    };

    /* ─── ui ─── */
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
                <h3 className="text-lg font-bold mb-4">{t("modal.editTitle") || "Edit Booking"}</h3>

                {/* Full name */}
                <label className="block mb-1 text-sm font-medium">
                    {t("modal.fullName")}
                </label>
                <input
                    className="w-full border p-2 mb-3 rounded"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                />

                {/* party size */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                        <label className="block mb-1 text-sm font-medium">
                            {t("schedule.table.adults") || "Adults"}
                        </label>
                        <input
                            type="number"
                            min={1}
                            className="w-full border p-2 rounded"
                            value={adults}
                            onChange={(e) => setAdults(Number(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium">
                            {t("schedule.table.kids") || "Kids"}
                        </label>
                        <input
                            type="number"
                            min={0}
                            className="w-full border p-2 rounded"
                            value={kids}
                            onChange={(e) => setKids(Number(e.target.value))}
                        />
                    </div>
                </div>

                {/* phone */}
                <label className="block mb-1 text-sm font-medium">
                    {t("modal.phoneOptional")}
                </label>
                <input
                    className="w-full border p-2 mb-3 rounded"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                />

                {/* lunch round selector (only for lunch) */}
                {mealType === "lunch" && (
                    <div className="flex space-x-4 mb-3">
                        <label className="flex items-center space-x-1">
                            <input
                                type="radio"
                                checked={round === "first"}
                                onChange={() => setRound("first")}
                            />
                            <span>{t("modal.round.first")}</span>
                        </label>
                        <label className="flex items-center space-x-1">
                            <input
                                type="radio"
                                checked={round === "second"}
                                onChange={() => setRound("second")}
                            />
                            <span>{t("modal.round.second")}</span>
                        </label>
                    </div>
                )}

                {/* time select */}
                <label className="block mb-1 text-sm font-medium">
                    {t("modal.time")}
                </label>
                <select
                    className="w-full border p-2 mb-3 rounded"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                >
                    {timeOptions.map((tOpt) => (
                        <option key={tOpt} value={tOpt.slice(0, 5)}>
                            {tOpt.slice(0, 5)}
                        </option>
                    ))}
                </select>

                {error && <p className="text-red-600 mb-2">{error}</p>}

                <div className="flex justify-between items-center">
                    <button
                        onClick={handleDelete}
                        className="flex items-center text-red-600 hover:text-red-700 disabled:opacity-50"
                        disabled={saving}
                    >
                        <IconTrash className="w-5 h-5 mr-1" />
                        {t("modal.delete") || "Delete"}
                    </button>

                    <div className="space-x-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-1 border rounded"
                            disabled={saving}
                        >
                            {t("modal.close")}
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                            disabled={saving}
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <IconDeviceFloppy className="w-4 h-4 mr-1" />
                                    {t("modal.save")}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

EditBookingModal.propTypes = {
    booking: PropTypes.shape({
        id:                PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        full_name:         PropTypes.string,
        total_adults:      PropTypes.number,
        total_kids:        PropTypes.number,
        phone:             PropTypes.string,
        reserved_time:     PropTypes.string,
        table_availability: PropTypes.object,
    }).isRequired,
    onClose: PropTypes.func.isRequired,
    onSaved: PropTypes.func.isRequired,
};
