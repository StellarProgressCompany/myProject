// src/components/Admin/Bookings/BookingsChart.jsx
import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import { parseISO, format } from "date-fns";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function groupBookingsByDay(bookings) {
    const map = {};
    bookings.forEach((b) => {
        const dateStr = b.table_availability?.date || b.date;
        const capacity = b.table_availability?.capacity || 0;
        if (!map[dateStr]) {
            map[dateStr] = { date: dateStr, totalClients: 0 };
        }
        map[dateStr].totalClients += capacity;
    });
    // Convert to array sorted by date
    const entries = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
    return entries;
}

export default function BookingsChart({ bookings }) {
    const chartData = useMemo(() => {
        const grouped = groupBookingsByDay(bookings);
        return {
            labels: grouped.map((item) => {
                const d = parseISO(item.date);
                return format(d, "MMM d");
            }),
            datasets: [
                {
                    label: "Total People",
                    data: grouped.map((item) => item.totalClients),
                    backgroundColor: "#4F46E5", // futuristic purple/blue
                    borderRadius: 5,
                    barPercentage: 0.6,
                },
            ],
        };
    }, [bookings]);

    const options = {
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: "rgba(0,0,0,0.7)",
                titleFont: { size: 14 },
                bodyFont: { size: 12 },
                padding: 10,
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: "#9CA3AF" },
            },
            y: {
                grid: { color: "#E5E7EB" },
                ticks: { color: "#9CA3AF", stepSize: 1 },
            },
        },
        maintainAspectRatio: false,
    };

    return (
        <div className="p-4 bg-white rounded shadow">
            <h3 className="text-lg font-bold mb-4">Total People Chart</h3>
            <div className="w-full" style={{ height: 300 }}>
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
}
