export default {
    admin: {
        title: "El meu Admin",
        versionPrefix: "v",
        language: "Llengua",
        nav: {
            current: "Reserves actuals",
            future: "Reserves futures",
            past: "Reserves passades",
            metrics: "Mètriques",
            tester: "Prova d'algorisme",
            settings: "Ajustos",
        },
        refresh: "Actualitza",
        logout: "Tanca sessió",
        manualBooking: "+ Reserva manual",
        today: "Avui",
        bookings: "Reserves",
        totalClients: "Total Clients",
        expandFloor: "Expandir sala",
        hideFloor: "Amaga sala",
        close: "Tanca",
        compact: "Compacte",
        calendar: "Calendari",
    },

    overview: {
        bookings: "Reserves",
        guests: "Clients",
        futureBookings: "Reserves futures",
        pastBookings: "Reserves passades",
        dataWindow: "Finestra de dades: {start} → {end}",
        bookings30d: "Reserves (30 d)",
        guests30d: "Clients (30 d)",
        avgGuests: "Mitjana clients / reserva",
        uniqueNames: "Noms únics",
        vsPrevious: "vs 30 d anteriors",
        upcomingRange: "Properes {n} d",
        pastRange: "Passades {n} d",
        peakDayGuests: "Màxim clients en un dia", // ← added
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
            time:         "Hora",
            name:         "Nom",
            totalClients: "Clients totals",
        },
        noBookings:   "Cap reserva en aquest torn.",
    },

    calendar: {
        prev:           "Ant.",
        next:           "Seg.",
        badgeBookings:  "Reserves",
        badgeClients:   "Clients",
    },

    chart: {
        titleTotalPeople: "Gràfic de persones totals",
        totalPeople:      "Persones totals",
    },

    tableUsage: "Ús de taules",

    settings: {
        bookingWindowFrom: "Acceptar reserves a partir de",
        closeDay:          "Tancar un dia",
        openDay:           "Obrir un dia",
        openUntil:         "Obrir reserves fins a aquest dia",
        save:              "Desa",
        closed:            "Tancat (clic per obrir)",
        open:              "Obert (clic per tancar)",
        chooseDay:         "Tria un dia",
        successClosed:     "Dia tancat!",
        successOpened:     "Dia obert!",
        closing:           "Tancant…",
        opening:           "Obrint…",
        lunch:              "Dinar",
        dinner:             "Sopar",
        processing:         "Processant…",
        done:               "Fet",
    },
};
