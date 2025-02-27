// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { IconChartBar, IconLogout, IconRefresh } from "@tabler/icons-react";
import { fetchAllBookings } from "../services/bookingService";
import BookingsOverview from "../components/Admin/Bookings/BookingsOverview";
import StatsGrid from "../components/Admin/StatsGrid";

const navData = [
    { label: "Future Bookings", icon: null },
    { label: "Past Bookings", icon: null },
    { label: "Metrics", icon: IconChartBar },
];

function AdminDashboard() {
    const navigate = useNavigate();
    const [active, setActive] = useState("Future Bookings");
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const getBookings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAllBookings();
            if (Array.isArray(data)) {
                setBookings(data);
            } else {
                console.error("fetchAllBookings did not return an array:", data);
                setBookings([]);
            }
        } catch (error) {
            console.error("Error fetching bookings:", error);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getBookings();
    }, [getBookings]);

    function handleLogout() {
        localStorage.removeItem("isAuthenticated");
        navigate("/login");
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* SIDEBAR */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 bg-blue-500 text-white flex items-center justify-center rounded-full">
                                <span className="text-sm font-bold">Logo</span>
                            </div>
                            <span className="text-xl font-semibold">My Admin</span>
                        </div>
                        <code className="text-sm font-semibold text-gray-500">v0.1.2 (BETA)</code>
                    </div>
                    <div className="p-4 space-y-1">
                        {navData.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => setActive(item.label)}
                                className={`w-full flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-50 ${
                                    active === item.label ? "bg-blue-100 text-blue-700 font-medium" : "bg-transparent"
                                }`}
                            >
                                {item.icon && <item.icon className="mr-3 h-5 w-5 text-gray-400" />}
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
                {/* LOGOUT BUTTON PINNED AT THE BOTTOM */}
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        <IconLogout className="mr-3 h-5 w-5 text-gray-400" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 p-6 overflow-auto">
                <div className="mb-8 flex items-center justify-between flex-wrap gap-y-2">
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <button
                        onClick={getBookings}
                        className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        <IconRefresh className="h-5 w-5" />
                        <span>Refresh</span>
                    </button>
                </div>
                {loading ? (
                    <p>Loading bookings...</p>
                ) : (
                    <>
                        {active === "Future Bookings" && (
                            <BookingsOverview mode="future" bookings={bookings} />
                        )}
                        {active === "Past Bookings" && (
                            <BookingsOverview mode="past" bookings={bookings} />
                        )}
                        {active === "Metrics" && <StatsGrid />}
                    </>
                )}
            </main>
        </div>
    );
}

export default AdminDashboard;
