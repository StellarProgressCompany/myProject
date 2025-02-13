import React from "react";

const TimeSlotStep = ({
                          mealType,
                          date,
                          timeSlotData,
                          selectedRound,
                          onSelectRound,
                          isLoading,
                          error,
                          onBack,
                          onContinue,
                      }) => {
    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6 text-center">Select a Round</h2>
            <p className="mb-4 text-center">
                Available rounds for {mealType === "lunch" ? "Comida" : "Cena"} on{" "}
                {date.toLocaleDateString()}:
            </p>
            {isLoading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {mealType === "lunch" && timeSlotData ? (
                        <>
                            <button
                                onClick={() => onSelectRound("first_round")}
                                className={`px-4 py-2 rounded border text-center ${
                                    selectedRound === "first_round" ? "bg-blue-600 text-white" : "bg-gray-100 text-black"
                                }`}
                            >
                                First Round
                                <br />
                                <span className="text-xs">{timeSlotData.first_round.note}</span>
                            </button>
                            <button
                                onClick={() => onSelectRound("second_round")}
                                className={`px-4 py-2 rounded border text-center ${
                                    selectedRound === "second_round" ? "bg-blue-600 text-white" : "bg-gray-100 text-black"
                                }`}
                            >
                                Second Round
                                <br />
                                <span className="text-xs">{timeSlotData.second_round.note}</span>
                            </button>
                        </>
                    ) : mealType === "dinner" && timeSlotData ? (
                        <button
                            onClick={() => onSelectRound("dinner_round")}
                            className={`col-span-2 px-4 py-2 rounded border text-center ${
                                selectedRound === "dinner_round" ? "bg-blue-600 text-white" : "bg-gray-100 text-black"
                            }`}
                        >
                            Dinner Round
                            <br />
                            <span className="text-xs">{timeSlotData.dinner_round.note}</span>
                        </button>
                    ) : (
                        <p className="col-span-2 text-center">No available rounds.</p>
                    )}
                </div>
            )}
            {error && <p className="text-red-500 mt-4">{error}</p>}
            <div className="flex justify-between mt-6">
                <button onClick={onBack} className="px-4 py-2 border rounded">
                    Back
                </button>
                <button onClick={onContinue} className="bg-blue-600 text-white px-4 py-2 rounded">
                    Continue
                </button>
            </div>
        </div>
    );
};

export default TimeSlotStep;
