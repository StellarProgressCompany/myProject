import React from "react";

const AnimatedBackground = () => {
    return (
        <div
            className="fixed inset-0 -z-10"
            style={{
                background: "linear-gradient(135deg, #f8fafc, #e2e8f0)",
            }}
        >
            {/* A subtle, professional watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <h1 className="text-gray-600 text-4xl font-bold">Stellar Progress</h1>
            </div>
        </div>
    );
};

export default AnimatedBackground;
