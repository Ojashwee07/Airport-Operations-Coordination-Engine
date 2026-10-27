PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS airports (
    id INTEGER PRIMARY KEY,
    ident TEXT UNIQUE,
    name TEXT NOT NULL,
    iata_code TEXT,
    icao_code TEXT,
    latitude REAL,
    longitude REAL,
    country TEXT
);

CREATE TABLE IF NOT EXISTS runways (
    id INTEGER PRIMARY KEY,
    airport_id INTEGER NOT NULL,
    runway_ident TEXT,
    length_ft REAL,
    width_ft REAL,
    surface TEXT,
    FOREIGN KEY (airport_id) REFERENCES airports(id)
);

CREATE TABLE IF NOT EXISTS flights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flight_number TEXT NOT NULL UNIQUE,
    origin_airport_id INTEGER,
    destination_airport_id INTEGER,
    scheduled_time TEXT,
    status TEXT DEFAULT 'Scheduled',
    is_synthetic INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (origin_airport_id) REFERENCES airports(id),
    FOREIGN KEY (destination_airport_id) REFERENCES airports(id)
);

CREATE TABLE IF NOT EXISTS gates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    airport_id INTEGER NOT NULL,
    gate_code TEXT NOT NULL,
    is_synthetic INTEGER NOT NULL DEFAULT 1,
    UNIQUE (airport_id, gate_code),
    FOREIGN KEY (airport_id) REFERENCES airports(id)
);

CREATE TABLE IF NOT EXISTS gate_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flight_id INTEGER NOT NULL,
    gate_id INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    is_synthetic INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (flight_id) REFERENCES flights(id),
    FOREIGN KEY (gate_id) REFERENCES gates(id)
);

CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    airport_id INTEGER NOT NULL,
    staff_name TEXT NOT NULL,
    role TEXT,
    is_synthetic INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (airport_id) REFERENCES airports(id)
);

CREATE TABLE IF NOT EXISTS crew_rosters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flight_id INTEGER NOT NULL,
    staff_id INTEGER NOT NULL,
    duty_start TEXT,
    duty_end TEXT,
    is_synthetic INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (flight_id) REFERENCES flights(id),
    FOREIGN KEY (staff_id) REFERENCES staff(id)
);
