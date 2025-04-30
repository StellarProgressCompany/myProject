// frontend/src/components/admin/pastBookings/PastBookings.jsx

import React from "react";
import BookingsOverview from "../sharedBookings/BookingsOverview";

export default function PastBookings({ bookings }) {
    return <BookingsOverview mode="past" bookings={bookings} />;
}
