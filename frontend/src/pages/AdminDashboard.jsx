// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IconReceipt2,
    IconLogout,
    IconChartBar,
} from "@tabler/icons-react";

import { fetchAllBookings } from "../services/bookingService";
import VisualizeBookings from "../components/Admin/VisualizeBookings";
import StatsGrid from "../components/Admin/StatsGrid";

// NAV DATA: only two buttons now
const navData = [
    { label: "Visualize Bookings", icon: IconReceipt2 },
    { label: "Metrics", icon: IconChartBar },
];

function AdminDashboard() {
    const navigate = useNavigate();
    const [active, setActive] = useState("Visualize Bookings");
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

    function handleLogout() {
        localStorage.removeItem("isAuthenticated");
        navigate("/login");
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* SIDEBAR */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                {/* TOP SECTION: LOGO + VERSION */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 bg-blue-500 text-white flex items-center justify-center rounded-full">
                            <span className="text-sm font-bold">Logo</span>
                        </div>
                        <span className="text-xl font-semibold">My Admin</span>
                    </div>
                    <code className="text-sm font-semibold text-gray-500">v3.1.2</code>
                </div>

                {/* NAV ITEMS */}
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
                                }`}
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

                {/* FOOTER: LOGOUT ONLY */}
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
            <main className="flex-1 p-6">
                {loading ? (
                    <p>Loading bookings...</p>
                ) : (
                    <>
                        {/* HEADER */}
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                            <p className="text-gray-600">
                                Welcome to the admin panel! Here’s an overview of your
                                restaurant’s bookings and metrics.
                            </p>
                        </div>

                        {/* CONDITIONAL CONTENT */}
                        {active === "Visualize Bookings" && (
                            <VisualizeBookings bookings={bookings} />
                        )}
                        {active === "Metrics" && <StatsGrid />}
                    </>
                )}
            </main>
        </div>
    );
}

export default AdminDashboard;
