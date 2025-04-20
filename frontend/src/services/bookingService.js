import axios from "axios";

// We rely on Vite's proxy: all `/api/*` requests will be forwarded to our Laravel backend.
axios.defaults.baseURL = "";

/**
 * Fetch availability for the given date & meal.
 * Vite will proxy `/api/table-availability` → http://localhost:8000/api/table-availability
 */
export async function fetchAvailableTimeSlots({ date, mealType }) {
    const response = await axios.get(`/api/table-availability`, {
        params: { date, mealType },
    });
    return response.data;
}

/**
 * Create a new booking.
 * Proxy magic handles `/api/bookings` → http://localhost:8000/api/bookings
 */
export async function createBooking(data) {
    const response = await axios.post(`/api/bookings`, data);
    return response.data;
}

/**
 * Fetch all bookings.
 */
export async function fetchAllBookings() {
    const response = await axios.get(`/api/bookings`);
    return response.data.data;
}

/**
 * Fetch availability over a date range.
 */
export async function fetchTableAvailabilityRange(start, end, mealType = "lunch") {
    const response = await axios.get(`/api/table-availability-range`, {
        params: { start, end, mealType },
    });
    return response.data;
}
