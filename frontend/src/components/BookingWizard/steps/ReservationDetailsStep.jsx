import React from "react";
import PropTypes from "prop-types";
import DatePicker from "../../DatePicker";
import { getDayMealTypes } from "../../DatePicker/datePickerUtils";

function mealInfo(mealType) {
    return mealType === "lunch"
        ? { label: "Comida", window: "(13:00 – 17:30)" }
        : { label: "Cena",   window: "(20:00 – 23:30)" };
}

export default function ReservationDetailsStep({
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
                                               }) {
    const availableMeals = date ? getDayMealTypes(date.getDay()) : [];
    const lunch  = mealInfo("lunch");
    const dinner = mealInfo("dinner");

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6 text-center">
                Choose Your Reservation
            </h2>

            {/* Adults */}
            <div className="mb-4">
                <p className="font-medium mb-2">Adults</p>
                <div className="flex items-center">
                    <button onClick={onDecrementAdults} className="bg-gray-200 px-3 py-1 rounded-l">
                        –
                    </button>
                    <div className="px-4 py-1 border-t border-b">{adults}</div>
                    <button onClick={onIncrementAdults} className="bg-gray-200 px-3 py-1 rounded-r">
                        +
                    </button>
                </div>
            </div>

            {/* Kids */}
            <div className="mb-6">
                <p className="font-medium mb-2">Kids</p>
                <div className="flex items-center">
                    <button onClick={onDecrementKids} className="bg-gray-200 px-3 py-1 rounded-l">
                        –
                    </button>
                    <div className="px-4 py-1 border-t border-b">{kids}</div>
                    <button onClick={onIncrementKids} className="bg-gray-200 px-3 py-1 rounded-r">
                        +
                    </button>
                </div>
            </div>

            {/* Date */}
            <div className="mb-6">
                <p className="font-medium mb-2">Select Date</p>
                <DatePicker selectedDate={date} onDateSelect={onDateSelect} />
            </div>

            {/* Meal Type */}
            <div className="mb-6">
                <p className="font-medium mb-2">Meal Type</p>
                <div className="flex space-x-3">
                    {availableMeals.includes("lunch") && (
                        <button
                            onClick={() => onSetMealType("lunch")}
                            className={`flex-1 px-4 py-2 rounded border text-center ${
                                mealType === "lunch" ? "bg-blue-600 text-white" : "bg-gray-100"
                            }`}
                        >
                            {lunch.label}
                            <br />
                            <span className="text-xs">{lunch.window}</span>
                        </button>
                    )}
                    {availableMeals.includes("dinner") && (
                        <button
                            onClick={() => onSetMealType("dinner")}
                            className={`flex-1 px-4 py-2 rounded border text-center ${
                                mealType === "dinner" ? "bg-blue-600 text-white" : "bg-gray-100"
                            }`}
                        >
                            {dinner.label}
                            <br />
                            <span className="text-xs">{dinner.window}</span>
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
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Continue
                </button>
            </div>
        </div>
    );
}

ReservationDetailsStep.propTypes = {
    adults:              PropTypes.number.isRequired,
    kids:                PropTypes.number.isRequired,
    onIncrementAdults:   PropTypes.func.isRequired,
    onDecrementAdults:   PropTypes.func.isRequired,
    onIncrementKids:     PropTypes.func.isRequired,
    onDecrementKids:     PropTypes.func.isRequired,
    date:                PropTypes.instanceOf(Date).isRequired,
    onDateSelect:        PropTypes.func.isRequired,
    mealType:            PropTypes.oneOf(["lunch","dinner"]).isRequired,
    onSetMealType:       PropTypes.func.isRequired,
    error:               PropTypes.string,
    onContinue:          PropTypes.func.isRequired,
    onClose:             PropTypes.func.isRequired,
};
