import React from "react";
import PropTypes from "prop-types";

/**
 * TableUsage – schematic floor‑plan.
 *
 * Props:
 *   capacityTotals: { [capacity: number]: number }
 *     e.g. { 2: 5, 4: 3, 6: 2 }
 *   bookings: Array of booking objects (with table_availability.capacity, full_name, totals, etc.)
 *   expanded: whether to zoom floor‑plan
 *   seatSize (optional): pixels per seat unit (default: 35)
 */
export default function TableUsage({
                                       capacityTotals = {},
                                       bookings = [],
                                       expanded = false,
                                       seatSize = 35,
                                   }) {
    // 1) Derive the list of all capacities from the backend data
    const capacities = Object.keys(capacityTotals)
        .map((c) => Number(c))
        .filter((c) => !isNaN(c))
        .sort((a, b) => a - b);

    // 2) Build a flat array of tables = { cap, booked? }
    const tables = [];
    capacities.forEach((cap) => {
        const count = capacityTotals[cap] || 0;
        for (let i = 0; i < count; i++) {
            tables.push({ cap, booked: false });
        }
    });

    // 3) Mark booked tables in order
    const freePtr = {};
    capacities.forEach((cap) => {
        freePtr[cap] = 0;
    });

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
            tables[idx] = {
                cap,
                booked: true,
                name: bk.full_name,
                guests: (bk.total_adults || 0) + (bk.total_kids || 0),
            };
        }
        freePtr[cap]++;
    });

    // 4) Sizing helpers
    const scale = expanded ? 1.6 : 1;
    const sizePx = (cap) => cap * seatSize * scale;
    const bgClass = (t) => (t.booked ? "bg-green-300" : "bg-gray-200");

    return (
        <div className="mt-3">
            <p className="text-sm font-semibold mb-1">Table Usage</p>
            <div className="flex flex-wrap gap-3">
                {tables.map((t, i) => (
                    <div
                        key={i}
                        className={`relative flex flex-col items-center justify-center border rounded-2xl shadow-sm ${bgClass(
                            t
                        )}`}
                        style={{ width: sizePx(t.cap), height: sizePx(t.cap) * 0.75 }}
                        title={
                            t.booked ? `${t.name} (${t.guests})` : `${t.cap}-top`
                        }
                    >
                        {t.booked ? (
                            <>
                <span className="text-xs font-semibold truncate px-1 max-w-[90%]">
                  {t.name}
                </span>
                                <span className="text-xs">
                  {t.guests}/{t.cap}
                </span>
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

TableUsage.propTypes = {
    capacityTotals: PropTypes.objectOf(PropTypes.number),
    bookings:       PropTypes.array,
    expanded:       PropTypes.bool,
    seatSize:       PropTypes.number,
};
