import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { fetchAvailableTimeSlots, createBooking } from "../../services/bookingService";
import AnimatedBackground from "../AnimatedBackground";
import ReservationDetailsStep from "./ReservationDetailsStep";
import TimeSlotStep from "./TimeSlotStep";
import ContactInfoStep from "./ContactInfoStep";

const BookingWizard = () => {
    const [currentStep, setCurrentStep] = useState(1);

    // Step 1: Reservation details
    const [adults, setAdults] = useState(2);
    const [kids, setKids] = useState(0);
    const [date, setDate] = useState(new Date());
    const [mealType, setMealType] = useState("lunch");

    // Step 2: Time slot selection
    const [timeSlotData, setTimeSlotData] = useState(null);
    const [selectedRound, setSelectedRound] = useState("");
    // NEW state to store the exact chosen time (e.g. "12:45:00")
    const [selectedTime, setSelectedTime] = useState(null);
    const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);

    // Step 3: Contact info
    const [fullName, setFullName] = useState("");
    // Phone is optional, so we split prefix and number
    const [phonePrefix, setPhonePrefix] = useState("+34");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [email, setEmail] = useState("");
    const [specialRequests, setSpecialRequests] = useState("");
    const [gdprConsent, setGdprConsent] = useState(false);
    const [marketingOptIn, setMarketingOptIn] = useState(false);

    // Confirmation and error messages
    const [confirmationMessage, setConfirmationMessage] = useState("");
    const [error, setError] = useState("");

    // Success popup state
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    // --- Fetch available time slots when entering Step 2 ---
    useEffect(() => {
        if (currentStep === 2 && date && mealType) {
            const loadTimeSlots = async () => {
                try {
                    setIsLoadingTimeSlots(true);
                    const formattedDate = format(date, "yyyy-MM-dd");
                    const response = await fetchAvailableTimeSlots({ date: formattedDate, mealType });
                    setTimeSlotData(response);
                } catch (err) {
                    console.error("Failed to fetch time slots:", err);
                    setTimeSlotData(null);
                } finally {
                    setIsLoadingTimeSlots(false);
                }
            };
            loadTimeSlots();
        }
    }, [currentStep, date, mealType]);

    const goNext = () => setCurrentStep((prev) => prev + 1);
    const goBack = () => setCurrentStep((prev) => prev - 1);

    // Step 1 Handler
    const handleStep1Continue = () => {
        if (!date) {
            setError("Please select a date.");
            return;
        }
        setError("");
        setTimeSlotData(null);
        goNext();
    };

    // Step 2 Handler:
    const handleStep2Continue = (chosenTime) => {
        if (!selectedRound) {
            setError("Please select a round.");
            return;
        }
        if (!chosenTime) {
            setError("Please select a time.");
            return;
        }
        setSelectedTime(chosenTime);
        setError("");
        goNext();
    };

    // Utility to check valid email (very simple)
    const isValidEmail = (testEmail) => {
        // Basic pattern: chars@chars.domain
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(testEmail.toLowerCase());
    };

    // Utility to check valid 9-digit phone with optional spaces
    const isValidPhoneNumber = (testNumber) => {
        // Remove all spaces
        const stripped = testNumber.replace(/\s/g, "");
        // Must be exactly 9 digits
        return /^\d{9}$/.test(stripped);
    };

    // Step 3 Handler: Use the user-chosen time from step 2
    const handleConfirmBooking = async () => {
        setError("");
        setConfirmationMessage("");

        // Full name, email, and GDPR are mandatory
        if (!fullName.trim() || !email.trim() || !gdprConsent) {
            setError("Please complete all required fields and consent to GDPR.");
            return;
        }

        // Validate email
        if (!isValidEmail(email)) {
            setError("Please enter a valid email.");
            return;
        }

        // If phone number is filled, validate it; if blank, it's okay (optional).
        if (phoneNumber.trim() && !isValidPhoneNumber(phoneNumber)) {
            setError("Please enter a valid 9-digit phone number (spaces allowed).");
            return;
        }

        if (!selectedTime) {
            setError("No time selected. Please go back and select a time.");
            return;
        }

        const totalGuests = adults + kids;
        const formattedDate = format(date, "yyyy-MM-dd");

        try {
            await createBooking({
                date: formattedDate,
                time: selectedTime, // using the chosen time from step 2
                customer_name: fullName,
                guests: totalGuests,
                // Combine prefix + number if number is provided, otherwise empty
                phone: phoneNumber ? `${phonePrefix} ${phoneNumber}` : "",
                email,
                specialRequests,
                marketingOptIn,
                mealType,
            });
            setShowSuccessPopup(true);
            setTimeout(() => {
                setShowSuccessPopup(false);
                resetWizard();
            }, 2000);
        } catch (err) {
            console.error(err);
            setError("Could not confirm your booking. Please try again later.");
        }
    };

    const resetWizard = () => {
        setCurrentStep(1);
        setSelectedRound("");
        setTimeSlotData(null);
        setSelectedTime(null);
        setFullName("");
        setPhoneNumber("");
        setPhonePrefix("+34");
        setEmail("");
        setSpecialRequests("");
        setGdprConsent(false);
        setMarketingOptIn(false);
        setError("");
        setConfirmationMessage("");
    };

    // Step indicator component
    const StepIndicator = () => (
        <div className="flex justify-center space-x-2 mb-6">
            {[1, 2, 3].map((step) => (
                <div
                    key={step}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        currentStep === step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                    }`}
                >
                    {step}
                </div>
            ))}
        </div>
    );

    return (
        <div className="relative min-h-screen">
            <AnimatedBackground />

            <div className="relative flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md relative">
                    <StepIndicator />

                    {currentStep === 1 && (
                        <ReservationDetailsStep
                            adults={adults}
                            kids={kids}
                            onIncrementAdults={() => setAdults((prev) => Math.min(prev + 1, 20))}
                            onDecrementAdults={() => setAdults((prev) => Math.max(prev - 1, 1))}
                            onIncrementKids={() => setKids((prev) => Math.min(prev + 1, 20))}
                            onDecrementKids={() => setKids((prev) => Math.max(prev - 1, 0))}
                            date={date}
                            onDateSelect={setDate}
                            mealType={mealType}
                            onSetMealType={setMealType}
                            error={error}
                            onContinue={handleStep1Continue}
                            onClose={() => {
                                /* Optionally do something if user closes */
                            }}
                        />
                    )}

                    {currentStep === 2 && (
                        <TimeSlotStep
                            mealType={mealType}
                            date={date}
                            timeSlotData={timeSlotData}
                            selectedRound={selectedRound}
                            onSelectRound={setSelectedRound}
                            isLoading={isLoadingTimeSlots}
                            error={error}
                            onBack={goBack}
                            onContinue={handleStep2Continue}
                        />
                    )}

                    {currentStep === 3 && (
                        <ContactInfoStep
                            fullName={fullName}
                            phonePrefix={phonePrefix}
                            phoneNumber={phoneNumber}
                            email={email}
                            specialRequests={specialRequests}
                            gdprConsent={gdprConsent}
                            marketingOptIn={marketingOptIn}
                            onChangeFullName={setFullName}
                            onChangePhonePrefix={setPhonePrefix}
                            onChangePhoneNumber={setPhoneNumber}
                            onChangeEmail={setEmail}
                            onChangeSpecialRequests={setSpecialRequests}
                            onToggleGdpr={setGdprConsent}
                            onToggleMarketing={setMarketingOptIn}
                            adults={adults}
                            kids={kids}
                            selectedRound={selectedRound}
                            date={date}
                            error={error}
                            confirmationMessage={confirmationMessage}
                            onBack={goBack}
                            onConfirmBooking={handleConfirmBooking}
                        />
                    )}

                    {/* Success Popup */}
                    {showSuccessPopup && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <div className="bg-white p-6 rounded shadow-lg z-50">
                                <p className="text-lg font-bold mb-2">Booking Successful!</p>
                                <p>Redirecting to start...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingWizard;
