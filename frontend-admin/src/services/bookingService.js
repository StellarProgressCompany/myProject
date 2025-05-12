import axios from "axios";

// We rely on Vite's proxy for relative paths
axios.defaults.baseURL = "";

/*──────────────────────────────────────────────────────────────
  1)  NEW helper – single-day, ALL rooms
  ─────────────────────────────────────────────────────────────*/
export async function fetchTableAvailabilityMulti(date, mealType = "lunch") {
    const params = { date, mealType };
    const { data } = await axios.get("/api/table-availability-multi", { params });
    return data; // { first_round:{…}, second_round:{…}, … }
}

/*──────────────────────────────────────────────────────────────
  2)  Range helper (unchanged, still per-room)
  ─────────────────────────────────────────────────────────────*/
const _taCache = new Map();
const buildKey = (start, end, meal) => `${start}|${end}|${meal}`;

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
    if (hit?.status === "pending")  return hit.promise;

    const params  = { start, end, mealType };
    const promise = axios
        .get("/api/table-availability-range", { params })
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

/*──────────────────────────────────────────────────────────────
  3)  Helpers for booking CRUD (untouched)
  ─────────────────────────────────────────────────────────────*/
export async function fetchAvailableTimeSlots(params = {}) {
    const { date, mealType = "lunch", room } = params;
    const reqParams = {
        date,
        mealType,
        ...(room !== undefined && { room })
    };
    const { data } = await axios.get("/api/table-availability", { params: reqParams });
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
