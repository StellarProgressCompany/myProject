// frontend-admin/src/components/admin/sharedBookings/TableUsage.jsx
import React, { useState } from "react";
import PropTypes            from "prop-types";
import { updateBooking }    from "../../../services/bookingService";
import { translate, getLanguage } from "../../../services/i18n";
import { IconArrowsShuffle } from "@tabler/icons-react";

/**
 * Multi-room table-usage visualiser.
 *
 * • Renders **one grid per room**, stacked vertically.
 * • Move-mode works across rooms:
 *     – click a booked table (source)
 *     – click any empty table (target, any room)
 *     – PATCH /bookings/{id}  { room_override, capacity_override }
 *
 * Props
 * -----
 * rooms               : string[]                 (e.g. ["interior","terrace"])
 * capacityTotalsByRoom: { [room]:{cap:count} }   (same shape as backend avail.)
 * bookings            : array<Booking>           (all bookings for that day/round)
 * expanded            : bool                     (1.0 × or 1.6 × scale)
 * seatSize            : number                   (base seat size in px)
 * onRefresh           : () => void               (reload DaySchedule)
 */
export default function TableUsage({
                                       rooms               = [],
                                       capacityTotalsByRoom= {},
                                       bookings            = [],
                                       expanded            = false,
                                       seatSize            = 35,
                                       onRefresh           = () => {},
                                   }) {
    /* ─── i18n helpers ─────────────────────────────────────────── */
    const t = (k,p)=>translate(getLanguage(),k,p);

    /* ─── UI state ─────────────────────────────────────────────── */
    const [moveMode,   setMove ]   = useState(false);
    const [sourceBk,   setSrcBk]   = useState(null);   // Booking obj
    const [bouncePtr,  setBounce]  = useState(null);   // { room, idx }
    const [status,     setStatus]  = useState("");

    const reset = () => {
        setMove(false); setSrcBk(null); setBounce(null); setStatus("");
    };

    /* ─── data helpers ─────────────────────────────────────────── */
    const scale     = expanded ? 1.6 : 1;
    const sizePx    = (cap)=>cap*seatSize*scale;

    // Build one flat <div> grid for every room
    function buildGrid(room){
        /* step-1: prepare empty tables */
        const caps  = Object.keys(capacityTotalsByRoom[room]||{})
            .map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
        const tableGrid = [];
        caps.forEach(cap=>{
            for(let i=0;i<(capacityTotalsByRoom[room]?.[cap]||0);i++){
                tableGrid.push({ cap, booked:false, booking:null, room });
            }
        });

        /* step-2: place bookings of that room */
        const ptr={}; caps.forEach(c=>(ptr[c]=0));
        bookings.filter(b=>b.table_availability?.room===room).forEach(bk=>{
            const cap = bk.table_availability?.capacity;
            let idx=-1, seen=0;
            for(let i=0;i<tableGrid.length;i++){
                if(tableGrid[i].cap===cap){
                    if(seen===ptr[cap]){ idx=i; break; }
                    seen++;
                }
            }
            if(idx!==-1){
                tableGrid[idx]={ ...tableGrid[idx],
                    booked : true,
                    booking: bk,
                    name   : bk.full_name,
                    guests : (bk.total_adults||0)+(bk.total_kids||0),
                };
            }
            ptr[cap]++;
        });
        return tableGrid;
    }

    /* ─── event helpers ────────────────────────────────────────── */
    const selectable = (tbl)=>{
        if(!moveMode) return false;
        if(!sourceBk) return tbl.booked;        // step-1: pick booking
        return !tbl.booked;                     // step-2: pick empty table
    };

    const cls = (tbl,room,idx)=>{
        let c = `relative flex flex-col items-center justify-center
                 border rounded-2xl shadow-sm ${
            tbl.booked?"bg-green-300":"bg-gray-200"
        }`;
        if(sourceBk && tbl.room===sourceBk.table_availability?.room && idx===sourceBk.__gridIndex)
            c+=" ring-4 ring-amber-400 bg-amber-200";
        if(bouncePtr && bouncePtr.room===room && bouncePtr.idx===idx) c+=" animate-bounce";
        if(selectable(tbl))        c+=" cursor-pointer hover:ring-2 hover:ring-indigo-400";
        if(moveMode && !selectable(tbl)) c+=" cursor-not-allowed opacity-50";
        return c;
    };

    const handleClick = async (tbl,room,idx)=>{
        if(!moveMode) return;

        /* pick source */
        if(!sourceBk){
            if(!tbl.booked) return;
            tbl.booking.__gridIndex = idx;  // store to match highlight
            setSrcBk(tbl.booking);
            setStatus(t("tableUsage.pickTarget")||"Tap an empty table");
            return;
        }
        /* pick target */
        if(tbl.booked) return;
        try{
            setStatus(t("tableUsage.moving")||"Moving…");
            await updateBooking(sourceBk.id, {
                room:      room,       // <- whatever your backend expects
                capacity:  tbl.cap,
            });
            await onRefresh();       // ask parent to re-fetch right away
            reset();                 // leave move-mode
        }catch(e){
            console.error(e);
            setStatus(e.response?.data?.error||"Error");
            setTimeout(reset,1500);
        }
    };

    /* ─── render ───────────────────────────────────────────────── */
    return (
        <div className="mt-3 space-y-6">
            {/* header */}
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{t("tableUsage.title")}</p>
                <button
                    onClick={()=>{
                        if(moveMode) reset();
                        else{
                            setMove(true);
                            setStatus(t("tableUsage.pickSource")||"Tap a booked table");
                        }
                    }}
                    className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium shadow
                        ${moveMode
                        ?"bg-red-600 text-white hover:bg-red-700"
                        :"bg-indigo-600 text-white hover:bg-indigo-700"}`}
                >
                    <IconArrowsShuffle className="w-4 h-4"/>
                    {moveMode
                        ? t("tableUsage.cancel")||"Cancel"
                        : t("tableUsage.move")  ||"Move booking"}
                </button>
            </div>
            {status && <p className="text-xs italic text-gray-600">{status}</p>}

            {/* one grid per room */}
            {rooms.map(room=>{
                const grid = buildGrid(room);
                return (
                    <div key={room}>
                        <h5 className="text-sm font-bold mb-2 capitalize">{room}</h5>
                        <div className="flex flex-wrap gap-3 select-none">
                            {grid.map((tbl,idx)=>(
                                <div
                                    key={idx}
                                    className={cls(tbl,room,idx)}
                                    style={{width:sizePx(tbl.cap),height:sizePx(tbl.cap)*0.75}}
                                    title={tbl.booked
                                        ? `${tbl.name} (${tbl.guests})`
                                        : `${tbl.cap}-top`}
                                    onClick={()=>handleClick(tbl,room,idx)}
                                >
                                    {tbl.booked?(
                                        <>
                                            <span className="text-xs font-semibold truncate px-1 max-w-[90%]">
                                                {tbl.name}
                                            </span>
                                            <span className="text-xs">
                                                {tbl.guests}/{tbl.cap}
                                            </span>
                                        </>
                                    ):(
                                        <span className="text-xs text-gray-600">{tbl.cap}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

TableUsage.propTypes = {
    rooms               : PropTypes.arrayOf(PropTypes.string),
    capacityTotalsByRoom: PropTypes.object,
    bookings            : PropTypes.array,
    expanded            : PropTypes.bool,
    seatSize            : PropTypes.number,
    onRefresh           : PropTypes.func,
};
