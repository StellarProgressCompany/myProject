// frontend/src/components/admin/currentBookings/EditBookingModal.jsx
// (unchanged – reproduced verbatim)
import React, { useState } from "react";
import PropTypes from "prop-types";
import { updateBooking, deleteBooking } from "../../../services/bookingService";

export default function EditBookingModal({ booking, onClose, onSaved }) {
    const [fullName, setFullName] = useState(booking.full_name);
    const [adults, setAdults] = useState(booking.total_adults);
    const [kids, setKids] = useState(booking.total_kids);
    const [phone, setPhone] = useState(booking.phone || "");
    const [time, setTime] = useState(booking.reserved_time.slice(0, 5));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async () => {
        if (saving) return;
        if (!fullName.trim() || adults < 1) {
            return setError("Name and at least 1 adult required.");
        }
        setSaving(true);
        setError("");

        try {
            await updateBooking(booking.id, {
                full_name:
                    fullName.trim() !== booking.full_name
                        ? fullName.trim()
                        : undefined,
                total_adults: adults,
                total_kids: kids,
                phone: phone || null,
                reserved_time: `${time}:00`,
            });
            onSaved();
        } catch (e) {
            console.error(e);
            setError(e.response?.data?.error ?? "Update failed");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Delete this booking?")) return;
        setSaving(true);

        try {
            await deleteBooking(booking.id);
            onSaved();
        } catch (e) {
            console.error(e);
            setError("Delete failed");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
                <h3 className="text-lg font-bold mb-4">Edit Booking</h3>

                <label className="block mb-1 text-sm font-medium">Full Name</label>
                <input
                    className="w-full border p-2 mb-3 rounded"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                        <label className="block mb-1 text-sm font-medium">Adults</label>
                        <input
                            type="number"
                            min={1}
                            className="w-full border p-2 rounded"
                            value={adults}
                            onChange={(e) => setAdults(Number(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium">Kids</label>
                        <input
                            type="number"
                            min={0}
                            className="w-full border p-2 rounded"
                            value={kids}
                            onChange={(e) => setKids(Number(e.target.value))}
                        />
                    </div>
                </div>

                <label className="block mb-1 text-sm font-medium">Phone</label>
                <input
                    className="w-full border p-2 mb-3 rounded"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                />

                <label className="block mb-1 text-sm font-medium">Time (HH:MM)</label>
                <input
                    type="time"
                    step={900}
                    className="w-full border p-2 mb-3 rounded"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                />

                {error && <p className="text-red-600 mb-2">{error}</p>}

                <div className="flex justify-between items-center">
                    <button
                        onClick={handleDelete}
                        className="px-3 py-1 text-red-600 underline disabled:opacity-50"
                        disabled={saving}
                    >
                        Delete
                    </button>
                    <div className="space-x-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-1 border rounded"
                            disabled={saving}
                        >
                            Close
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                            disabled={saving}
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                "Save"
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
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired,
        full_name: PropTypes.string,
        total_adults: PropTypes.number,
        total_kids: PropTypes.number,
        phone: PropTypes.string,
        reserved_time: PropTypes.string,
    }).isRequired,
    onClose: PropTypes.func.isRequired,
    onSaved: PropTypes.func.isRequired,
};
