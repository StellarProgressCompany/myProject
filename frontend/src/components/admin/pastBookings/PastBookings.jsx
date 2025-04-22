import React from "react";
import BookingsOverview from "../sharedBookings/BookingsOverview";

// eslint-disable-next-line react/prop-types
export default function PastBookings({ bookings }) {
    return <BookingsOverview mode="past" bookings={bookings} />;
}
