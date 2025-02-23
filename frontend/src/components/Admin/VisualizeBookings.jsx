// src/components/Admin/VisualizeBookings.jsx
import React, { useState } from "react";

export default function VisualizeBookings({ bookings }) {
    const [timeFrame, setTimeFrame] = useState("7");

    const filteredBookings = filterBookingsByDays(bookings, parseInt(timeFrame));
    const totalGuests = filteredBookings.reduce(
        (acc, booking) => acc + (booking.guests || 0),
        0
    );

    const today = new Date().toISOString().split("T")[0];
    const todaysLunchBookings = bookings.filter(
        (b) => b.date === today && b.mealType === "lunch"
    );
    const todaysDinnerBookings = bookings.filter(
        (b) => b.date === today && b.mealType === "dinner"
    );

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Visualize Bookings</h2>

            {/* Timeframe Selector */}
            <div className="mb-4 flex items-center space-x-2">
                <span className="font-semibold text-gray-700">Show last:</span>
                <button
                    className={`px-3 py-1 rounded ${
                        timeFrame === "7" ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setTimeFrame("7")}
                >
                    7 days
                </button>
                <button
                    className={`px-3 py-1 rounded ${
                        timeFrame === "30" ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setTimeFrame("30")}
                >
                    30 days
                </button>
            </div>

            {/* Stats for selected timeframe */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold mb-2">
                        Bookings (last {timeFrame} days)
                    </h3>
                    <p className="text-2xl font-bold text-blue-600">
                        {filteredBookings.length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold mb-2">
                        Total Guests (last {timeFrame} days)
                    </h3>
                    <p className="text-2xl font-bold text-green-600">{totalGuests}</p>
                </div>
            </div>

            {/* Today's Bookings: separate lunch vs. dinner */}
            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-4">
                    Today&apos;s Bookings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* LUNCH */}
                    <div className="bg-blue-50 p-3 rounded">
                        <h4 className="text-base font-semibold text-blue-800 mb-2">
                            Lunch Bookings
                        </h4>
                        <p className="text-xl font-bold text-blue-600">
                            {todaysLunchBookings.length} bookings
                        </p>
                    </div>

                    {/* DINNER */}
                    <div className="bg-purple-50 p-3 rounded">
                        <h4 className="text-base font-semibold text-purple-800 mb-2">
                            Dinner Bookings
                        </h4>
                        <p className="text-xl font-bold text-purple-600">
                            {todaysDinnerBookings.length} bookings
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function filterBookingsByDays(bookings, days) {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - days);

    return bookings.filter((b) => {
        if (!b.date) return false;
        const bookingDate = new Date(b.date);
        return bookingDate >= cutoff && bookingDate <= now;
    });
}
