// src/services/i18n.js

/* ------------------------------------------------------------------------
   CENTRAL TRANSLATION MAP
   ------------------------------------------------------------------------ */
const translations = {
    /* =======================  CATALAN  (default)  ======================= */
    ca: {
        admin: {
            title:          "El meu Admin",
            versionPrefix:  "v",
            language:       "Llengua",
            nav: {
                current: "Reserves actuals",
                future:  "Reserves futures",
                past:    "Reserves passades",
                metrics: "Mètriques",
                tester:  "Prova d'algorisme",
            },
            refresh:       "Actualitza",
            logout:        "Tanca sessió",
            manualBooking: "+ Reserva manual",
            today:         "Avui",
            bookings:      "Reserves",
            totalClients:  "Total Clients",
            expandFloor:   "Expandir sala",
            hideFloor:     "Amaga sala",
            close:         "Tanca",
            compact:       "Compacte",
            calendar:      "Calendari",
        },

        overview: {
            futureBookings: "Reserves futures",
            pastBookings:   "Reserves passades",
            dataWindow:     "Finestra de dades: {start} → {end}",
            bookings30d:    "Reserves (30 d)",
            guests30d:      "Clients (30 d)",
            avgGuests:      "Mitjana clients / reserva",
            uniqueNames:    "Noms únics",
            vsPrevious:     "vs 30 d anteriors",
            upcomingRange:  "Properes {n} d",
            pastRange:      "Passades {n} d",
        },

        modal: {
            addTitle:      "Afegir reserva manual",
            dateDisplay:   "{weekday}, {day} {month} {year}",

            fullName:      "Nom complet",
            guests:        "Clients",
            phoneOptional: "Telèfon (opcional)",

            meal:  { lunch: "Dinar", dinner: "Sopar" },
            round: { first: "1a Torn", second: "2a Torn" },

            time:        "Hora",
            close:       "Tanca",
            save:        "Desa",
            closedDay:   "Ho sentim, estem tancats aquell dia.",

            errorRequired: "Si us plau omple tots els camps obligatoris.",
            saveError:     "Error en desar — torna-ho a provar.",
        },

        datePicker: {
            upcoming: "Properes {n} d",
            past:     "Passades {n} d",
        },

        tester: {
            title:        "Prova d'algorisme",
            partySizes:   "Mides de grup (separades per comes)",
            date:         "Data",
            meal:         "Àpat",
            startingTime: "Hora inicial",
            runTest:      "Executa prova",
            results:      "Resultats",
            ok:           "Correcte",
            rejected:     "Rebutjat",
            loadingTA:    "Carregant disponibilitat de taules…",
        },

        schedule: {
            header:       "Horari per a {date}",
            round: {
                lunchFirst:  "Dinar–1r Torn",
                lunchSecond: "Dinar–2n Torn",
                dinner:      "Sopar",
            },
            table: {
                time:          "Hora",
                name:          "Nom",
                totalClients:  "Clients totals",
            },
            noBookings:  "Cap reserva en aquest torn.",
        },

        calendar: {
            prev:           "Ant.",
            next:           "Seg.",
            badgeBookings:  "Res",
            badgeClients:   "Cli",
        },

        chart: {
            titleTotalPeople: "Gràfic de persones totals",
            totalPeople:      "Persones totals",
        },
    },

    /* =======================  SPANISH  ======================= */
    es: {
        admin: {
            title:          "Mi Admin",
            versionPrefix:  "v",
            language:       "Idioma",
            nav: {
                current: "Reservas actuales",
                future:  "Reservas futuras",
                past:    "Reservas pasadas",
                metrics: "Métricas",
                tester:  "Probador de algoritmo",
            },
            refresh:       "Actualizar",
            logout:        "Cerrar sesión",
            manualBooking: "+ Reserva manual",
            today:         "Hoy",
            bookings:      "Reservas",
            totalClients:  "Total Clientes",
            expandFloor:   "Expandir sala",
            hideFloor:     "Ocultar sala",
            close:         "Cerrar",
            compact:       "Compacto",
            calendar:      "Calendario",
        },

        overview: {
            futureBookings: "Reservas futuras",
            pastBookings:   "Reservas pasadas",
            dataWindow:     "Ventana de datos: {start} → {end}",
            bookings30d:    "Reservas (30 d)",
            guests30d:      "Clientes (30 d)",
            avgGuests:      "Prom Clientes / Reserva",
            uniqueNames:    "Nombres únicos",
            vsPrevious:     "vs 30 d anteriores",
            upcomingRange:  "Próximos {n} d",
            pastRange:      "Últimos {n} d",
        },

        modal: {
            addTitle:      "Añadir reserva manual",
            dateDisplay:   "{weekday}, {day} {month} {year}",

            fullName:      "Nombre completo",
            guests:        "Clientes",
            phoneOptional: "Teléfono (opcional)",

            meal:  { lunch: "Comida", dinner: "Cena" },
            round: { first: "1ª Turno", second: "2ª Turno" },

            time:        "Hora",
            close:       "Cerrar",
            save:        "Guardar",
            closedDay:   "Lo sentimos, ese día estamos cerrados.",

            errorRequired: "Por favor complete todos los campos obligatorios.",
            saveError:     "Error al guardar — inténtalo de nuevo.",
        },

        datePicker: {
            upcoming: "Próximos {n} d",
            past:     "Últimos {n} d",
        },

        tester: {
            title:        "Probador de algoritmo",
            partySizes:   "Tamaños de grupo (separados por coma)",
            date:         "Fecha",
            meal:         "Comida",
            startingTime: "Hora inicial",
            runTest:      "Ejecutar prueba",
            results:      "Resultados",
            ok:           "OK",
            rejected:     "Rechazado",
            loadingTA:    "Cargando disponibilidad de mesas…",
        },

        schedule: {
            header:       "Horario para {date}",
            round: {
                lunchFirst:  "Comida–1er Turno",
                lunchSecond: "Comida–2º Turno",
                dinner:      "Cena",
            },
            table: {
                time:          "Hora",
                name:          "Nombre",
                totalClients:  "Clientes totales",
            },
            noBookings:  "Sin reservas en este turno.",
        },

        calendar: {
            prev:           "Anterior",
            next:           "Siguiente",
            badgeBookings:  "Res",
            badgeClients:   "Cli",
        },

        chart: {
            titleTotalPeople: "Gráfico de personas totales",
            totalPeople:      "Personas totales",
        },
    },

    /* =======================  ENGLISH  ======================= */
    en: {
        admin: {
            title:          "My Admin",
            versionPrefix:  "v",
            language:       "Language",
            nav: {
                current: "Current Bookings",
                future:  "Future Bookings",
                past:    "Past Bookings",
                metrics: "Metrics",
                tester:  "Algorithm Tester",
            },
            refresh:       "Refresh",
            logout:        "Log Out",
            manualBooking: "+ Manual Booking",
            today:         "Today",
            bookings:      "Bookings",
            totalClients:  "Total Clients",
            expandFloor:   "Expand floor",
            hideFloor:     "Hide floor",
            close:         "Close",
            compact:       "Compact",
            calendar:      "Calendar",
        },

        overview: {
            futureBookings: "Future Bookings",
            pastBookings:   "Past Bookings",
            dataWindow:     "Data window: {start} → {end}",
            bookings30d:    "Bookings (30 d)",
            guests30d:      "Guests (30 d)",
            avgGuests:      "Avg Guests / Booking",
            uniqueNames:    "Unique Names",
            vsPrevious:     "vs previous 30 d",
            upcomingRange:  "Upcoming {n} d",
            pastRange:      "Past {n} d",
        },

        modal: {
            addTitle:      "Add Manual Booking",
            dateDisplay:   "{weekday}, {month} {day}, {year}",

            fullName:      "Full Name",
            guests:        "Guests",
            phoneOptional: "Phone (optional)",

            meal:  { lunch: "Lunch", dinner: "Dinner" },
            round: { first: "1st Round", second: "2nd Round" },

            time:        "Time",
            close:       "Close",
            save:        "Save",
            closedDay:   "Sorry, we’re closed that day.",

            errorRequired: "Please fill in all required fields.",
            saveError:     "Error saving — please try again.",
        },

        datePicker: {
            upcoming: "Upcoming {n} d",
            past:     "Past {n} d",
        },

        tester: {
            title:        "Algorithm Tester",
            partySizes:   "Party sizes (comma-separated)",
            date:         "Date",
            meal:         "Meal",
            startingTime: "Starting time",
            runTest:      "Run Test",
            results:      "Results",
            ok:           "OK",
            rejected:     "Rejected",
            loadingTA:    "Loading table availability…",
        },

        schedule: {
            header:       "Schedule for {date}",
            round: {
                lunchFirst:  "Lunch–1st Round",
                lunchSecond: "Lunch–2nd Round",
                dinner:      "Dinner",
            },
            table: {
                time:          "Time",
                name:          "Name",
                totalClients:  "Total Clients",
            },
            noBookings:  "No bookings in this round.",
        },

        calendar: {
            prev:           "Prev",
            next:           "Next",
            badgeBookings:  "Bkg",
            badgeClients:   "Cl",
        },

        chart: {
            titleTotalPeople: "Total People Chart",
            totalPeople:      "Total People",
        },
    },
};

