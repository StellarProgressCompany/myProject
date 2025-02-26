import React, { useState } from "react";

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
    const [chosenTime, setChosenTime] = useState(null);

    // Debug logs
    console.log("TimeSlotStep: date =", date);
    console.log("TimeSlotStep: timeSlotData =", timeSlotData);

    // For the single-date endpoint, the shape is simply: { data: { first_round, second_round, ... } }
    // So we can grab it directly:
    const dailyData = timeSlotData?.data || null;
    console.log("TimeSlotStep: dailyData =", dailyData);

    // Check if closed
    const isClosed = dailyData?.closed === true;
    console.log("TimeSlotStep: isClosed =", isClosed);
    if (isClosed) {
        return (
            <div>
                <h2>Sorry, We Are Closed on This Day</h2>
                <button onClick={onBack}>Back</button>
            </div>
        );
    }

    // If loading
    if (isLoading) {
        return <div>Loading time slots...</div>;
    }

    // The API for a single date can have "first_round", "second_round", etc. directly on dailyData.
    const mealData = dailyData;
    console.log("TimeSlotStep: mealData =", mealData);

    // Build round options based on mealType
    let roundOptions = [];
    if (mealType === "lunch") {
        roundOptions = [
            { key: "first_round", label: "First Round", data: mealData?.first_round },
            { key: "second_round", label: "Second Round", data: mealData?.second_round },
        ];
    } else {
        // dinner
        roundOptions = [
            { key: "main_round", label: "Main Round", data: mealData?.main_round },
        ];
    }
    console.log("TimeSlotStep: roundOptions =", roundOptions);

    // If there's no data for the selected meal type:
    const hasNoData =
        !mealData?.first_round &&
        !mealData?.second_round &&
        !mealData?.main_round;
    console.log("TimeSlotStep: hasNoData =", hasNoData);
    if (hasNoData) {
        return (
            <div>
                <h2>No Availability Found</h2>
                <button onClick={onBack}>Back</button>
            </div>
        );
    }

    // Handler for continue button
    const handleContinueClick = () => {
        console.log("TimeSlotStep: chosenTime =", chosenTime);
        onContinue(chosenTime);
    };

    return (
        <div>
            <h2>Select a Time Slot</h2>

            {/* Round selection */}
            <div>
                <p>
                    Available Rounds for {mealType} on {date.toLocaleDateString()}:
                </p>
                <div className="flex space-x-4">
                    {roundOptions.map((roundObj) => {
                        const roundKey = roundObj.key;
                        const roundData = roundObj.data;
                        if (!roundData) {
                            console.log(`TimeSlotStep: round ${roundKey} has no data`);
                            return null;
                        }
                        const roundLabel = roundObj.label;
                        const isSelected = selectedRound === roundKey;
                        return (
                            <button
                                key={roundKey}
                                onClick={() => {
                                    console.log("TimeSlotStep: selected round =", roundKey);
                                    onSelectRound(roundKey);
                                    setChosenTime(null); // Reset chosen time when round changes
                                }}
                                className={
                                    isSelected
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-800"
                                }
                            >
                                {roundLabel}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Times within the selected round */}
            {selectedRound && (
                <div>
                    {(() => {
                        // Find the data for the selected round.
                        const currentRoundData = roundOptions.find(
                            (ro) => ro.key === selectedRound
                        )?.data;

                        console.log("TimeSlotStep: currentRoundData =", currentRoundData);

                        if (!currentRoundData) {
                            return <p>No data found for this round.</p>;
                        }

                        // The API returns a single time as a string (not an array)
                        const timeValue = currentRoundData.time;
                        const availability = currentRoundData.availability;
                        const note = currentRoundData.note;

                        return (
                            <div>
                                <p>Note: {note}</p>
                                <label>Select Exact Time:</label>
                                <select
                                    className="w-full border border-gray-300 rounded p-2 mt-1"
                                    value={chosenTime || ""}
                                    onChange={(e) => {
                                        console.log(
                                            "TimeSlotStep: chosenTime changed to =",
                                            e.target.value
                                        );
                                        setChosenTime(e.target.value);
                                    }}
                                >
                                    <option value="">-- Choose a time --</option>
                                    {/* If you had multiple times, you'd map them here,
                                        but the API only returns a single `time` string. */}
                                    <option value={timeValue}>{timeValue}</option>
                                </select>
                                <p>
                                    Availability:{" "}
                                    {availability ? JSON.stringify(availability) : "unknown"}
                                </p>
                            </div>
                        );
                    })()}
                </div>
            )}

            {error && <p className="text-red-500">{error}</p>}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
                <button onClick={onBack} className="px-4 py-2 border rounded">
                    Back
                </button>
                <button
                    onClick={handleContinueClick}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-all duration-200"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default TimeSlotStep;
