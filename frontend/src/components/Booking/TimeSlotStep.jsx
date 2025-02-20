import React, { useState, useEffect } from "react";

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
    // Local state to store the user's chosen time option.
    const [selectedTime, setSelectedTime] = useState(null);

    // Whenever the round selection changes, clear the previously selected time.
    useEffect(() => {
        setSelectedTime(null);
    }, [selectedRound]);

    // Helper: Generate time options (in "HH:MM:00" format) based on the meal and round.
    const generateTimeOptions = (mealType, round) => {
        let start, end;
        if (mealType === "lunch" && round === "first_round") {
            start = "12:30";
            end = "14:00";
        } else if (mealType === "lunch" && round === "second_round") {
            start = "15:00";
            end = "16:00";
        } else if (mealType === "dinner" && round === "dinner_round") {
            start = "20:00";
            end = "22:00";
        } else {
            return [];
        }
        const options = [];
        const [startHour, startMinute] = start.split(":").map(Number);
        const [endHour, endMinute] = end.split(":").map(Number);
        const startTotal = startHour * 60 + startMinute;
        const endTotal = endHour * 60 + endMinute;
        for (let minutes = startTotal; minutes <= endTotal; minutes += 15) {
            const hh = Math.floor(minutes / 60).toString().padStart(2, "0");
            const mm = (minutes % 60).toString().padStart(2, "0");
            options.push(`${hh}:${mm}:00`);
        }
        return options;
    };

    // Render time options popup if a round is selected.
    const renderTimePopup = () => {
        if (!selectedRound) return null;
        const timeOptions = generateTimeOptions(mealType, selectedRound);
        if (timeOptions.length === 0) return null;
        return (
            <div className="mt-4 p-4 border rounded bg-gray-50">
                <p className="text-center font-medium mb-2">Select a Time</p>
                <div className="grid grid-cols-4 gap-2">
                    {timeOptions.map((timeOption) => (
                        <button
                            key={timeOption}
                            onClick={() => setSelectedTime(timeOption)}
                            className={`px-2 py-1 rounded border text-center transition-colors duration-200 ${
                                selectedTime === timeOption
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-black hover:bg-blue-200"
                            }`}
                        >
                            {timeOption.slice(0, 5)}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    // Handle Continue: Only proceed if both a round and a time have been selected.
    const handleContinue = () => {
        if (!selectedRound) {
            alert("Please select a round.");
            return;
        }
        if (!selectedTime) {
            alert("Please select a time.");
            return;
        }
        // If both are selected, pass them up (if needed, you can modify onContinue to accept the time).
        onContinue(selectedTime);
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6 text-center">
                Select a Round
            </h2>
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
                                    selectedRound === "first_round"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-black"
                                }`}
                            >
                                First Round
                                <br />
                                <span className="text-xs">
                  {timeSlotData.first_round.note}
                </span>
                            </button>
                            <button
                                onClick={() => onSelectRound("second_round")}
                                className={`px-4 py-2 rounded border text-center ${
                                    selectedRound === "second_round"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-black"
                                }`}
                            >
                                Second Round
                                <br />
                                <span className="text-xs">
                  {timeSlotData.second_round.note}
                </span>
                            </button>
                        </>
                    ) : mealType === "dinner" && timeSlotData ? (
                        <button
                            onClick={() => onSelectRound("dinner_round")}
                            className={`col-span-2 px-4 py-2 rounded border text-center ${
                                selectedRound === "dinner_round"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-black"
                            }`}
                        >
                            Dinner Round
                            <br />
                            <span className="text-xs">
                {timeSlotData.dinner_round.note}
              </span>
                        </button>
                    ) : (
                        <p className="col-span-2 text-center">No available rounds.</p>
                    )}
                </div>
            )}
            {/* Render the time selection popup if a round has been chosen */}
            {selectedRound && renderTimePopup()}
            {error && <p className="text-red-500 mt-4">{error}</p>}
            <div className="flex justify-between mt-6">
                <button onClick={onBack} className="px-4 py-2 border rounded">
                    Back
                </button>
                <button
                    onClick={handleContinue}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 hover:shadow-lg transition-all duration-200"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default TimeSlotStep;
