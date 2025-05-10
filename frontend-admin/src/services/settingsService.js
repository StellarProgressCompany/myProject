import axios from "axios";

/* ───────────────────────────────
   Close / open a specific day
   ─────────────────────────────── */

/**
 * Mark a calendar day as “closed”.
 * Backend will usually toggle, but we expose
 * a single-purpose helper for clarity.
 *
 * @param {string} dateYMD – “YYYY-MM-DD”
 */
export async function closeSpecificDay(dateYMD) {
    const { data } = await axios.post("/api/closed-days/toggle", {
        date: dateYMD,
    });
    return data;           // whatever the API echoes back
}

/* ───────────────────────────────
   Booking-window helpers
   ─────────────────────────────── */

/**
 * Extend the booking window so guests can
 * book **up to and including** this date.
 *
 * @param {string} dateYMD – “YYYY-MM-DD”
 */
export async function openBookingWindowUntil(dateYMD) {
    const { data } = await axios.put("/api/settings/booking-open-until", {
        booking_open_until: dateYMD,
    });
    return data.booking_open_until;
}
