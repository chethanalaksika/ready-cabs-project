-- 1. Create Database
CREATE DATABASE ReadyCabsDB;
GO

USE ReadyCabsDB;
GO

-- 2. Users Table
CREATE TABLE Users (
    id NVARCHAR(50) PRIMARY KEY,
    username NVARCHAR(50) UNIQUE NOT NULL,
    password NVARCHAR(50) NOT NULL,
    name NVARCHAR(100),
    email NVARCHAR(100),
    whatsapp NVARCHAR(20),
    selfie NVARCHAR(MAX), -- Store Base64
    role NVARCHAR(20) DEFAULT 'customer'
);
GO

-- 3. Cars Table
CREATE TABLE Cars (
    id NVARCHAR(50) PRIMARY KEY,
    brand NVARCHAR(50),
    model NVARCHAR(50),
    description NVARCHAR(MAX),
    pricePerDay INT,
    image NVARCHAR(MAX), -- Store Base64/URL
    availableDates NVARCHAR(MAX) -- JSON String stored as Text
);
GO

-- 4. Bookings Table
CREATE TABLE Bookings (
    id NVARCHAR(50) PRIMARY KEY,
    carId NVARCHAR(50),
    customerId NVARCHAR(50),
    customerName NVARCHAR(100),
    date NVARCHAR(MAX), -- JSON String of dates array
    idPhoto NVARCHAR(MAX), -- Base64
    status NVARCHAR(20), -- pending, accepted, rejected, customer_canceled
    extraCharge INT,
    seen BIT DEFAULT 0,
    adminSeen BIT DEFAULT 0,
    cancelReason NVARCHAR(MAX),
    custCancelReason NVARCHAR(MAX)
);
GO

-- 5. Messages Table
CREATE TABLE Messages (
    id NVARCHAR(50) PRIMARY KEY,
    [from] NVARCHAR(50),
    [to] NVARCHAR(50),
    text NVARCHAR(MAX),
    image NVARCHAR(MAX),
    seen BIT DEFAULT 0,
    timestamp DATETIME DEFAULT GETDATE()
);
GO

-- 6. Insert Admin User
INSERT INTO Users (id, username, password, name, email, role)
VALUES ('u1', 'admin', '1234', 'Ready Admin', 'admin@readycabs.com', 'admin');
GO
