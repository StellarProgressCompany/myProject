// src/components/Booking/ContactInfoStep.jsx

import React from "react";

const ContactInfoStep = ({
                             fullName,
                             phonePrefix,
                             phoneNumber,
                             email,
                             specialRequests,
                             gdprConsent,
                             marketingOptIn,
                             onChangeFullName,
                             onChangePhonePrefix,
                             onChangePhoneNumber,
                             onChangeEmail,
                             onChangeSpecialRequests,
                             onToggleGdpr,
                             onToggleMarketing,
                             adults,
                             kids,
                             selectedRound,
                             date,
                             error,
                             confirmationMessage,
                             onBack,
                             onConfirmBooking,
                         }) => {
    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6 text-center">Your Details</h2>

            <div className="mb-4">
                <label className="block mb-1 font-medium">Full Name*</label>
                <input
                    type="text"
                    value={fullName}
                    onChange={(e) => onChangeFullName(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2"
                    placeholder="Oriol Calls"
                />
            </div>

            <div className="mb-4">
                <label className="block mb-1 font-medium">Phone (optional)</label>
                <div className="flex space-x-2">
                    <select
                        value={phonePrefix}
                        onChange={(e) => onChangePhonePrefix(e.target.value)}
                        className="border border-gray-300 rounded p-2"
                    >
                        <option value="+34">+34 (Spain)</option>
                        <option value="+33">+33 (France)</option>
                        <option value="+44">+44 (UK)</option>
                    </select>
                    <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => onChangePhoneNumber(e.target.value)}
                        className="w-full border border-gray-300 rounded p-2"
                        placeholder="620 379 850"
                    />
                </div>
            </div>

            <div className="mb-4">
                <label className="block mb-1 font-medium">Email Address*</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => onChangeEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2"
                    placeholder="example@gmail.com"
                />
            </div>

            <div className="mb-4">
                <label className="block mb-1 font-medium">Special Requests</label>
                <textarea
                    value={specialRequests}
                    onChange={(e) => onChangeSpecialRequests(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2"
                    rows="3"
                    placeholder="Any dietary requirements, seating preferences, etc."
                />
            </div>

            <div className="mb-4 flex items-center">
                <input
                    type="checkbox"
                    checked={gdprConsent}
                    onChange={(e) => onToggleGdpr(e.target.checked)}
                    className="mr-2"
                />
                <label className="text-sm">
                    I consent to the processing of my data (GDPR)*.
                </label>
            </div>

            <div className="mb-6 flex items-center">
                <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => onToggleMarketing(e.target.checked)}
                    className="mr-2"
                />
                <label className="text-sm">I would like to receive marketing emails.</label>
            </div>

            <div className="mb-4">
                <p className="text-gray-700">
                    Reservation for: {adults} Adult{adults !== 1 && "s"}, {kids} Kid{kids !== 1 && "s"}
                </p>
                <p className="text-gray-700">
                    Round: {selectedRound} on {date.toLocaleDateString()}
                </p>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}
            {confirmationMessage && <p className="text-green-600 mb-4">{confirmationMessage}</p>}

            <div className="flex justify-between">
                <button onClick={onBack} className="px-4 py-2 border rounded">
                    Back
                </button>
                <button
                    onClick={onConfirmBooking}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 hover:shadow-lg transition-all duration-200"
                >
                    Finalize Booking
                </button>
            </div>
        </div>
    );
};

export default ContactInfoStep;
