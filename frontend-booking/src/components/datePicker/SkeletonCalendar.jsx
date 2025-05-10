import React from "react";

export default function SkeletonCalendar() {
    const cells = Array.from({ length: 42 });
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <div className="w-8 h-5 bg-gray-200 animate-pulse rounded" />
                <div className="w-32 h-5 bg-gray-200 animate-pulse rounded" />
                <div className="w-8 h-5 bg-gray-200 animate-pulse rounded" />
            </div>
            <div className="grid grid-cols-7 gap-2">
                {cells.map((_,i) => (
                    <div key={i} className="w-10 h-10 bg-gray-200 rounded animate-pulse m-1" />
                ))}
            </div>
        </div>
    );
}
