// src/services/bookingService.js
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

export async function fetchAvailableTimeSlots({ date, mealType }) {
    const response = await axios.get(`${API_URL}/table-availability`, {
        params: { date, mealType },
    });
    return response.data;
}

export async function fetchAvailabilityRange({ start, end, mealType }) {
    const response = await axios.get(`${API_URL}/table-availability-range`, {
        params: { start, end, mealType },
    });
    return response.data; // returns an object keyed by YYYY-MM-DD
}

export async function createBooking(data) {
    const response = await axios.post(`${API_URL}/bookings`, data);
    return response.data;
}

// NEW: fetch all bookings
export async function fetchAllBookings() {
    const response = await axios.get(`${API_URL}/bookings`);
    return response.data;
}
