// frontend/src/components/admin/metrics/MetricsDashboard.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";

import StatsGrid from "./StatsGrid";
import BookingsOverview from "../sharedBookings/BookingsOverview";

/**
 * Shows the KPI grid plus a BookingsOverview (past-mode).
 * The KPI grid now always reflects the *currently selected*
 * window inside BookingsOverview (7-day compact window or
 * the full calendar month), so metrics are never stuck on “today”.
 */
export default function MetricsDashboard({ bookings }) {
    /* windowBookings is updated by BookingsOverview via the
       onWindowChange callback.  Default to the whole set.    */
    const [windowBookings, setWindowBookings] = useState(bookings);

    return (
        <div className="space-y-8">
            {/* KPIs for the visible window */}
            <StatsGrid bookings={windowBookings} />

            {/* Past bookings list / chart.  We pass the callback so the
                KPI grid stays in-sync with whatever the user is viewing. */}
            <BookingsOverview
                mode="past"
                bookings={bookings}
                showChart={true}
                allowDrill={false}
                onWindowChange={setWindowBookings}
            />
        </div>
    );
}

MetricsDashboard.propTypes = {
    bookings: PropTypes.arrayOf(PropTypes.object).isRequired,
};
