// src/components/DatePicker/datePickerUtils.js
import { isBefore, isAfter, format } from "date-fns";

export function getDayMealTypes(dayOfWeek) {
    // dayOfWeek: 0=Sunday,1=Monday,2=Tuesday,3=Wednesday,4=Thursday,5=Friday,6=Saturday
    switch (dayOfWeek) {
        case 1: // Monday
        case 2: // Tuesday
            return []; // closed
        case 3: // Wed
        case 4: // Thu
            return ["lunch"];
        case 5: // Fri
        case 6: // Sat
        case 0: // Sun
            return ["lunch", "dinner"];
        default:
            return [];
    }
}

export function sumAvailability(dayAvailability) {
    if (!dayAvailability || typeof dayAvailability !== "object") return 0;
    let sum = 0;

    // For lunch: first_round + second_round
    if (dayAvailability.first_round?.availability) {
        Object.values(dayAvailability.first_round.availability).forEach(val => {
            sum += val;
        });
    }
    if (dayAvailability.second_round?.availability) {
        Object.values(dayAvailability.second_round.availability).forEach(val => {
            sum += val;
        });
    }

    // For dinner: dinner_round
    if (dayAvailability.dinner_round?.availability) {
        Object.values(dayAvailability.dinner_round.availability).forEach(val => {
            sum += val;
        });
    }
    return sum;
}

/**
 * Optionally, a quick helper to check if dateA <= dateB
 */
export function isBeforeOrSameDay(dateA, dateB) {
    // If dateA is strictly before dateB, or same day
    return isBefore(dateA, dateB) || format(dateA, "yyyy-MM-dd") === format(dateB, "yyyy-MM-dd");
}
