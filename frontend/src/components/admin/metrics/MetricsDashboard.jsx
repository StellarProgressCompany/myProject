// frontend/src/components/admin/metrics/MetricsDashboard.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";

import StatsGrid        from "./StatsGrid";
import BookingsOverview from "../sharedBookings/BookingsOverview";
import { translate, getLanguage } from "../../../services/i18n";

export default function MetricsDashboard({ bookings }) {
    const lang = getLanguage();
    const t    = (k, p) => translate(lang, k, p);

    /* start in COMPACT view */
    const [view, setView] = useState("compact");
    const [windowBookings, setWindowBookings] = useState(bookings);

    return (
        <div className="space-y-8">
            {/* view toggle */}
            <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">
          {t("admin.calendar")} / {t("admin.compact")}:
        </span>
                <button
                    onClick={() => setView("calendar")}
                    className={`px-3 py-1 rounded ${
                        view === "calendar" ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                >
                    {t("admin.calendar")}
                </button>
                <button
                    onClick={() => setView("compact")}
                    className={`px-3 py-1 rounded ${
                        view === "compact" ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                >
                    {t("admin.compact")}
                </button>
            </div>

            {/* KPI grid */}
            <StatsGrid bookings={windowBookings} />

            {/* explorer – FUTURE mode but labelled simply “Bookings” */}
            <BookingsOverview
                mode="future"
                bookings={bookings}
                showChart={true}
                allowDrill={false}
                view={view}
                hideViewToggle
                onViewChange={setView}
                onWindowChange={setWindowBookings}
                customTitle="Bookings"          // ★ title override
            />
        </div>
    );
}

MetricsDashboard.propTypes = {
    bookings: PropTypes.arrayOf(PropTypes.object).isRequired,
};
