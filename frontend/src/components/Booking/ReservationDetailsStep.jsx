import React from "react";
import DatePicker from "../DatePicker";

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
                    <button
                        onClick={() => onSetMealType("lunch")}
                        className={`flex-1 px-4 py-2 rounded border text-center ${
                            mealType === "lunch" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
                        }`}
                    >
                        Comida <br />
                        <span className="text-sm">(13:30 - 17:30)</span>
                    </button>
                    <button
                        onClick={() => onSetMealType("dinner")}
                        className={`flex-1 px-4 py-2 rounded border text-center ${
                            mealType === "dinner" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
                        }`}
                    >
                        Cena <br />
                        <span className="text-sm">(18:00 - 23:00)</span>
                    </button>
                </div>
            </div>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="flex justify-between">
                <button onClick={onClose} className="px-4 py-2 border rounded">
                    Close
                </button>
                <button onClick={onContinue} className="bg-blue-600 text-white px-4 py-2 rounded">
                    Continue
                </button>
            </div>
        </div>
    );
};

export default ReservationDetailsStep;
