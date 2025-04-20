import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    IconCalendarClock,
    IconClock,
    IconHistory,
    IconChartBar,
    IconLogout,
    IconRefresh,
    IconFlask,
} from "@tabler/icons-react";

import { fetchAllBookings } from "../services/bookingService";
import BookingsOverview from "../components/Admin/Bookings/BookingsOverview";
import CurrentBookings from "../components/Admin/Current/CurrentBookings";
import StatsGrid from "../components/Admin/StatsGrid";
import AlgorithmTester from "../components/Admin/AlgorithmTester";

/* navigation */
const navData = [
    { key: "current", label: "Current Bookings", icon: IconClock },
    { key: "future", label: "Future Bookings", icon: IconCalendarClock },
    { key: "past", label: "Past Bookings", icon: IconHistory },
    { key: "metrics", label: "Metrics", icon: IconChartBar },
    { key: "tester", label: "Algorithm Test", icon: IconFlask },
];

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [active, setActive] = useState("current");
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    /* pull bookings */
    const getBookings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAllBookings();
            setBookings(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getBookings();
    }, [getBookings]);

    const logout = () => {
        localStorage.removeItem("isAuthenticated");
        navigate("/login");
    };

    /* content switch */
    const renderContent = () => {
        if (loading) return <p>Loading bookings…</p>;

        switch (active) {
            case "current":
                return (
                    <CurrentBookings bookings={bookings} onDataRefresh={getBookings} />
                );
            case "future":
                return (
                    <BookingsOverview
                        mode="future"
                        bookings={bookings}
                        onDataRefresh={getBookings}
                    />
                );
            case "past":
                return (
                    <BookingsOverview
                        mode="past"
                        bookings={bookings}
                        onDataRefresh={getBookings}
                    />
                );
            case "metrics":
                return <StatsGrid bookings={bookings} />;
            case "tester":
                return (
                    <AlgorithmTester bookings={bookings} onRefresh={getBookings} />
                );
            default:
                return null;
        }
    };

    /* ───────────────────────────── UI ───────────────────────────── */
    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* sidebar */}
            <aside className="w-64 bg-white border-r flex flex-col">
                <div className="flex-1">
                    <div className="flex items-center justify-between p-4 border-b">
                        <span className="text-xl font-semibold">My Admin</span>
                        <code className="text-sm text-gray-500">v0.1.8</code>
                    </div>
                    <div className="p-4 space-y-1">
                        {navData.map(({ key, label, icon: IconCmp }) => (
                            <button
                                key={key}
                                onClick={() => setActive(key)}
                                className={`w-full flex items-center p-2 rounded-md ${
                                    active === key
                                        ? "bg-blue-100 text-blue-700 font-medium"
                                        : "text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                <IconCmp className="mr-3 h-5 w-5 text-gray-400" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t space-y-2">
                    <button
                        onClick={getBookings}
                        className="w-full flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        <IconRefresh className="mr-3 h-5 w-5 text-gray-400" /> Refresh
                    </button>
                    <button
                        onClick={logout}
                        className="w-full flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        <IconLogout className="mr-3 h-5 w-5 text-gray-400" /> Logout
                    </button>
                </div>
            </aside>

            {/* main */}
            <main className="flex-1 p-6 overflow-auto">{renderContent()}</main>
        </div>
    );
}
