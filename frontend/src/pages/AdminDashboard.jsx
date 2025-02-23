// src/pages/AdminDashboard.jsx (formerly AdminAvailabilityPage.jsx)
import React, { useState, useEffect } from "react";
import { fetchAllBookings } from "../services/bookingService";

function AdminDashboard() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // We'll fetch the data once the component is mounted
    useEffect(() => {
        async function getBookings() {
            try {
                const data = await fetchAllBookings();
                setBookings(data);
            } catch (error) {
                console.error("Error fetching bookings:", error);
            } finally {
                setLoading(false);
            }
        }

        getBookings();
    }, []);

    // Let's figure out "today" in YYYY-MM-DD format:
    const today = new Date().toISOString().split("T")[0];
    // Filter the bookings to only show today's
    const todaysBookings = bookings.filter((booking) => booking.date === today);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

            {loading ? (
                <p>Loading bookings...</p>
            ) : (
                <>
                    {/* Example "stats" card for today's bookings */}
                    <div className="mb-6 p-4 bg-white shadow rounded">
                        <h2 className="text-xl font-semibold mb-2">Today's Bookings</h2>
                        <p className="text-gray-600">
                            There are <strong>{todaysBookings.length}</strong> bookings today.
                        </p>
                    </div>

                    {/* Table of today's bookings */}
                    <div className="mb-6 p-4 bg-white shadow rounded">
                        <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
                        {todaysBookings.length === 0 ? (
                            <p>No bookings for today.</p>
                        ) : (
                            <table className="min-w-full table-auto">
                                <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-4 py-2 border">ID</th>
                                    <th className="px-4 py-2 border">Customer Name</th>
                                    <th className="px-4 py-2 border">Date</th>
                                    <th className="px-4 py-2 border">Time</th>
                                    <th className="px-4 py-2 border">Guests</th>
                                </tr>
                                </thead>
                                <tbody>
                                {todaysBookings.map((booking) => (
                                    <tr key={booking.id}>
                                        <td className="px-4 py-2 border">{booking.id}</td>
                                        <td className="px-4 py-2 border">{booking.customer_name}</td>
                                        <td className="px-4 py-2 border">{booking.date}</td>
                                        <td className="px-4 py-2 border">{booking.time}</td>
                                        <td className="px-4 py-2 border">{booking.guests}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Future sections: charts, aggregated stats, filters, etc. */}
                </>
            )}
        </div>
    );
}

export default AdminDashboard;
