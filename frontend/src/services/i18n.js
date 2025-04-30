/* ------------------------------------------------------------------
 *  Lightweight runtime-only i18n helper
 *    • add as many languages / keys as you need
 *    • no dependencies, no build-time extraction
 * -----------------------------------------------------------------*/

export const translations = {
    /* ────────────── CATALÀ (default) ─────────────── */
    ca: {
        admin: {
            title: "El meu Admin",
            language: "Llengua",
            nav: {
                current: "Reserves actuals",
                future: "Reserves futures",
                past: "Reserves passades",
                metrics: "Mètriques",
                tester: "Prova d'algorisme",
            },
            refresh: "Actualitza",
            logout: "Tanca sessió",
        },
        wizard: {
            steps: { details: "Detalls", time: "Horari", contact: "Contacte" },
            adults: "Adults",
            kids: "Nens",
            date: "Data",
            mealType: "Servei",
            lunch: "Dinar",
            dinner: "Sopar",
            continue: "Continua",
            back: "Enrere",
            close: "Tanca",
            selectTime: "Selecciona hora",
            fullName: "Nom complet",
            phone: "Telèfon",
            email: "Correu electrònic",
            specialRequests: "Peticions especials",
            gdpr: "Consento el tractament de dades (RGPD)",
            marketing: "Vull rebre ofertes",
            longStay: "Estada llarga",
            finalise: "Confirmar reserva",
            bookingConfirmed: "Reserva confirmada 🎉",
            loading: "Carregant…",
        },
        common: {
            today: "Avui",
            tomorrow: "Demà",
        },
    },

    /* ────────────── ESPAÑOL ─────────────── */
    es: {
        admin: {
            title: "Mi Admin",
            language: "Idioma",
            nav: {
                current: "Reservas actuales",
                future: "Reservas futuras",
                past: "Reservas pasadas",
                metrics: "Métricas",
                tester: "Prueba de algoritmo",
            },
            refresh: "Actualizar",
            logout: "Cerrar sesión",
        },
        wizard: {
            steps: { details: "Detalles", time: "Horario", contact: "Contacto" },
            adults: "Adultos",
            kids: "Niños",
            date: "Fecha",
            mealType: "Servicio",
            lunch: "Comida",
            dinner: "Cena",
            continue: "Continuar",
            back: "Atrás",
            close: "Cerrar",
            selectTime: "Selecciona hora",
            fullName: "Nombre completo",
            phone: "Teléfono",
            email: "Email",
            specialRequests: "Peticiones especiales",
            gdpr: "Consiento el tratamiento de datos (RGPD)",
            marketing: "Quiero recibir ofertas",
            longStay: "Estancia prolongada",
            finalise: "Confirmar reserva",
            bookingConfirmed: "¡Reserva confirmada 🎉!",
            loading: "Cargando…",
        },
        common: {
            today: "Hoy",
            tomorrow: "Mañana",
        },
    },

    /* ────────────── ENGLISH ─────────────── */
    en: {
        admin: {
            title: "My Admin",
            language: "Language",
            nav: {
                current: "Current Bookings",
                future: "Future Bookings",
                past: "Past Bookings",
                metrics: "Metrics",
                tester: "Algorithm Test",
            },
            refresh: "Refresh",
            logout: "Logout",
        },
        wizard: {
            steps: { details: "Details", time: "Time", contact: "Contact" },
            adults: "Adults",
            kids: "Kids",
            date: "Date",
            mealType: "Meal Type",
            lunch: "Lunch",
            dinner: "Dinner",
            continue: "Continue",
            back: "Back",
            close: "Close",
            selectTime: "Select time",
            fullName: "Full name",
            phone: "Phone",
            email: "Email",
            specialRequests: "Special requests",
            gdpr: "I consent to data processing (GDPR)",
            marketing: "Send me offers",
            longStay: "Long stay",
            finalise: "Confirm booking",
            bookingConfirmed: "Booking confirmed 🎉",
            loading: "Loading…",
        },
        common: {
            today: "Today",
            tomorrow: "Tomorrow",
        },
    },
};

/* ------------------------------------------------------------------
 *  translate(lang, "admin.nav.current")  →  "Reserves actuals"
 * -----------------------------------------------------------------*/
export function translate(lang, path) {
    const parts = path.split(".");
    const root = translations[lang] ?? translations.ca;
    return parts.reduce(
        (acc, p) => (acc && acc[p] !== undefined ? acc[p] : null),
        root
    ) ?? path; // fallback → key string itself
}
