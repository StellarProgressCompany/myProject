import React from "react";
import PropTypes from "prop-types";

/**
 * TableUsage – schematic floor‑plan.
 */
export default function TableUsage({ capacityTotals = {}, bookings = [], expanded = false }) {
    const tables = [];
    [2, 4, 6].forEach((cap) => {
        const count = capacityTotals[cap] || 0;
        for (let i = 0; i < count; i++) tables.push({ cap, booked: false });
    });

    /* mark booked tables */
    const freePtr = { 2: 0, 4: 0, 6: 0 };
    bookings.forEach((bk) => {
        const cap = bk.table_availability?.capacity || 0;
        let idx = -1,
            seen = 0;
        for (let i = 0; i < tables.length; i++) {
            if (tables[i].cap === cap) {
                if (seen === freePtr[cap]) {
                    idx = i;
                    break;
                }
                seen++;
            }
        }
        if (idx !== -1) {
            tables[idx] = { cap, booked: true, name: bk.full_name, guests: bk.total_adults + bk.total_kids };
        }
        freePtr[cap]++;
    });

    /* sizes */
    const k = expanded ? 1.6 : 1;
    const baseW = { 2: 70, 4: 140, 6: 210 };
    const size = (cap) => baseW[cap] * k;
    const bg   = (t) => (t.booked ? "bg-green-300" : "bg-gray-200");

    return (
        <div className="mt-3">
            <p className="text-sm font-semibold mb-1">Table Usage</p>
            <div className="flex flex-wrap gap-3">
                {tables.map((t, i) => (
                    <div
                        key={i}
                        className={`relative flex flex-col items-center justify-center border rounded-2xl shadow-sm ${bg(t)}`}
                        style={{ width: size(t.cap), height: size(t.cap) * 0.75 }}
                        title={t.booked ? `${t.name} (${t.guests})` : `${t.cap}-top`}
                    >
                        {t.booked ? (
                            <>
                                <span className="text-xs font-semibold truncate px-1 max-w-[90%]">{t.name}</span>
                                <span className="text-xs">{t.guests}/{t.cap}</span>
                            </>
                        ) : (
                            <span className="text-xs text-gray-600">{t.cap}</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* small prop‑check to silence IDE warnings */
TableUsage.propTypes = {
    capacityTotals: PropTypes.object,
    bookings:       PropTypes.array,
    expanded:       PropTypes.bool,
};