/* ------------------------------------------------------------------------
   STATE, HELPERS AND PUBLIC API
   ------------------------------------------------------------------------ */
const STORAGE_KEYS = ["adminLang", "lang"];

const detectStoredLang = () => {
    for (const k of STORAGE_KEYS) {
        const stored = localStorage.getItem(k);
        if (stored && translations[stored]) return stored;
    }
    return "ca";
};

let currentLang = detectStoredLang();

/**
 * Persist language choice and switch immediately.
 * Silently ignores unknown language codes.
 */
export function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    STORAGE_KEYS.forEach((k) => localStorage.setItem(k, lang));
}

/** Return the currently active language code. */
export function getLanguage() {
    return currentLang;
}

/**
 * translate()
 *
 * USAGE PATTERNS
 *   • translate("es", "admin",  "title")
 *   • translate("es", "modal",  "meal.lunch")
 *   • translate("es", "admin.nav.current")
 *   • translate("admin.nav.current")
 *   • translate("admin.nav.current", {n:7})
 *
 * Place-holders like {name} are replaced from the optional params object.
 *
 * Fallback order: chosen language → English → "!missing.key!" sentinel.
 */
export function translate(arg1, arg2, arg3, arg4) {
    let lang, fullPath, params = {};

    // Determine signature
    if (translations[arg1]) {
        // first arg is language code
        lang = arg1;
        if (typeof arg2 === "string" && (arg3 === undefined || typeof arg3 === "object")) {
            fullPath = arg2;
            params   = arg3 || {};
        } else {
            const parts = [arg2, arg3, arg4].filter(Boolean);
            fullPath = parts.join(".");
            if (typeof parts.at(-1) === "object") {
                params = parts.pop();
                fullPath = parts.join(".");
            }
        }
    } else {
        // no lang arg, use currentLang
        lang     = currentLang;
        fullPath = arg1;
        params   = arg2 || {};
    }

    // deep get helper
    const deepGet = (obj, path) =>
        path.split(".").reduce((acc, key) =>
            acc && acc[key] !== undefined ? acc[key] : null, obj);

    // fetch text with fallback
    let text =
        deepGet(translations[lang]   || {}, fullPath) ||
        deepGet(translations.en      || {}, fullPath) ||
        `!${fullPath}!`;

    // interpolate placeholders
    if (typeof text === "string" && text.includes("{")) {
        text = text.replace(/\{(\w+?)\}/g, (_, token) =>
            Object.prototype.hasOwnProperty.call(params, token)
                ? params[token]
                : `{${token}}`
        );
    }

    return text;
}

/**
 * Convenience shorthand for current language:
 *    t("admin.title")
 *    t("schedule.header", {date:...})
 */
export const t = (key, params) => translate(key, params);
