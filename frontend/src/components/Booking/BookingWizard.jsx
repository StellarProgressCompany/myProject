import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { fetchAvailableTimeSlots, createBooking } from "../../services/bookingService";
import AnimatedBackground from "../AnimatedBackground";
import ReservationDetailsStep from "./ReservationDetailsStep";
import TimeSlotStep from "./TimeSlotStep";
import ContactInfoStep from "./ContactInfoStep";

const BookingWizard = () => {
    const [currentStep, setCurrentStep] = useState(1);

    // Reservation details
    const [adults, setAdults] = useState(2);
    const [kids, setKids] = useState(0);
    const [date, setDate] = useState(new Date());
    const [mealType, setMealType] = useState("lunch");
    const [longStay, setLongStay] = useState(false);        // ← NEW

    // Time slots
    const [timeSlotData, setTimeSlotData] = useState(null);
    const [selectedRound, setSelectedRound] = useState("");
    const [selectedTime, setSelectedTime] = useState(null);
    const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);

    // Contact info
    const [fullName, setFullName] = useState("");
    const [phonePrefix, setPhonePrefix] = useState("+34");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [email, setEmail] = useState("");
    const [specialRequests, setSpecialRequests] = useState("");
    const [gdprConsent, setGdprConsent] = useState(false);
    const [marketingOptIn, setMarketingOptIn] = useState(false);

    const [confirmationMessage, setConfirmationMessage] = useState("");
    const [error, setError] = useState("");

    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    /* ---------- fetch time‑slots on entering step‑2 ---------- */
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

    /* ---------- step / nav helpers ---------- */
    const goNext = () => setCurrentStep(prev => prev + 1);
    const goBack = () => setCurrentStep(prev => prev - 1);

    const handleStep1Continue = () => {
        if (!date) {
            setError("Please select a date.");
            return;
        }
        setError("");
        setTimeSlotData(null);
        goNext();
    };

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

    /* ---------- validation utils ---------- */
    const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.toLowerCase());
    const isValidPhone = (n) => /^\d{9}$/.test(n.replace(/\s/g, ""));

    /* ---------- final confirm ---------- */
    const handleConfirmBooking = async () => {
        setError("");
        if (!fullName.trim() || !email.trim() || !gdprConsent) {
            setError("Please complete all required fields and consent to GDPR.");
            return;
        }
        if (!isValidEmail(email)) {
            setError("Please enter a valid email.");
            return;
        }
        if (phoneNumber.trim() && !isValidPhone(phoneNumber)) {
            setError("Please enter a valid 9‑digit phone number.");
            return;
        }
        if (!selectedTime) {
            setError("No time selected.");
            return;
        }

        try {
            const formattedDate = format(date, "yyyy-MM-dd");
            await createBooking({
                date: formattedDate,
                meal_type: mealType,
                reserved_time: selectedTime,
                total_adults: adults,
                total_kids: kids,
                full_name: fullName,
                phone: phoneNumber ? `${phonePrefix} ${phoneNumber}` : null,
                email,
                special_requests: specialRequests,
                gdpr_consent: gdprConsent,
                marketing_opt_in: marketingOptIn,
                long_stay: longStay,                        // ← NEW
            });

            setShowSuccessPopup(true);
            setTimeout(() => {
                setShowSuccessPopup(false);
                resetWizard();
            }, 2000);
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.error ?? "Could not confirm your booking.");
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
        setLongStay(false);
        setError("");
        setConfirmationMessage("");
        setAdults(2);
        setKids(0);
        setDate(new Date());
        setMealType("lunch");
    };

    /* ---------- UI ---------- */
    const StepIndicator = () => (
        <div className="flex justify-center space-x-2 mb-6">
            {[1, 2, 3].map(step => (
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
                            onIncrementAdults={() => setAdults(prev => Math.min(prev + 1, 20))}
                            onDecrementAdults={() => setAdults(prev => Math.max(prev - 1, 1))}
                            onIncrementKids={() => setKids(prev => Math.min(prev + 1, 20))}
                            onDecrementKids={() => setKids(prev => Math.max(prev - 1, 0))}
                            date={date}
                            onDateSelect={setDate}
                            mealType={mealType}
                            onSetMealType={setMealType}
                            longStay={longStay}                    // ← NEW
                            onToggleLongStay={setLongStay}         // ← NEW
                            error={error}
                            onContinue={handleStep1Continue}
                            onClose={() => {}}
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
