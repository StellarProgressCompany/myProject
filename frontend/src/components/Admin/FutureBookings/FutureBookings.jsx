import React from "react";
import BookingsOverview from "../SharedBookings/BookingsOverview";

// eslint-disable-next-line react/prop-types
export default function FutureBookings({ bookings }) {
    return <BookingsOverview mode="future" bookings={bookings} />;
}
