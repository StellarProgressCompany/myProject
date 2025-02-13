import React from "react";

const ContactInfoStep = ({
                             fullName,
                             phone,
                             email,
                             specialRequests,
                             gdprConsent,
                             marketingOptIn,
                             onChangeFullName,
                             onChangePhone,
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
                />
            </div>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Phone Number*</label>
                <input
                    type="text"
                    value={phone}
                    onChange={(e) => onChangePhone(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2"
                />
            </div>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Email Address*</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => onChangeEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2"
                />
            </div>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Special Requests</label>
                <textarea
                    value={specialRequests}
                    onChange={(e) => onChangeSpecialRequests(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2"
                    rows="3"
                ></textarea>
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
                <label className="text-sm">
                    I would like to receive marketing emails.
                </label>
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
            {confirmationMessage && (
                <p className="text-green-600 mb-4">{confirmationMessage}</p>
            )}
            <div className="flex justify-between">
                <button onClick={onBack} className="px-4 py-2 border rounded">
                    Back
                </button>
                <button onClick={onConfirmBooking} className="bg-blue-600 text-white px-4 py-2 rounded">
                    Finalize Booking
                </button>
            </div>
        </div>
    );
};

export default ContactInfoStep;
