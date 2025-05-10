// frontend/src/components/admin/sharedBookings/TableUsage.jsx
import React, { useState } from "react";
import PropTypes           from "prop-types";
import { updateBooking }   from "../../../services/bookingService";
import { translate, getLanguage } from "../../../services/i18n";
import { IconArrowsShuffle } from "@tabler/icons-react";

export default function TableUsage({
                                       capacityTotals = {},
                                       bookings       = [],
                                       expanded       = false,
                                       seatSize       = 35,
                                       onRefresh      = () => {},
                                   }) {
    /* ── i18n helpers ────────────────────────────────────────── */
    const lang = getLanguage();
    const t    = (k,p) => translate(lang, k, p);

    /* ── local UI state ──────────────────────────────────────── */
    const [moveMode,      setMoveMode]      = useState(false);
    const [sourceBk,      setSourceBk]      = useState(null); // booking obj
    const [sourceIdx,     setSourceIdx]     = useState(null); // table index
    const [bounceIdx,     setBounceIdx]     = useState(null); // anim target
    const [status,        setStatus]        = useState("");

    const resetMove = () => {
        setMoveMode(false);
        setSourceBk(null);
        setSourceIdx(null);
        setBounceIdx(null);
        setStatus("");
    };

    /* ── build table grid  (same algorithm as before) ────────── */
    const caps = Object.keys(capacityTotals)
        .map(Number)
        .filter(Number.isFinite)
        .sort((a,b) => a-b);

    const tables = [];       // flattened grid
    caps.forEach(cap => {
        for (let i=0;i<(capacityTotals[cap]||0);i++){
            tables.push({ cap, booked:false, booking:null });
        }
    });

    /* place bookings */
    const ptr = {}; caps.forEach(c => (ptr[c]=0));
    bookings.forEach(bk=>{
        const cap = bk.table_availability?.capacity || 0;
        let idx=-1, seen=0;
        for (let i=0;i<tables.length;i++){
            if (tables[i].cap===cap){
                if (seen===ptr[cap]){ idx=i; break; }
                seen++;
            }
        }
        if (idx!==-1){
            tables[idx] = {
                cap,
                booked : true,
                booking: bk,
                name   : bk.full_name,
                guests : (bk.total_adults||0)+(bk.total_kids||0),
            };
        }
        ptr[cap]++;
    });

    /* ── helpers for style / pointer / clickability ──────────── */
    const scale  = expanded ? 1.6 : 1;
    const sizePx = (cap)=>cap*seatSize*scale;

    const selectable = (tbl) => {
        if (!moveMode) return false;
        if (!sourceBk)               return tbl.booked;                 // step 1
        /* step 2 – any EMPTY table is ok */
        return !tbl.booked;
    };

    const classForTable = (tbl, idx) => {
        let cls = `relative flex flex-col items-center justify-center 
                   border rounded-2xl shadow-sm ${
            tbl.booked ? "bg-green-300" : "bg-gray-200"
        }`;

        if (idx===sourceIdx) cls += " ring-4 ring-amber-400 bg-amber-200";
        if (idx===bounceIdx) cls += " animate-bounce";
        if (selectable(tbl))  cls += " cursor-pointer hover:ring-2 hover:ring-indigo-400";
        if (moveMode && !selectable(tbl)) cls += " cursor-not-allowed opacity-50";

        return cls;
    };

    /* ── click handler ───────────────────────────────────────── */
    const handleClick = async (tbl, idx)=>{
        if (!moveMode) return;

        /* step ① – pick a booked source table */
        if (!sourceBk){
            if (!tbl.booked) return;
            setSourceBk(tbl.booking);
            setSourceIdx(idx);
            setStatus(t("tableUsage.pickTarget")||"Tap an empty table");
            return;
        }

        /* step ② – pick ANY empty table */
        if (tbl.booked) return;

        try{
            setStatus(t("tableUsage.moving")||"Moving…");
            await updateBooking(sourceBk.id,{ capacity_override: tbl.cap });
            setBounceIdx(idx);
            setStatus(t("tableUsage.done")||"Done!");

            /* let the bounce play, then refresh */
            setTimeout(async ()=>{
                await onRefresh();
                window.location.reload();
            }, 550);
        }catch(err){
            console.error(err);
            setStatus(err.response?.data?.error || "Error");
            setTimeout(resetMove, 1500);
        }
    };

    /* ── render ──────────────────────────────────────────────── */
    return (
        <div className="mt-3 space-y-3">
            {/* header row */}
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{t("tableUsage.title")}</p>

                <button
                    onClick={()=>{
                        if (moveMode) resetMove();
                        else{
                            setMoveMode(true);
                            setStatus(t("tableUsage.pickSource")||"Tap a booked table");
                        }
                    }}
                    className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium shadow
                        ${
                        moveMode
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                >
                    <IconArrowsShuffle className="w-4 h-4"/>
                    {moveMode
                        ? t("tableUsage.cancel")||"Cancel"
                        : t("tableUsage.move")  ||"Move booking"}
                </button>
            </div>

            {status && <p className="text-xs italic text-gray-600">{status}</p>}

            {/* table grid */}
            <div className="flex flex-wrap gap-3 select-none">
                {tables.map((tbl,idx)=>(
                    <div
                        key={idx}
                        className={classForTable(tbl,idx)}
                        style={{ width:sizePx(tbl.cap), height:sizePx(tbl.cap)*0.75 }}
                        title={tbl.booked
                            ? `${tbl.name} (${tbl.guests})`
                            : `${tbl.cap}-top`}
                        onClick={()=>handleClick(tbl,idx)}
                    >
                        {tbl.booked ? (
                            <>
                                <span className="text-xs font-semibold truncate px-1 max-w-[90%]">
                                    {tbl.name}
                                </span>
                                <span className="text-xs">
                                    {tbl.guests}/{tbl.cap}
                                </span>
                            </>
                        ):(
                            <span className="text-xs text-gray-600">
                                {tbl.cap}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

TableUsage.propTypes = {
    capacityTotals: PropTypes.objectOf(PropTypes.number),
    bookings:       PropTypes.array,
    expanded:       PropTypes.bool,
    seatSize:       PropTypes.number,
    onRefresh:      PropTypes.func,
};
