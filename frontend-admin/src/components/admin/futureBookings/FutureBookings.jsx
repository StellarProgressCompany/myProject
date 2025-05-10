// frontend/src/components/admin/futureBookings/FutureBookings.jsx

import React from "react";
import BookingsOverview from "../sharedBookings/BookingsOverview";

// eslint-disable-next-line react/prop-types
export default function FutureBookings({ bookings }) {
    return (
        <BookingsOverview
            mode="future"
            bookings={bookings}
            showChart={false}
            allowDrill={true}
        />
    );
}
