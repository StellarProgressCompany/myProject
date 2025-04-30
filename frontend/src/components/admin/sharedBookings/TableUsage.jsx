// frontend/src/components/admin/sharedBookings/TableUsage.jsx
import React from "react";
import PropTypes from "prop-types";
import { translate, getLanguage } from "../../../services/i18n";

export default function TableUsage({
                                       capacityTotals = {},
                                       bookings = [],
                                       expanded = false,
                                       seatSize = 35,
                                   }) {
    const lang = getLanguage();
    const t    = (k, p) => translate(lang, k, p);

    /* capacities list */
    const capacities = Object.keys(capacityTotals)
        .map(Number)
        .filter((c) => !isNaN(c))
        .sort((a, b) => a - b);

    /* flat table array */
    const tables = [];
    capacities.forEach((cap) => {
        for (let i = 0; i < (capacityTotals[cap] || 0); i++) {
            tables.push({ cap, booked: false });
        }
    });

    /* mark booked */
    const freePtr = {};
    capacities.forEach((cap) => (freePtr[cap] = 0));

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

    /* ui helpers */
    const scale   = expanded ? 1.6 : 1;
    const sizePx  = (cap) => cap * seatSize * scale;
    const bgClass = (t) => (t.booked ? "bg-green-300" : "bg-gray-200");

    return (
        <div className="mt-3">
            <p className="text-sm font-semibold mb-1">{t("tableUsage")}</p>
            <div className="flex flex-wrap gap-3">
                {tables.map((t, i) => (
                    <div
                        key={i}
                        className={`relative flex flex-col items-center justify-center border rounded-2xl shadow-sm ${bgClass(
                            t
                        )}`}
                        style={{
                            width:  sizePx(t.cap),
                            height: sizePx(t.cap) * 0.75,
                        }}
                        title={t.booked ? `${t.name} (${t.guests})` : `${t.cap}-top`}
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
