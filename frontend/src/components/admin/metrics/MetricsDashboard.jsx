// frontend/src/components/admin/metrics/MetricsDashboard.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";

import StatsGrid from "./StatsGrid";
import BookingsOverview from "../sharedBookings/BookingsOverview";
import { translate, getLanguage } from "../../../services/i18n";

export default function MetricsDashboard({ bookings }) {
    const lang = getLanguage();
    const t    = (k, p) => translate(lang, k, p);

    /* user-controlled window view */
    const [view, setView] = useState("calendar");  // default to month view
    const [windowBookings, setWindowBookings] = useState(bookings);

    return (
        <div className="space-y-8">
            {/* view selector */}
            <div className="flex items-center space-x-4">
                <span className="text-sm font-semibold">{t("admin.calendar")} / {t("admin.compact")}:</span>
                <button
                    onClick={() => setView("calendar")}
                    className={`px-3 py-1 rounded ${view==="calendar" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                >
                    {t("admin.calendar")}
                </button>
                <button
                    onClick={() => setView("compact")}
                    className={`px-3 py-1 rounded ${view==="compact" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                >
                    {t("admin.compact")}
                </button>
            </div>

            {/* KPI grid for the selected window */}
            <StatsGrid bookings={windowBookings} />

            {/* bookings explorer (past-mode) */}
            <BookingsOverview
                mode="past"
                bookings={bookings}
                showChart={true}
                allowDrill={false}
                view={view}
                hideViewToggle     /* hide internal selector */
                onViewChange={setView}
                onWindowChange={setWindowBookings}
            />
        </div>
    );
}

MetricsDashboard.propTypes = {
    bookings: PropTypes.arrayOf(PropTypes.object).isRequired,
};
