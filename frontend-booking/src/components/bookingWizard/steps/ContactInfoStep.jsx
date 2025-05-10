import React from "react";
import PropTypes from "prop-types";

export default function ContactInfoStep({
                                            fullName,
                                            phonePrefix,
                                            phoneNumber,
                                            email,
                                            specialRequests,
                                            gdprConsent,
                                            marketingOptIn,
                                            longStay,
                                            onChangeFullName,
                                            onChangePhonePrefix,
                                            onChangePhoneNumber,
                                            onChangeEmail,
                                            onChangeSpecialRequests,
                                            onToggleGdpr,
                                            onToggleMarketing,
                                            onToggleLongStay,
                                            adults,
                                            kids,
                                            selectedRound,
                                            date,
                                            error,
                                            confirmationMessage,
                                            onBack,
                                            onConfirmBooking,
                                        }) {
    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6 text-center">
                Your Details
            </h2>

            {/* Full Name */}
            <div className="mb-4">
                <label className="block mb-1 font-medium">Full Name*</label>
                <input
                    className="w-full border rounded p-2"
                    value={fullName}
                    onChange={(e) => onChangeFullName(e.target.value)}
                />
            </div>

            {/* Phone */}
            <div className="mb-4">
                <label className="block mb-1 font-medium">Phone (optional)</label>
                <div className="flex space-x-2">
                    <select
                        className="border rounded p-2"
                        value={phonePrefix}
                        onChange={(e) => onChangePhonePrefix(e.target.value)}
                    >
                        <option value="+34">+34</option>
                        <option value="+33">+33</option>
                        <option value="+44">+44</option>
                    </select>
                    <input
                        className="w-full border rounded p-2"
                        value={phoneNumber}
                        onChange={(e) => onChangePhoneNumber(e.target.value)}
                        placeholder="620 379 850"
                    />
                </div>
            </div>

            {/* Email */}
            <div className="mb-4">
                <label className="block mb-1 font-medium">Email*</label>
                <input
                    className="w-full border rounded p-2"
                    type="email"
                    value={email}
                    onChange={(e) => onChangeEmail(e.target.value)}
                />
            </div>

            {/* Long‑stay */}
            <div className="mb-4 flex items-center">
                <input
                    type="checkbox"
                    checked={longStay}
                    onChange={(e) => onToggleLongStay(e.target.checked)}
                    className="mr-2"
                />
                <label className="text-sm">
                    Extended stay (birthday / celebration)
                </label>
            </div>

            {/* Special Requests */}
            <div className="mb-4">
                <label className="block mb-1 font-medium">Special Requests</label>
                <textarea
                    className="w-full border rounded p-2"
                    rows="3"
                    value={specialRequests}
                    onChange={(e) => onChangeSpecialRequests(e.target.value)}
                />
            </div>

            {/* GDPR */}
            <div className="mb-4 flex items-center">
                <input
                    type="checkbox"
                    checked={gdprConsent}
                    onChange={(e) => onToggleGdpr(e.target.checked)}
                    className="mr-2"
                />
                <label className="text-sm">I consent to data processing (GDPR)*</label>
            </div>

            {/* Marketing */}
            <div className="mb-6 flex items-center">
                <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => onToggleMarketing(e.target.checked)}
                    className="mr-2"
                />
                <label className="text-sm">Send me occasional offers</label>
            </div>

            {/* Summary */}
            <div className="mb-4 text-gray-700">
                {adults} adult{adults!==1 && "s"}, {kids} kid{kids!==1 && "s"} –
                {selectedRound.replace("_"," ")} on {date.toLocaleDateString()}
            </div>

            {error && <p className="text-red-600 mb-3">{error}</p>}
            {confirmationMessage && (
                <p className="text-green-600 mb-3">{confirmationMessage}</p>
            )}

            <div className="flex justify-between">
                <button onClick={onBack} className="px-4 py-2 border rounded">
                    Back
                </button>
                <button
                    onClick={onConfirmBooking}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Finalise Booking
                </button>
            </div>
        </div>
    );
}

ContactInfoStep.propTypes = {
    fullName:             PropTypes.string.isRequired,
    phonePrefix:          PropTypes.string.isRequired,
    phoneNumber:          PropTypes.string.isRequired,
    email:                PropTypes.string.isRequired,
    specialRequests:      PropTypes.string,
    gdprConsent:          PropTypes.bool.isRequired,
    marketingOptIn:       PropTypes.bool.isRequired,
    longStay:             PropTypes.bool.isRequired,
    onChangeFullName:     PropTypes.func.isRequired,
    onChangePhonePrefix:  PropTypes.func.isRequired,
    onChangePhoneNumber:  PropTypes.func.isRequired,
    onChangeEmail:        PropTypes.func.isRequired,
    onChangeSpecialRequests: PropTypes.func.isRequired,
    onToggleGdpr:         PropTypes.func.isRequired,
    onToggleMarketing:    PropTypes.func.isRequired,
    onToggleLongStay:     PropTypes.func.isRequired,
    adults:               PropTypes.number.isRequired,
    kids:                 PropTypes.number.isRequired,
    selectedRound:        PropTypes.string.isRequired,
    date:                 PropTypes.instanceOf(Date).isRequired,
    error:                PropTypes.string,
    confirmationMessage:  PropTypes.string,
    onBack:               PropTypes.func.isRequired,
    onConfirmBooking:     PropTypes.func.isRequired,
};
