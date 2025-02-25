import React, { useEffect, useState } from "react";
import {
    IconArrowDownRight,
    IconArrowUpRight,
    IconCoin,
    IconDiscount2,
    IconReceipt2,
    IconUserPlus,
} from "@tabler/icons-react";

const icons = {
    user: IconUserPlus,
    discount: IconDiscount2,
    receipt: IconReceipt2,
    coin: IconCoin,
};

export default function StatsGrid() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    // Mock fetching metrics data
    useEffect(() => {
        setLoading(true);
        // Simulate an async fetch with 1-second delay
        const timer = setTimeout(() => {
            // Fake metrics response
            const data = {
                revenue: { value: 13456, diff: 34 },
                profit: { value: 4145, diff: -13 },
                coupons: { value: 745, diff: 18 },
                newCustomers: { value: 188, diff: -30 },
            };
            setMetrics(data);
            setLoading(false);
        }, 1000);

        // Cleanup
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return <p>Loading metrics...</p>;
    }

    if (!metrics) {
        return <p>No metrics data available.</p>;
    }

    // Transform the object into an array for .map()
    const data = [
        {
            key: "revenue",
            title: "Revenue",
            icon: "receipt",
            value: metrics.revenue.value,
            diff: metrics.revenue.diff,
        },
        {
            key: "profit",
            title: "Profit",
            icon: "coin",
            value: metrics.profit.value,
            diff: metrics.profit.diff,
        },
        {
            key: "coupons",
            title: "Coupons usage",
            icon: "discount",
            value: metrics.coupons.value,
            diff: metrics.coupons.diff,
        },
        {
            key: "newCustomers",
            title: "New customers",
            icon: "user",
            value: metrics.newCustomers.value,
            diff: metrics.newCustomers.diff,
        },
    ];

    return (
        <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {data.map((stat) => {
                    const StatIcon = icons[stat.icon];
                    const DiffIcon =
                        stat.diff > 0 ? IconArrowUpRight : IconArrowDownRight;
                    const diffColor =
                        stat.diff > 0 ? "text-teal-500" : "text-red-500";

                    return (
                        <div
                            key={stat.title}
                            className="border rounded-md p-4 shadow bg-white"
                        >
                            {/* Top: Title + Icon */}
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500 font-semibold uppercase">
                                    {stat.title}
                                </p>
                                <StatIcon className="w-5 h-5 text-gray-400" />
                            </div>

                            {/* Value + diff */}
                            <div className="flex items-end space-x-2 mt-4">
                                <span className="text-2xl font-bold">{stat.value}</span>
                                <span className={`flex items-center text-sm font-semibold ${diffColor}`}>
                  <span>{stat.diff}%</span>
                  <DiffIcon className="w-4 h-4 ml-1" />
                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Compared to previous month
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
