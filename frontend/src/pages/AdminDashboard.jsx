// frontend/src/pages/AdminDashboard.jsx

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

import LanguagePicker      from "../components/admin/utils/LanguagePicker.jsx";
import { fetchAllBookings } from "../services/bookingService";
import CurrentBookings     from "../components/admin/currentBookings/CurrentBookings";
import BookingsOverview    from "../components/admin/sharedBookings/BookingsOverview";
import StatsGrid           from "../components/admin/metrics/StatsGrid";
import AlgorithmTester     from "../components/admin/algorithmTest/AlgorithmTester";
import { translate, setLanguage } from "../services/i18n";

const navMeta = [
    { key: "current", icon: IconClock },
    { key: "future",  icon: IconCalendarClock },
    { key: "past",    icon: IconHistory },
    { key: "metrics", icon: IconChartBar },
    { key: "tester",  icon: IconChartBar },
];

export default function AdminDashboard() {
    const navigate = useNavigate();

    // ─── Language state ───
    const [lang, setLang] = useState(
        () => localStorage.getItem("adminLang") || "ca"
    );
    const t = (key, vars) => translate(lang, key, vars);

    const changeLang = (lng) => {
        setLanguage(lng);
        setLang(lng);
    };

    // ─── Bookings state ───
    const [active,   setActive]   = useState("current");
    const [bookings, setBookings] = useState([]);
    const [loading,  setLoading]  = useState(true);

    const loadBookings = useCallback(async () => {
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
        loadBookings();
    }, [loadBookings]);

    // ─── Auth ───
    const logout = () => {
        localStorage.removeItem("isAuthenticated");
        navigate("/login");
    };

    // ─── Render panels ───
    const renderPanel = () => {
        if (loading) return <p>{t("tester.loadingTA")}</p>;

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

    // ─── version from Vite env (instead of process.env) ───
    const version = import.meta.env.VITE_APP_VERSION || "1.0.3";

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* ───────── Sidebar ───────── */}
            <aside className="relative w-64 bg-white border-r flex flex-col overflow-y-auto">
                <div className="border-b">
                    <div className="flex items-center justify-between p-4">
            <span className="text-xl font-semibold">
              {t("admin.title")}
            </span>
                        <code className="text-sm text-gray-500">
                            {t("admin.versionPrefix")}{version}
                        </code>
                    </div>
                    <div className="px-4 pb-4">
                        <LanguagePicker onChange={changeLang} />
                    </div>
                </div>

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

                <div className="sticky bottom-0 left-0 w-full bg-white p-4 border-t space-y-2">
                    <button
                        onClick={loadBookings}
                        className="w-full flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        <IconRefresh className="mr-3 h-5 w-5 text-gray-400" />
                        {t("admin.refresh")}
                    </button>
                    <button
                        onClick={logout}
                        className="w-full flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        <IconLogout className="mr-3 h-5 w-5 text-gray-400" />
                        {t("admin.logout")}
                    </button>
                </div>
            </aside>

            {/* ───────── Main ───────── */}
            <main className="flex-1 p-6 overflow-auto">
                {renderPanel()}
            </main>
        </div>
    );
}
