// frontend/src/components/admin/currentBookings/CurrentBookings.jsx

import React, { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { format, addDays } from "date-fns";
import { enUS, es as esLocale, ca as caLocale } from "date-fns/locale";

import AddBookingModal from "./AddBookingModal";
import EditBookingModal from "./EditBookingModal";
import DaySchedule from "../sharedBookings/DaySchedule";
import { fetchTableAvailabilityRange } from "../../../services/bookingService";
import { translate, getLanguage } from "../../../services/i18n";

function SkeletonDaySchedule() {
    return (
        <div className="mt-6 border rounded bg-white p-4 shadow animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded" />
        </div>
    );
}

export default function CurrentBookings({ bookings, onDataRefresh }) {
    const lang      = getLanguage();
    const t         = (key, vars) => translate(lang, key, vars);
    const localeMap = { en: enUS, es: esLocale, ca: caLocale };
    const locale    = localeMap[lang] || enUS;

    const [offset, setOffset]               = useState(0);
    const [isAdding, setIsAdding]           = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);

    const [tableAvailability, setTableAvailability] = useState({});
    const [loadingTA, setLoadingTA]                 = useState(false);

    const dateObj = useMemo(() => addDays(new Date(), offset), [offset]);
    const dateStr = format(dateObj, "yyyy-MM-dd");

    const todaysBookings = useMemo(
        () =>
            bookings.filter(
                (b) => (b.table_availability?.date || b.date) === dateStr
            ),
        [bookings, dateStr]
    );

    const totalBookings = todaysBookings.length;
    const totalClients  = todaysBookings.reduce(
        (sum, b) => sum + (b.total_adults || 0) + (b.total_kids || 0),
        0
    );

    useEffect(() => {
        let cancelled = false;
        setLoadingTA(true);

        Promise.all([
            fetchTableAvailabilityRange(dateStr, dateStr, "lunch"),
            fetchTableAvailabilityRange(dateStr, dateStr, "dinner"),
        ])
            .then(([lunch, dinner]) => {
                if (cancelled) return;
                const merged = {};
                [lunch, dinner].forEach((src) =>
                    Object.entries(src).forEach(([d, info]) => {
                        merged[d] = merged[d]
                            ? { ...merged[d], ...info }
                            : info;
                    })
                );
                setTableAvailability(merged);
            })
            .catch(() => {
                if (!cancelled) setTableAvailability({});
            })
            .finally(() => {
                if (!cancelled) setLoadingTA(false);
            });

        return () => {
            cancelled = true;
        };
    }, [dateStr]);

    const title =
        offset === 0
            ? t("admin.today")
            : format(dateObj, "EEEE, MMMM d", { locale });

    return (
        <div className="bg-white p-4 rounded shadow">
            {/* header + controls */}
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <h2 className="text-xl font-bold">{title}</h2>
                <div className="space-x-2">
                    <button
                        onClick={() => setOffset((o) => o - 1)}
                        className="px-2 py-1 border rounded"
                    >
                        ◀
                    </button>
                    <button
                        onClick={() => setOffset((o) => o + 1)}
                        className="px-2 py-1 border rounded"
                    >
                        ▶
                    </button>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        {t("admin.manualBooking")}
                    </button>
                </div>
            </div>

            {/* metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded text-center">
                    <p className="text-xs text-gray-600">{t("admin.bookings")}</p>
                    <p className="text-xl font-bold">{totalBookings}</p>
                </div>
                <div className="bg-green-50 p-3 rounded text-center">
                    <p className="text-xs text-gray-600">{t("admin.totalClients")}</p>
                    <p className="text-xl font-bold">{totalClients}</p>
                </div>
            </div>

            {/* day schedule or skeleton */}
            {loadingTA ? (
                <SkeletonDaySchedule />
            ) : (
                <DaySchedule
                    selectedDate={dateObj}
                    bookings={todaysBookings}
                    tableAvailability={tableAvailability}
                    onClose={() => {}}
                    enableZoom
                />
            )}

            {/* add / edit modals */}
            {isAdding && (
                <AddBookingModal
                    dateObj={dateObj}
                    onClose={() => setIsAdding(false)}
                    onSaved={() => {
                        setIsAdding(false);
                        onDataRefresh();
                    }}
                />
            )}
            {editingBooking && (
                <EditBookingModal
                    booking={editingBooking}
                    onClose={() => setEditingBooking(null)}
                    onSaved={() => {
                        setEditingBooking(null);
                        onDataRefresh();
                    }}
                />
            )}
        </div>
    );
}

CurrentBookings.propTypes = {
    bookings:      PropTypes.array.isRequired,
    onDataRefresh: PropTypes.func.isRequired,
};
