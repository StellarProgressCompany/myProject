// src/services/bookingService.js

import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

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

export async function fetchAllBookings() {
    const response = await axios.get(`${API_URL}/bookings`);
    return response.data;
}

// NEW: fetch table availability for a date RANGE
export async function fetchTableAvailabilityRange(start, end, mealType = "lunch") {
    const response = await axios.get(`${API_URL}/table-availability-range`, {
        params: { start, end, mealType },
    });
    return response.data;
}
