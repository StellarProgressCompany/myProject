import axios from "axios";
axios.defaults.baseURL = ""; // proxy via Vite

/* ──────────────────────────────────────────────
   Simple in-memory cache that deduplicates calls
   to /api/table-availability-range.              ───────────────────────────────────────────── */
const _taCache = new Map();
const buildKey = (start, end, meal) => `${start}|${end}|${meal}`;

export async function fetchTableAvailabilityRange(
    start,
    end,
    mealType = "lunch"
) {
    const key = buildKey(start, end, mealType);
    const hit = _taCache.get(key);

    /* ① return cached result (resolved) */
    if (hit?.status === "resolved") return hit.data;

    /* ② attach to the pending promise if already in flight */
    if (hit?.status === "pending") return hit.promise;

    /* ③ otherwise perform the request and cache both the
          pending promise and (when it resolves) the data     */
    const promise = axios
        .get("/api/table-availability-range", {
            params: { start, end, mealType },
        })
        .then((res) => {
            _taCache.set(key, { status: "resolved", data: res.data });
            return res.data;
        })
        .catch((err) => {
            /* remove the entry so a later retry is possible */
            _taCache.delete(key);
            throw err;
        });

    _taCache.set(key, { status: "pending", promise });
    return promise;
}

/* ──────────────────────────────────────────────
   Other booking-related helpers (unchanged)      ───────────────────────────────────────────── */
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
