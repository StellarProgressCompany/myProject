import React, { useMemo } from "react";
import PropTypes            from "prop-types";
import { Bar }              from "react-chartjs-2";
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
}                           from "chart.js";
import { format, addDays }  from "date-fns";
import { enUS, es as esLocale, ca as caLocale } from "date-fns/locale";
import { translate, getLanguage } from "../../../services/i18n";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const localeMap = { en: enUS, es: esLocale, ca: caLocale };

export default function BookingsChart({ bookings, startDate, days }) {
    const lang   = getLanguage();
    const t      = (k, p) => translate(lang, k, p);
    const locale = localeMap[lang] || enUS;

    /* ─── aggregate guests per-day ─── */
    const counts = useMemo(() => {
        return bookings.reduce((map, b) => {
            const d = b.table_availability?.date || b.date;
            const g = (b.total_adults || 0) + (b.total_kids || 0);
            map[d]  = (map[d] || 0) + g;
            return map;
        }, {});
    }, [bookings]);

    /* ─── build labels + series for the required window ─── */
    const { labels, data } = useMemo(() => {
        const lab = [], dat = [];
        for (let i = 0; i < days; i++) {
            const d   = addDays(startDate, i);
            const key = format(d, "yyyy-MM-dd");
            lab.push(format(d, "MMM d", { locale }));
            dat.push(counts[key] || 0);
        }
        return { labels: lab, data: dat };
    }, [counts, startDate, days, locale]);

    const chartData = useMemo(() => ({
        labels,
        datasets: [{
            id:    "guests",
            label: t("chart.totalPeople"),
            data,
            backgroundColor: "#4F46E5",
            borderRadius:    5,
            barPercentage:   0.6,
        }],
    }), [labels, data, t]);

    const options = {
        plugins: {
            legend:  { display: false },
            tooltip: {
                backgroundColor: "rgba(0,0,0,0.7)",
                titleFont: { size: 14 },
                bodyFont:  { size: 12 },
                padding:   10,
            },
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: "#9CA3AF" } },
            y: {
                beginAtZero: true,
                grid:  { color: "#E5E7EB" },
                ticks: { color: "#9CA3AF", stepSize: 1 },
            },
        },
        maintainAspectRatio: false,
    };

    return (
        <div className="p-4 bg-white rounded shadow">
            <h3 className="text-lg font-bold mb-4">
                {t("chart.titleTotalPeople")}
            </h3>
            <div className="w-full" style={{ height: 300 }}>
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
}

BookingsChart.propTypes = {
    bookings:  PropTypes.arrayOf(PropTypes.object).isRequired,
    startDate: PropTypes.instanceOf(Date).isRequired,
    days:      PropTypes.number.isRequired,
};
