// frontend/src/components/admin/metrics/MetricsDashboard.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";

import StatsGrid from "./StatsGrid";
import BookingsOverview from "../sharedBookings/BookingsOverview";
import { translate, getLanguage } from "../../../services/i18n";

export default function MetricsDashboard({ bookings }) {
    const lang = getLanguage();
    const t = (k, p) => translate(lang, k, p);

    /* keep track of the bookings slice for the KPI grid */
    const [windowBookings, setWindowBookings] = useState(bookings);

    return (
        <div className="space-y-8">
            {/* KPI grid */}
            <StatsGrid bookings={windowBookings} />

            {/* Explorer: FUTURE mode, with chart and explicit view toggle */}
            <BookingsOverview
                mode="future"
                bookings={bookings}
                showChart={true}
                allowDrill={false}
                onWindowChange={setWindowBookings}
                customTitle={t("overview.bookings")}
                hideViewToggle={false}
            />
        </div>
    );
}

MetricsDashboard.propTypes = {
    bookings: PropTypes.arrayOf(PropTypes.object).isRequired,
};
