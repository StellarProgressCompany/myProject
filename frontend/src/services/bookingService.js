import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

/**
 * Fetch available time slots for a given date and meal type.
 */
export async function fetchAvailableTimeSlots({ date, mealType }) {
    const response = await axios.get(`${API_URL}/table-availability`, {
        params: { date, mealType },
    });
    return response.data;
}

/**
 * Create a booking with the provided data.
 */
export async function createBooking(data) {
    const response = await axios.post(`${API_URL}/bookings`, data);
    return response.data;
}
