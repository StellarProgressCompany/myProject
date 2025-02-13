import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminAvailabilityPage = () => {
    const [groupedBookings, setGroupedBookings] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const API_URL = "http://127.0.0.1:8000/api";

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_URL}/bookings`);
                const bookings = response.data;
                const groups = {};
                bookings.forEach((booking) => {
                    const tableType = booking.table_type;
                    if (!groups[tableType.id]) {
                        groups[tableType.id] = {
                            capacity: tableType.capacity,
                            available_count: tableType.available_count,
                            bookings: [],
                        };
                    }
                    groups[tableType.id].bookings.push(booking);
                });
                setGroupedBookings(groups);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch booking data.");
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 py-10">
            <div className="max-w-5xl mx-auto bg-white shadow-md rounded p-6">
                <h1 className="text-2xl font-bold mb-4">
                    Admin Dashboard - Bookings Overview
                </h1>
                {loading && <p>Loading...</p>}
                {error && <p className="text-red-600 font-semibold">{error}</p>}
                {!loading && !error && (
                    <div>
                        {Object.keys(groupedBookings).length === 0 && (
                            <p className="text-gray-700">No bookings available.</p>
                        )}
                        {Object.keys(groupedBookings).map((typeId) => {
                            const group = groupedBookings[typeId];
                            const bookedCount = group.bookings.length;
                            const totalCount = bookedCount + group.available_count;
                            return (
                                <div
                                    key={typeId}
                                    className="mb-8 border rounded shadow p-4 bg-gray-50"
                                >
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
                                        <h2 className="text-xl font-bold mb-2 md:mb-0">
                                            Table Type: {group.capacity} Persons
                                        </h2>
                                        <div className="flex space-x-4">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded">
                        Total Tables: {totalCount}
                      </span>
                                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded">
                        Available: {group.available_count}
                      </span>
                                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded">
                        Booked: {bookedCount}
                      </span>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                            <tr className="bg-gray-200">
                                                <th className="border p-2 text-left">Booking ID</th>
                                                <th className="border p-2 text-left">Customer Name</th>
                                                <th className="border p-2 text-left">Date</th>
                                                <th className="border p-2 text-left">Time</th>
                                                <th className="border p-2 text-left">Created At</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {group.bookings.map((booking) => (
                                                <tr key={booking.id} className="hover:bg-gray-100">
                                                    <td className="border p-2">{booking.id}</td>
                                                    <td className="border p-2">{booking.customer_name}</td>
                                                    <td className="border p-2">{booking.date}</td>
                                                    <td className="border p-2">{booking.time}</td>
                                                    <td className="border p-2">
                                                        {new Date(booking.created_at).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAvailabilityPage;
