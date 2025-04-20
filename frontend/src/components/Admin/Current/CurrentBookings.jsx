import React, { useState, useMemo } from "react";
import { format, addDays } from "date-fns";
import AddBookingModal  from "./AddBookingModal";
import EditBookingModal from "./EditBookingModal";

function ymd(d){ return format(d,"yyyy-MM-dd"); }
function classify(b){
    const t = b.reserved_time.slice(0,5);
    return b.meal_type==="lunch" ? (t < "15:00" ? "Lunch – 1st Round":"Lunch – 2nd Round") : "Dinner";
}

export default function CurrentBookings({ bookings, onDataRefresh }) {
    const [offset,setOff] = useState(0);
    const [addModal,setAdd] = useState(false);
    const [editBk,setEdit]  = useState(null);

    const dateObj = useMemo(()=>addDays(new Date(),offset),[offset]);
    const dateStr = ymd(dateObj);

    const buckets = useMemo(()=>{
        const init={"Lunch – 1st Round":[],"Lunch – 2nd Round":[],"Dinner":[]};
        bookings.forEach(b=>{ if((b.table_availability?.date||b.date)===dateStr) init[classify(b)].push(b); });
        return init;
    },[bookings,dateStr]);

    const totalB = Object.values(buckets).reduce((s,a)=>s+a.length,0);
    const totalC = Object.values(buckets).reduce((s,a)=>s+a.reduce((p,b)=>p+b.total_adults+b.total_kids,0),0);

    const rowClasses="odd:bg-gray-50 hover:bg-yellow-50 cursor-pointer";

    return (
        <div className="bg-white p-4 rounded shadow">
            {/* header */ }
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <h2 className="text-xl font-bold">
                    {offset===0?"Today":offset===1?"Tomorrow":format(dateObj,"EEEE, MMM d")}
                </h2>
                <div className="space-x-2">
                    <button onClick={()=>setOff(o=>o-1)} className="px-2 py-1 border rounded">◀</button>
                    <button onClick={()=>setOff(o=>o+1)} className="px-2 py-1 border rounded">▶</button>
                    <button onClick={()=>setAdd(true)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                        + Manual Booking
                    </button>
                </div>
            </div>

            {/* stats */ }
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded text-center">
                    <p className="text-xs text-gray-600">Bookings</p><p className="text-xl font-bold">{totalB}</p>
                </div>
                <div className="bg-green-50 p-3 rounded text-center">
                    <p className="text-xs text-gray-600">Total Clients</p><p className="text-xl font-bold">{totalC}</p>
                </div>
            </div>

            {/* tables */ }
            {totalB===0 ? <p className="text-gray-500">No bookings for this day.</p> :
                Object.entries(buckets).map(([label,rows])=> rows.length===0?null:(
                    <div key={label} className="mb-6">
                        <h3 className="font-semibold mb-2">{label}</h3>
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                            <tr><th className="px-3 py-2 text-left">Time</th><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Guests</th><th className="px-3 py-2 text-left">Phone</th></tr>
                            </thead>
                            <tbody>
                            {rows.sort((a,b)=>a.reserved_time.localeCompare(b.reserved_time)).map(bk=>(
                                <tr key={bk.id} className={rowClasses} onClick={()=>setEdit(bk)}>
                                    <td className="px-3 py-2">{bk.reserved_time.slice(0,5)}</td>
                                    <td className="px-3 py-2">{bk.full_name}</td>
                                    <td className="px-3 py-2">{bk.total_adults+bk.total_kids}</td>
                                    <td className="px-3 py-2">{bk.phone ?? "-"}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                ))
            }

            {addModal && (
                <AddBookingModal
                    dateObj={dateObj}
                    onClose={()=>setAdd(false)}
                    onSaved={()=>{ setAdd(false); onDataRefresh(); }}
                />
            )}
            {editBk && (
                <EditBookingModal
                    booking={editBk}
                    onClose={()=>setEdit(null)}
                    onSaved={()=>{ setEdit(null); onDataRefresh(); }}
                />
            )}
        </div>
    );
}
