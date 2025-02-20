// src/components/DatePicker/SkeletonCompact.jsx
import React from "react";

const SkeletonCompact = () => {
    const skeletonDays = Array.from({ length: 7 });

    return (
        <div className="flex space-x-2 overflow-x-auto p-2" role="list">
            {skeletonDays.map((_, i) => (
                <div
                    key={i}
                    className="animate-pulse flex flex-col items-center p-2 border rounded
                     bg-gray-200 text-gray-100 w-12 h-20"
                >
                    {/* placeholders for day text */}
                    <div className="w-8 h-3 bg-gray-300 rounded mb-1"></div>
                    <div className="w-6 h-4 bg-gray-300 rounded mb-1"></div>
                    <div className="w-8 h-3 bg-gray-300 rounded"></div>
                </div>
            ))}
        </div>
    );
};

export default SkeletonCompact;
