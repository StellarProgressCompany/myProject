// src/components/Admin/AdminChartView.jsx
import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";

/**
 * We expect `bookings` to already be filtered to the chosen date range.
 * We'll group them by day and sum up total bookings + total clients.
 */
function groupBookingsByDay(bookings) {
    const map = {};
    bookings.forEach((b) => {
        const dateStr = b.table_availability?.date || b.date;
        const capacity = b.table_availability?.capacity || 0;
        if (!map[dateStr]) {
            map[dateStr] = {
                date: dateStr,
                bookingsCount: 0,
                totalClients: 0,
            };
        }
        map[dateStr].bookingsCount += 1;
        map[dateStr].totalClients += capacity;
    });

    // Convert to array, sorted by date
    const entries = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
    return entries;
}

export default function AdminChartView({ bookings }) {
    const chartData = useMemo(() => {
        const grouped = groupBookingsByDay(bookings);
        // Convert `date` from "YYYY-MM-DD" into something friendlier for the X axis
        return grouped.map((item) => {
            // e.g. 2025-03-01 => "Mar 1"
            const parsedDate = parseISO(item.date);
            return {
                ...item,
                label: format(parsedDate, "MMM d"),
            };
        });
    }, [bookings]);

    return (
        <div className="p-4 bg-white rounded shadow">
            <h3 className="text-lg font-bold mb-4">Bookings Chart</h3>
            {chartData.length === 0 ? (
                <p className="text-gray-500">No bookings in this range.</p>
            ) : (
                <div className="w-full" style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="bookingsCount" fill="#8884d8" name="Bookings" />
                            {/* You could also add another Bar for totalClients if you want: */}
                            <Bar dataKey="totalClients" fill="#82ca9d" name="Clients" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
