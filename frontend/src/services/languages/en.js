export default {
    admin: {
        title:         "My Admin",
        versionPrefix: "v",
        language:      "Language",
        nav: {
            current:  "Current Bookings",
            future:   "Future Bookings",
            past:     "Past Bookings",
            metrics:  "Metrics",
            tester:   "Algorithm Tester",
            settings: "Settings",
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
        bookings:      "Bookings",
        guests:        "Guests",
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
            time:         "Time",
            name:         "Name",
            totalClients: "Total Clients",
        },
        noBookings:   "No bookings in this round.",
    },

    calendar: {
        prev:           "Prev",
        next:           "Next",
        badgeBookings:  "Bookings",
        badgeClients:   "Clients",
    },

    chart: {
        titleTotalPeople: "Total People Chart",
        totalPeople:      "Total People",
    },

    tableUsage: "Table Usage",

    settings: {
        bookingWindowFrom: "Accept bookings from",
        closeDay:          "Close a day",
        openDay:           "Open a day",
        openUntil:         "Open bookings until that day",
        save:              "Save",
        closed:            "Closed (click to open)",
        open:              "Open (click to close)",
        chooseDay:         "Choose a day",
        successClosed:     "Day closed!",
        successOpened:     "Day opened!",
        closing:           "Closing…",
        opening:           "Opening…",
    },
};
