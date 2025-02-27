import React, { useMemo } from "react";
import { format, addMinutes, set } from "date-fns";

export default function AdminDaySchedule({ selectedDate, bookings, onClose }) {
    if (!selectedDate) return null;

    // Build time slots from 08:00 to 22:00 in 15-minute increments
    const timeSlots = useMemo(() => {
        const slots = [];
        let slotTime = set(selectedDate, {
            hours: 8,
            minutes: 0,
            seconds: 0,
            milliseconds: 0,
        });
        const endTime = set(selectedDate, {
            hours: 22,
            minutes: 0,
            seconds: 0,
            milliseconds: 0,
        });
        while (slotTime <= endTime) {
            slots.push(new Date(slotTime));
            slotTime = addMinutes(slotTime, 15);
        }
        return slots;
    }, [selectedDate]);

    // Group bookings by time slot based on reserved_time (HH:mm)
    const rows = timeSlots.map((slot) => {
        const slotLabel = format(slot, "HH:mm");
        const slotBookings = bookings.filter((b) => {
            const bookingHHmm = b.reserved_time.slice(0, 5); // e.g., "20:30"
            return bookingHHmm === slotLabel;
        });
        const totalBookings = slotBookings.length;
        const totalClients = slotBookings.reduce((acc, b) => {
            const cap = b?.table_availability?.capacity || 0;
            return acc + cap;
        }, 0);

        return {
            slotLabel,
            totalBookings,
            totalClients,
        };
    });

    return (
        <div className="mt-6 border rounded bg-white p-4 shadow">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">
                    Schedule for {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </h3>
                <button onClick={onClose} className="text-sm text-red-500 underline">
                    Close
                </button>
            </div>

            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                <tr>
                    <th className="px-3 py-2 text-left font-semibold">Time</th>
                    <th className="px-3 py-2 text-left font-semibold">Bookings</th>
                    <th className="px-3 py-2 text-left font-semibold">Total Clients</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                {rows.map((r) => (
                    <tr key={r.slotLabel}>
                        <td className="px-3 py-2">{r.slotLabel}</td>
                        <td className="px-3 py-2">{r.totalBookings}</td>
                        <td className="px-3 py-2">{r.totalClients}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
