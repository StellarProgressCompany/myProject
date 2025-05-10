import axios from "axios";
axios.defaults.baseURL = ""; // proxy via Vite

/*──────────────────────────────────────────────
  Simple in-memory cache for table availability
──────────────────────────────────────────────*/
const _taCache = new Map();
const buildKey = (start, end, meal) => `${start}|${end}|${meal}`;

/**
 * Clear every cached /api/table-availability-range response.
 * Call this after any action (e.g. closing/opening a day)
 * that could invalidate previously-fetched data.
 */
export function clearAvailabilityCache() {
    _taCache.clear();
}

export async function fetchTableAvailabilityRange(
    start,
    end,
    mealType = "lunch"
) {
    const key = buildKey(start, end, mealType);
    const hit = _taCache.get(key);

    if (hit?.status === "resolved") return hit.data;

    if (hit?.status === "pending") return hit.promise;

    const promise = axios
        .get("/api/table-availability-range", {
            params: { start, end, mealType },
        })
        .then((res) => {
            _taCache.set(key, { status: "resolved", data: res.data });
            return res.data;
        })
        .catch((err) => {
            _taCache.delete(key);
            throw err;
        });

    _taCache.set(key, { status: "pending", promise });
    return promise;
}

/*──────────────────────────────────────────────
  Other booking-related helpers
──────────────────────────────────────────────*/
export async function fetchAvailableTimeSlots(params) {
    const { data } = await axios.get("/api/table-availability", { params });
    return data;
}

export async function fetchAllBookings() {
    const { data } = await axios.get("/api/bookings");
    return data.data;
}

export async function createBooking(payload) {
    const { data } = await axios.post("/api/bookings", payload);
    return data;
}

export async function updateBooking(id, payload) {
    const { data } = await axios.patch(`/api/bookings/${id}`, payload);
    return data;
}

export async function deleteBooking(id) {
    const { data } = await axios.delete(`/api/bookings/${id}`);
    return data;
}
