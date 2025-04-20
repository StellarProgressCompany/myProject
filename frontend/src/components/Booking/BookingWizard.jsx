import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { fetchAvailableTimeSlots, createBooking } from "../../services/bookingService";
import AnimatedBackground from "../AnimatedBackground";
import ReservationDetailsStep from "./ReservationDetailsStep";
import TimeSlotStep from "./TimeSlotStep";
import ContactInfoStep from "./ContactInfoStep";

export default function BookingWizard() {
    /* wizard state */
    const [step, setStep] = useState(1);

    /* details */
    const [adults, setAdults]   = useState(2);
    const [kids,   setKids]     = useState(0);
    const [date,   setDate]     = useState(new Date());
    const [meal,   setMeal]     = useState("lunch");

    /* long‑stay flag now chosen in step 3 */
    const [longStay, setLongStay] = useState(false);

    /* time‑slot */
    const [slotData, setSlotData]     = useState(null);
    const [round,    setRound]        = useState("");
    const [time,     setTime]         = useState(null);
    const [loadingSlots, setLoading]  = useState(false);

    /* contact */
    const [fullName, setFullName]       = useState("");
    const [phonePref, setPhonePref]     = useState("+34");
    const [phoneNum,  setPhoneNum]      = useState("");
    const [email,     setEmail]         = useState("");
    const [requests,  setRequests]      = useState("");
    const [gdpr,      setGdpr]          = useState(false);
    const [marketing, setMarketing]     = useState(false);

    /* misc */
    const [error, setError]         = useState("");
    const [success, setSuccess]     = useState(false);

    /* fetch slots on step‑2 entrance */
    useEffect(() => {
        if (step !== 2) return;
        (async () => {
            try {
                setLoading(true);
                const data = await fetchAvailableTimeSlots({
                    date: format(date, "yyyy-MM-dd"),
                    mealType: meal,
                });
                setSlotData(data);
            } catch (e) {
                console.error(e);
                setSlotData(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [step, date, meal]);

    /* helpers */
    const next  = () => setStep((s) => s + 1);
    const back  = () => setStep((s) => s - 1);
    const reset = () => window.location.reload();

    /* confirm */
    const save = async () => {
        setError("");

        if (!fullName.trim() || !email.trim() || !gdpr) {
            return setError("Name, e‑mail and GDPR consent are required.");
        }
        const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!okEmail) return setError("Invalid e‑mail.");

        try {
            await createBooking({
                date:          format(date, "yyyy-MM-dd"),
                meal_type:     meal,
                reserved_time: time,
                total_adults:  adults,
                total_kids:    kids,
                full_name:     fullName,
                phone:         phoneNum ? `${phonePref} ${phoneNum}` : null,
                email,
                special_requests: requests,
                gdpr_consent:     gdpr,
                marketing_opt_in: marketing,
                long_stay:        longStay,
            });
            setSuccess(true);
            setTimeout(reset, 2000);
        } catch (e) {
            console.error(e);
            setError(e.response?.data?.error || "Booking failed.");
        }
    };

    return (
        <div className="relative min-h-screen">
            <AnimatedBackground />
            <div className="relative flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                    {/* step indicator */}
                    <div className="flex justify-center space-x-2 mb-6">
                        {[1,2,3].map((i) => (
                            <div
                                key={i}
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    step === i ? "bg-blue-600 text-white" : "bg-gray-200"
                                }`}
                            >
                                {i}
                            </div>
                        ))}
                    </div>

                    {step === 1 && (
                        <ReservationDetailsStep
                            adults={adults}
                            kids={kids}
                            onIncrementAdults={() => setAdults((v) => Math.min(v + 1, 20))}
                            onDecrementAdults={() => setAdults((v) => Math.max(v - 1, 1))}
                            onIncrementKids={() => setKids((v) => Math.min(v + 1, 20))}
                            onDecrementKids={() => setKids((v) => Math.max(v - 1, 0))}
                            date={date}
                            onDateSelect={setDate}
                            mealType={meal}
                            onSetMealType={setMeal}
                            error={error}
                            onContinue={() => {
                                setError("");
                                if (!date) return setError("Pick a date first.");
                                next();
                            }}
                            onClose={reset}
                        />
                    )}

                    {step === 2 && (
                        <TimeSlotStep
                            mealType={meal}
                            date={date}
                            timeSlotData={slotData}
                            selectedRound={round}
                            onSelectRound={setRound}
                            isLoading={loadingSlots}
                            error={error}
                            onBack={back}
                            onContinue={(t) => {
                                setTime(t);
                                next();
                            }}
                        />
                    )}

                    {step === 3 && (
                        <ContactInfoStep
                            /* contact */
                            fullName={fullName}
                            phonePrefix={phonePref}
                            phoneNumber={phoneNum}
                            email={email}
                            specialRequests={requests}
                            gdprConsent={gdpr}
                            marketingOptIn={marketing}
                            longStay={longStay}
                            onChangeFullName={setFullName}
                            onChangePhonePrefix={setPhonePref}
                            onChangePhoneNumber={setPhoneNum}
                            onChangeEmail={setEmail}
                            onChangeSpecialRequests={setRequests}
                            onToggleGdpr={setGdpr}
                            onToggleMarketing={setMarketing}
                            onToggleLongStay={setLongStay}
                            /* summary */
                            adults={adults}
                            kids={kids}
                            selectedRound={round}
                            date={date}
                            error={error}
                            confirmationMessage=""
                            onBack={back}
                            onConfirmBooking={save}
                        />
                    )}

                    {/* success overlay */}
                    {success && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="bg-white p-6 rounded shadow-lg">
                                <p className="text-lg font-bold mb-2">Booking confirmed 🎉</p>
                                <p>Returning…</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
