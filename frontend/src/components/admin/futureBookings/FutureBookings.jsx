// frontend/src/components/admin/futureBookings/FutureBookings.jsx
// (unchanged – reproduced verbatim)

import React from "react";
import BookingsOverview from "../sharedBookings/BookingsOverview";

// eslint-disable-next-line react/prop-types
export default function FutureBookings({ bookings }) {
    return <BookingsOverview mode="future" bookings={bookings} />;
}
