import React from "react";
import DatePicker from "../DatePicker";
import { getDayMealTypes } from "../DatePicker/datePickerUtils";

// Stub helper to simulate meal availability check.
// Replace with your actual API or logic.
function getMealStatus(date, mealType) {
    // For demonstration:
    // - On Fridays (day 5), if the date's day is even, simulate that lunch is full.
    if (mealType === "lunch" && date.getDay() === 5 && date.getDate() % 2 === 0) {
        return { available: false, status: "Full" };
    }
    // Otherwise assume the meal is available.
    return { available: true, status: "" };
}

const ReservationDetailsStep = ({
                                    adults,
                                    kids,
                                    onIncrementAdults,
                                    onDecrementAdults,
                                    onIncrementKids,
                                    onDecrementKids,
                                    date,
                                    onDateSelect,
                                    mealType,
                                    onSetMealType,
                                    error,
                                    onContinue,
                                    onClose,
                                }) => {
    // Determine which meal types are valid for the selected day.
    const availableMealTypes = date ? getDayMealTypes(date.getDay()) : [];

    // Check availability for each meal type.
    const lunchStatus = date ? getMealStatus(date, "lunch") : { available: false, status: "" };
    const dinnerStatus = date ? getMealStatus(date, "dinner") : { available: false, status: "" };

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6 text-center">
                Choose Your Reservation
            </h2>
            <div className="mb-4">
                <p className="mb-2 font-medium">Adults</p>
                <div className="flex items-center">
                    <button onClick={onDecrementAdults} className="bg-gray-200 p-2 rounded-l">
                        -
                    </button>
                    <div className="px-4 py-2 border-t border-b">{adults}</div>
                    <button onClick={onIncrementAdults} className="bg-gray-200 p-2 rounded-r">
                        +
                    </button>
                </div>
            </div>
            <div className="mb-6">
                <p className="mb-2 font-medium">Kids</p>
                <div className="flex items-center">
                    <button onClick={onDecrementKids} className="bg-gray-200 p-2 rounded-l">
                        -
                    </button>
                    <div className="px-4 py-2 border-t border-b">{kids}</div>
                    <button onClick={onIncrementKids} className="bg-gray-200 p-2 rounded-r">
                        +
                    </button>
                </div>
            </div>
            <div className="mb-6">
                <p className="mb-2 font-medium">Select Date</p>
                <DatePicker selectedDate={date} onDateSelect={onDateSelect} />
            </div>
            <div className="mb-6">
                <p className="mb-2 font-medium">Meal Type</p>
                <div className="flex space-x-4">
                    {availableMealTypes.includes("lunch") && (
                        <button
                            onClick={() => onSetMealType("lunch")}
                            disabled={!lunchStatus.available}
                            className={`flex-1 px-4 py-2 rounded border text-center ${
                                mealType === "lunch"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-800"
                            } ${!lunchStatus.available ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            Comida <br />
                            <span className="text-sm">
                {lunchStatus.status || "(13:30 - 17:30)"}
              </span>
                        </button>
                    )}
                    {availableMealTypes.includes("dinner") && (
                        <button
                            onClick={() => onSetMealType("dinner")}
                            disabled={!dinnerStatus.available}
                            className={`flex-1 px-4 py-2 rounded border text-center ${
                                mealType === "dinner"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-800"
                            } ${!dinnerStatus.available ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            Cena <br />
                            <span className="text-sm">
                {dinnerStatus.status || "(18:00 - 23:00)"}
              </span>
                        </button>
                    )}
                </div>
            </div>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="flex justify-between">
                <button onClick={onClose} className="px-4 py-2 border rounded">
                    Close
                </button>
                <button
                    onClick={onContinue}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 hover:shadow-lg transition-all duration-200"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default ReservationDetailsStep;
