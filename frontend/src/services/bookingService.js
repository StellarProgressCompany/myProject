import axios from "axios";
axios.defaults.baseURL = "";                       // proxy via Vite

/* Availability helpers – unchanged */
export async function fetchAvailableTimeSlots(params){
    const { data } = await axios.get("/api/table-availability",{ params });
    return data;
}
export async function fetchTableAvailabilityRange(start,end,mealType="lunch"){
    const { data } = await axios.get("/api/table-availability-range",{
        params:{ start,end,mealType }
    });
    return data;
}

/* CRUD bookings */
export async function fetchAllBookings(){
    const { data } = await axios.get("/api/bookings");
    return data.data;
}
export async function createBooking(payload){
    const { data } = await axios.post("/api/bookings",payload);
    return data;
}
export async function updateBooking(id,payload){
    const { data } = await axios.patch(`/api/bookings/${id}`,payload);
    return data;
}
export async function deleteBooking(id){
    const { data } = await axios.delete(`/api/bookings/${id}`);
    return data;
}
