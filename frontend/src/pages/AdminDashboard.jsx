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
    IconLanguage,
} from "@tabler/icons-react";

import { fetchAllBookings } from "../services/bookingService";
import BookingsOverview from "../components/admin/sharedBookings/BookingsOverview";
import CurrentBookings from "../components/admin/currentBookings/CurrentBookings.jsx";
import StatsGrid from "../components/admin/metrics/StatsGrid.jsx";
import AlgorithmTester from "../components/admin/algorithmTest/AlgorithmTester.jsx";
import { translate } from "../services/i18n";

/* top-level nav map (labels come from i18n) */
const navMeta = [
    { key: "current", icon: IconClock },
    { key: "future", icon: IconCalendarClock },
    { key: "past", icon: IconHistory },
    { key: "metrics", icon: IconChartBar },
    { key: "tester", icon: IconFlask },
];

export default function AdminDashboard() {
    const navigate = useNavigate();

    /* ───────────── language (default = Catalan) ───────────── */
    const [lang, setLang] = useState(
        () => localStorage.getItem("adminLang") || "ca"
    );
    const t = (path) => translate(lang, path);

    const changeLang = (lng) => {
        localStorage.setItem("adminLang", lng);
        setLang(lng);
    };

    /* ───────────── bookings & active panel ───────────── */
    const [active, setActive] = useState("current");
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadBookings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAllBookings();
            setBookings(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBookings();
    }, [loadBookings]);

    /* ───────────── auth ───────────── */
    const logout = () => {
        localStorage.removeItem("isAuthenticated");
        navigate("/login");
    };

    /* choose panel */
    const renderPanel = () => {
        if (loading) return <p>{t("wizard.loading")}</p>;

        switch (active) {
            case "current":
                return (
                    <CurrentBookings
                        bookings={bookings}
                        onDataRefresh={loadBookings}
                    />
                );
            case "future":
                return (
                    <BookingsOverview
                        mode="future"
                        bookings={bookings}
                        onDataRefresh={loadBookings}
                    />
                );
            case "past":
                return (
                    <BookingsOverview
                        mode="past"
                        bookings={bookings}
                        onDataRefresh={loadBookings}
                    />
                );
            case "metrics":
                return <StatsGrid bookings={bookings} />;
            case "tester":
                return (
                    <AlgorithmTester
                        bookings={bookings}
                        onRefresh={loadBookings}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* ───────────── Sidebar ───────────── */}
            <aside className="relative w-64 bg-white border-r flex flex-col overflow-y-auto">
                {/* header */}
                <div className="border-b">
                    <div className="flex items-center justify-between p-4">
                        <span className="text-xl font-semibold">
                            {t("admin.title")}
                        </span>
                        <code className="text-sm text-gray-500">v1.0.3</code>
                    </div>

                    {/* language selector */}
                    <div className="px-4 pb-4">
                        <label className="flex items-center text-xs font-medium text-gray-600 mb-1">
                            <IconLanguage className="w-4 h-4 mr-2" />
                            {t("admin.language")}
                        </label>
                        <select
                            value={lang}
                            onChange={(e) => changeLang(e.target.value)}
                            className="w-full border rounded p-2 text-sm"
                        >
                            <option value="ca">Català</option>
                            <option value="es">Español</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                </div>

                {/* nav buttons */}
                <div className="flex-1 p-4 space-y-1">
                    {navMeta.map(({ key, icon: IconCmp }) => (
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
                            {t(`admin.nav.${key}`)}
                        </button>
                    ))}
                </div>

                {/* sticky bottom zone */}
                <div className="sticky bottom-0 left-0 w-full bg-white p-4 border-t space-y-2">
                    <button
                        onClick={loadBookings}
                        className="w-full flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        <IconRefresh className="mr-3 h-5 w-5 text-gray-400" />
                        {t("admin.refresh")}
                    </button>

                    {/* LOGOUT always bottom-left */}
                    <button
                        onClick={logout}
                        className="w-full flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        <IconLogout className="mr-3 h-5 w-5 text-gray-400" />
                        {t("admin.logout")}
                    </button>
                </div>
            </aside>

            {/* main */}
            <main className="flex-1 p-6 overflow-auto">{renderPanel()}</main>
        </div>
    );
}
