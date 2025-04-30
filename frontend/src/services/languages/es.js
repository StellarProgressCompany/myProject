// frontend/src/services/languages/es.js

export default {
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
            time:         "Hora",
            name:         "Nombre",
            totalClients: "Clientes totales",
        },
        noBookings:   "Sin reservas en este turno.",
    },

    calendar: {
        prev:           "Anterior",
        next:           "Siguiente",
        badgeBookings:  "Reservas",
        badgeClients:   "Clientes",
    },

    chart: {
        titleTotalPeople: "Gráfico de personas totales",
        totalPeople:      "Personas totales",
    },

    tableUsage: "Uso de mesas",
};
