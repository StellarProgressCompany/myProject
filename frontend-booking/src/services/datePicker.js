import { isBefore, isAfter, format } from "date-fns";

/**
 * dayOfWeek: 0=Sun,1=Mon…6=Sat
 */
export function getDayMealTypes(dayOfWeek) {
    switch (dayOfWeek) {
        case 1: // Mon
        case 2: // Tue
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

    // lunch rounds
    ["first_round", "second_round"].forEach((rk) => {
        Object.values(dayAvailability[rk]?.availability || {}).forEach((v) => {
            sum += v;
        });
    });

    // dinner
    Object.values(dayAvailability.dinner_round?.availability || {}).forEach((v) => {
        sum += v;
    });

    return sum;
}

/**
 * true if dateA < dateB or same calendar day
 */
export function isBeforeOrSameDay(dateA, dateB) {
    return isBefore(dateA, dateB) || format(dateA, "yyyy-MM-dd") === format(dateB, "yyyy-MM-dd");
}
