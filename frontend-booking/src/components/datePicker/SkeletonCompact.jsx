import React from "react";

export default function SkeletonCompact() {
    const days = Array.from({ length: 7 });
    return (
        <div className="flex space-x-2 overflow-x-auto p-2">
            {days.map((_,i) => (
                <div
                    key={i}
                    className="w-12 h-20 bg-gray-200 rounded animate-pulse flex flex-col items-center p-2"
                >
                    <div className="w-8 h-3 bg-gray-300 rounded mb-1" />
                    <div className="w-6 h-4 bg-gray-300 rounded mb-1" />
                    <div className="w-8 h-3 bg-gray-300 rounded" />
                </div>
            ))}
        </div>
    );
}
