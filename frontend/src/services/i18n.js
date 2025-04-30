// frontend/src/services/i18n.js

import ca from "./languages/ca";
import es from "./languages/es";
import en from "./languages/en";

const translations = { ca, es, en };

// Look first in either storage key for a saved language, default to Catalan
const STORAGE_KEYS = ["adminLang", "lang"];
function detectStoredLang() {
    for (const key of STORAGE_KEYS) {
        const v = localStorage.getItem(key);
        if (v && translations[v]) return v;
    }
    return "ca";
}

let currentLang = detectStoredLang();

export function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    STORAGE_KEYS.forEach((k) => localStorage.setItem(k, lang));
}

export function getLanguage() {
    return currentLang;
}

/**
 * translate()
 *
 * Usage:
 *   translate("en", "admin.nav.current")
 *   translate("modal.dateDisplay", { weekday, day, month, year })
 */
export function translate(arg1, arg2, arg3, arg4) {
    let lang, fullPath, params = {};

    if (translations[arg1]) {
        // Style A: translate(lang, "section.path", params?)
        lang = arg1;
        if (typeof arg2 === "string" && (arg3 === undefined || typeof arg3 === "object")) {
            fullPath = arg2;
            params   = arg3 || {};
        } else {
            fullPath = [arg2, arg3].filter((x) => typeof x === "string").join(".");
            params   = arg4 || {};
        }
    } else {
        // Style B: translate("section.path", params?)
        lang     = currentLang;
        fullPath = arg1;
        params   = arg2 || {};
    }

    const deepGet = (obj, path) =>
        path.split(".").reduce((acc, key) =>
            acc && acc[key] !== undefined ? acc[key] : null, obj
        );

    let text =
        deepGet(translations[lang], fullPath) ||
        deepGet(translations.en,   fullPath) ||
        `!${fullPath}!`;

    // interpolate {tokens}
    if (typeof text === "string" && text.includes("{")) {
        text = text.replace(/\{(\w+?)\}/g, (_, token) =>
            Object.prototype.hasOwnProperty.call(params, token)
                ? params[token]
                : `{${token}}`
        );
    }

    return text;
}
