import axios from "axios";

export const API_URL = "http://127.0.0.1:8000/api"; // Change API URL here if needed

export async function fetchAvailableTimeSlots({ date, mealType }) {
    const response = await axios.get(`${API_URL}/table-availability`, {
        params: { date, mealType },
    });
    return response.data;
}

export async function createBooking(data) {
    const response = await axios.post(`${API_URL}/bookings`, data);
    return response.data;
}

/**
 * Easiest fix:
 * Return response.data.data directly so the calling code
 * receives the bookings array as an array.
 */
export async function fetchAllBookings() {
    const response = await axios.get(`${API_URL}/bookings`);
    // Return the .data array directly
    return response.data.data;
}


export async function fetchTableAvailabilityRange(start, end, mealType = "lunch") {
    const response = await axios.get(`${API_URL}/table-availability-range`, {
        params: { start, end, mealType },
    });
    return response.data;
}
