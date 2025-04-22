import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

export default function TimeSlotStep({
                                         mealType,
                                         date,
                                         timeSlotData,
                                         selectedRound,
                                         onSelectRound,
                                         isLoading,
                                         error,
                                         onBack,
                                         onContinue,
                                     }) {
    const [selectedTime, setSelectedTime] = useState(null);

    useEffect(() => {
        setSelectedTime(null);
    }, [selectedRound]);

    const generateTimeOptions = (meal, round) => {
        let start, end;
        if (meal==="lunch" && round==="first_round") {
            start="13:00"; end="14:00";
        } else if (meal==="lunch" && round==="second_round") {
            start="15:00"; end="16:00";
        } else if (meal==="dinner" && round==="dinner_round") {
            start="20:00"; end="22:00";
        } else {
            return [];
        }
        const opts = [];
        const [sh,sm]=start.split(":").map(Number);
        const [eh,em]=end  .split(":").map(Number);
        for (let t=sh*60+sm; t<=eh*60+em; t+=15) {
            const hh=String(Math.floor(t/60)).padStart(2,"0");
            const mm=String(t%60       ).padStart(2,"0");
            opts.push(`${hh}:${mm}:00`);
        }
        return opts;
    };

    const next = () => {
        if (!selectedRound) return alert("Pick a round.");
        if (!selectedTime)  return alert("Pick a time.");
        onContinue(selectedTime);
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6 text-center">
                Select a Round
            </h2>
            <p className="mb-4 text-center">
                Available rounds for {mealType==="lunch" ? "Comida" : "Cena"} on{" "}
                {date.toLocaleDateString()}:
            </p>

            {isLoading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {mealType==="lunch" && timeSlotData && (
                        <>
                            <button
                                onClick={()=>onSelectRound("first_round")}
                                className={`px-4 py-2 rounded border text-center ${
                                    selectedRound==="first_round"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100"
                                }`}
                            >
                                1st Round
                                <br />
                                <span className="text-xs">{timeSlotData.first_round?.note}</span>
                            </button>
                            <button
                                onClick={()=>onSelectRound("second_round")}
                                className={`px-4 py-2 rounded border text-center ${
                                    selectedRound==="second_round"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100"
                                }`}
                            >
                                2nd Round
                                <br />
                                <span className="text-xs">
                  {timeSlotData.second_round?.note}
                </span>
                            </button>
                        </>
                    )}

                    {mealType==="dinner" && timeSlotData && (
                        <button
                            onClick={()=>onSelectRound("dinner_round")}
                            className={`col-span-2 px-4 py-2 rounded border text-center ${
                                selectedRound==="dinner_round"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100"
                            }`}
                        >
                            Dinner
                            <br />
                            <span className="text-xs">
                {timeSlotData.dinner_round?.note}
              </span>
                        </button>
                    )}
                </div>
            )}

            {/* time buttons */}
            {selectedRound && (
                <div className="mt-4 p-4 border rounded bg-gray-50">
                    <p className="text-center font-medium mb-2">Select a Time</p>
                    <div className="grid grid-cols-4 gap-2">
                        {generateTimeOptions(mealType, selectedRound).map((t) => (
                            <button
                                key={t}
                                onClick={() => setSelectedTime(t)}
                                className={`px-2 py-1 rounded border text-center ${
                                    selectedTime===t
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 hover:bg-blue-200"
                                }`}
                            >
                                {t.slice(0,5)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {error && <p className="text-red-500 mt-4">{error}</p>}

            <div className="flex justify-between mt-6">
                <button onClick={onBack}    className="px-4 py-2 border rounded">
                    Back
                </button>
                <button onClick={next}      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Continue
                </button>
            </div>
        </div>
    );
}

TimeSlotStep.propTypes = {
    mealType:      PropTypes.oneOf(["lunch","dinner"]).isRequired,
    date:          PropTypes.instanceOf(Date).isRequired,
    timeSlotData:  PropTypes.object,
    selectedRound: PropTypes.string,
    onSelectRound: PropTypes.func.isRequired,
    isLoading:     PropTypes.bool,
    error:         PropTypes.string,
    onBack:        PropTypes.func.isRequired,
    onContinue:    PropTypes.func.isRequired,
};
