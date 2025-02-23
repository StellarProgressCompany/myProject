import React, { useState, useEffect } from "react";
import {
    IconBellRinging,
    IconReceipt2,
    IconFingerprint,
    IconKey,
    IconDatabaseImport,
    Icon2fa,
    IconSettings,
    IconSwitchHorizontal,
    IconLogout,
} from "@tabler/icons-react";
import { fetchAllBookings } from "../services/bookingService";

/**
 * A simple array describing our sidebar items. You can expand/modify as needed.
 */
const navData = [
    { label: "Notifications", icon: IconBellRinging },
    { label: "Billing", icon: IconReceipt2 },
    { label: "Security", icon: IconFingerprint },
    { label: "SSH Keys", icon: IconKey },
    { label: "Databases", icon: IconDatabaseImport },
    { label: "Authentication", icon: Icon2fa },
    { label: "Other Settings", icon: IconSettings },
];

function AdminDashboard() {
    // state for active nav item
    const [active, setActive] = useState("Billing");

    // booking data states
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

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

    // Determine today's date in YYYY-MM-DD
    const today = new Date().toISOString().split("T")[0];
    // Filter the bookings to only show today's
    const todaysBookings = bookings.filter((booking) => booking.date === today);

    /**
     * Log out handler (replace with real auth logic)
     */
    function handleLogout() {
        alert("Logout clicked (add your logic here)!");
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* SIDEBAR */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                {/* Top: Logo + version block (example) */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                        {/* Replace with your own logo if you like */}
                        <div className="h-8 w-8 bg-blue-500 text-white flex items-center justify-center rounded-full">
                            <span className="text-sm font-bold">Logo</span>
                        </div>
                        <span className="text-xl font-semibold">Stellar Progress</span>
                    </div>
                    <code className="text-sm font-semibold text-gray-500">v1.0</code>
                </div>

                {/* Nav Items */}
                <div className="flex-1 p-4 space-y-1">
                    {navData.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.label === active;
                        return (
                            <button
                                key={item.label}
                                onClick={() => setActive(item.label)}
                                className={`w-full flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-50 
                  ${
                                    isActive
                                        ? "bg-blue-100 text-blue-700 font-medium"
                                        : "bg-transparent"
                                }
                `}
                            >
                                <Icon
                                    className={`mr-3 h-5 w-5 ${
                                        isActive ? "text-blue-700" : "text-gray-400"
                                    }`}
                                />
                                {item.label}
                            </button>
                        );
                    })}
                </div>

                {/* FOOTER */}
                <div className="p-4 border-t border-gray-200 space-y-1">
                    <button
                        onClick={() => alert("Change account clicked!")}
                        className="w-full flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        <IconSwitchHorizontal className="mr-3 h-5 w-5 text-gray-400" />
                        <span>Change account</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        <IconLogout className="mr-3 h-5 w-5 text-gray-400" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 p-6">
                {/* Header + Subheader */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <p className="text-gray-600">
                        Welcome to the admin panel! Here’s an overview of your bookings.
                    </p>
                </div>

                {loading ? (
                    <p>Loading bookings...</p>
                ) : (
                    <>
                        {/* Stats / Cards Example */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white rounded-lg shadow p-4">
                                <h2 className="text-lg font-semibold mb-2">
                                    Today&apos;s Bookings
                                </h2>
                                <p className="text-2xl font-bold text-blue-600">
                                    {todaysBookings.length}
                                </p>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <h2 className="text-lg font-semibold mb-2">Total Bookings</h2>
                                <p className="text-2xl font-bold text-green-600">
                                    {bookings.length}
                                </p>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <h2 className="text-lg font-semibold mb-2">Active Tab</h2>
                                <p className="text-2xl font-bold text-purple-600">{active}</p>
                            </div>
                        </div>

                        {/* Table of today's bookings */}
                        <div className="bg-white rounded-lg shadow p-4">
                            <h2 className="text-xl font-semibold mb-4">Today&apos;s Bookings</h2>
                            {todaysBookings.length === 0 ? (
                                <p>No bookings for today.</p>
                            ) : (
                                <table className="min-w-full table-auto">
                                    <thead>
                                    <tr className="bg-gray-100 text-left">
                                        <th className="px-4 py-2 border-b">ID</th>
                                        <th className="px-4 py-2 border-b">Customer Name</th>
                                        <th className="px-4 py-2 border-b">Date</th>
                                        <th className="px-4 py-2 border-b">Time</th>
                                        <th className="px-4 py-2 border-b">Guests</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {todaysBookings.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 border-b">{booking.id}</td>
                                            <td className="px-4 py-2 border-b">
                                                {booking.customer_name}
                                            </td>
                                            <td className="px-4 py-2 border-b">{booking.date}</td>
                                            <td className="px-4 py-2 border-b">{booking.time}</td>
                                            <td className="px-4 py-2 border-b">{booking.guests}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export default AdminDashboard;
