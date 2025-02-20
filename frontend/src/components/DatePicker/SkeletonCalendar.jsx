// src/components/DatePicker/SkeletonCalendar.jsx
import React from "react";

const SkeletonCalendar = () => {
    const totalCells = 6 * 7; // up to 6 rows of 7 days
    const skeletonCells = Array.from({ length: totalCells });

    return (
        <div>
            {/* Month header placeholder */}
            <div className="flex justify-between items-center mb-2">
                <div className="p-2 bg-gray-200 w-8 h-5 rounded animate-pulse"></div>
                <div className="p-2 bg-gray-200 w-32 h-5 rounded animate-pulse"></div>
                <div className="p-2 bg-gray-200 w-8 h-5 rounded animate-pulse"></div>
            </div>
            {/* Grid skeleton */}
            <div className="grid grid-cols-7 gap-2">
                {skeletonCells.map((_, i) => (
                    <div
                        key={i}
                        className="animate-pulse w-10 h-10 bg-gray-200 rounded m-1"
                    ></div>
                ))}
            </div>
        </div>
    );
};

export default SkeletonCalendar;
