-- 1. Users Table
CREATE TABLE IF NOT EXISTS Users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(50) NOT NULL,
    name VARCHAR(100),
    email VARCHAR(100),
    whatsapp VARCHAR(20),
    selfie TEXT,
    role VARCHAR(20) DEFAULT 'customer'
);

-- 2. Cars Table
CREATE TABLE IF NOT EXISTS Cars (
    id VARCHAR(50) PRIMARY KEY,
    brand VARCHAR(50),
    model VARCHAR(50),
    description TEXT,
    pricePerDay INTEGER,
    image TEXT,
    availableDates TEXT
);

-- 3. Bookings Table
CREATE TABLE IF NOT EXISTS Bookings (
    id VARCHAR(50) PRIMARY KEY,
    carId VARCHAR(50),
    customerId VARCHAR(50),
    customerName VARCHAR(100),
    date TEXT,
    idPhoto TEXT,
    status VARCHAR(20),
    extraCharge INTEGER,
    seen BOOLEAN DEFAULT FALSE,
    adminSeen BOOLEAN DEFAULT FALSE,
    cancelReason TEXT,
    custCancelReason TEXT
);

-- 4. Messages Table
CREATE TABLE IF NOT EXISTS Messages (
    id VARCHAR(50) PRIMARY KEY,
    "from" VARCHAR(50),
    "to" VARCHAR(50),
    text TEXT,
    image TEXT,
    seen BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Insert Admin User
INSERT INTO Users (id, username, password, name, email, role)
VALUES ('u1', 'admin', '1234', 'Ready Admin', 'admin@readycabs.com', 'admin')
ON CONFLICT (username) DO NOTHING;
