import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    IconCalendarClock,
    IconClock,
    IconHistory,
    IconChartBar,
    IconLogout,
    IconRefresh,
} from "@tabler/icons-react";
import { fetchAllBookings } from "../services/bookingService";
import BookingsOverview from "../components/Admin/Bookings/BookingsOverview";
import CurrentBookings from "../components/Admin/Current/CurrentBookings";
import StatsGrid from "../components/Admin/StatsGrid";

const navData = [
    { label: "Current Bookings", icon: IconClock },
    { label: "Future Bookings", icon: IconCalendarClock },
    { label: "Past Bookings", icon: IconHistory },
    { label: "Metrics", icon: IconChartBar },
];

function AdminDashboard() {
    const navigate = useNavigate();
    const [active, setActive] = useState("Current Bookings");
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    /** pull bookings (called on load & refresh) */
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

    const handleLogout = () => {
        localStorage.removeItem("isAuthenticated");
        navigate("/login");
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* SIDEBAR */}
            <aside className="w-64 bg-white border-r flex flex-col">
                <div className="flex-1">
                    <div className="flex items-center justify-between p-4 border-b">
                        <span className="text-xl font-semibold">My Admin</span>
                        <code className="text-sm text-gray-500">v0.1.5</code>
                    </div>

                    <div className="p-4 space-y-1">
                        {navData.map(({ label, icon: IconCmp }) => (
                            <button
                                key={label}
                                onClick={() => setActive(label)}
                                className={`w-full flex items-center p-2 rounded-md ${
                                    active === label
                                        ? "bg-blue-100 text-blue-700 font-medium"
                                        : "text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                {IconCmp && <IconCmp className="mr-3 h-5 w-5 text-gray-400" />}
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        <IconLogout className="mr-3 h-5 w-5 text-gray-400" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* MAIN */}
            <main className="flex-1 p-6 overflow-auto">
                <div className="mb-8 flex items-center justify-between flex-wrap gap-y-2">
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <button
                        onClick={getBookings}
                        className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        <IconRefresh className="h-5 w-5" />
                        <span>Refresh</span>
                    </button>
                </div>

                {loading ? (
                    <p>Loading bookings…</p>
                ) : (
                    <>
                        {active === "Current Bookings" && (
                            <CurrentBookings bookings={bookings} onDataRefresh={getBookings} />
                        )}

                        {active === "Future Bookings" && (
                            <BookingsOverview mode="future" bookings={bookings} />
                        )}

                        {active === "Past Bookings" && (
                            <BookingsOverview mode="past" bookings={bookings} />
                        )}

                        {active === "Metrics" && <StatsGrid bookings={bookings} />}
                    </>
                )}
            </main>
        </div>
    );
}

export default AdminDashboard;
