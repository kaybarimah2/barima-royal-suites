-- ==================== BARIMA ROYAL SUITES DATABASE ====================
-- Hotel Reservation System Database Schema
-- Database: barima_royal_suites
-- Created: 2026-03-18

-- ==================== TABLE 1: GUESTS ====================
-- Stores guest/customer information
CREATE TABLE guests (
  guest_id VARCHAR(20) PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone_number VARCHAR(20) NOT NULL,
  national_id VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== TABLE 2: ROOMS ====================
-- Stores all hotel rooms with their types, pricing, and status
-- 25 Total Rooms: 7x Single, 7x Double, 6x Deluxe, 5x Suite
CREATE TABLE rooms (
  room_number VARCHAR(10) PRIMARY KEY,
  room_type VARCHAR(50) NOT NULL CHECK(room_type IN ('Single', 'Double', 'Deluxe', 'Suite')),
  price_per_night DECIMAL(10, 2) NOT NULL,
  room_status VARCHAR(20) DEFAULT 'Available' CHECK(room_status IN ('Available', 'Occupied', 'Maintenance')),
  capacity INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== TABLE 3: RESERVATIONS ====================
-- Stores all guest reservations/bookings
CREATE TABLE reservations (
  reservation_id VARCHAR(20) PRIMARY KEY,
  guest_id VARCHAR(20) NOT NULL REFERENCES guests(guest_id) ON DELETE CASCADE,
  room_type VARCHAR(50) NOT NULL,
  room_number VARCHAR(10) REFERENCES rooms(room_number),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_status VARCHAR(20) DEFAULT 'Confirmed' CHECK(reservation_status IN ('Pending', 'Confirmed', 'Cancelled', 'Completed')),
  payment_method VARCHAR(50) NOT NULL CHECK(payment_method IN ('Card', 'Cash', 'Mobile Payment')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_dates CHECK(check_out_date > check_in_date)
);

-- ==================== TABLE 4: PAYMENTS ====================
-- Stores payment information for each reservation
CREATE TABLE payments (
  payment_id VARCHAR(20) PRIMARY KEY,
  reservation_id VARCHAR(20) NOT NULL REFERENCES reservations(reservation_id) ON DELETE CASCADE,
  guest_id VARCHAR(20) NOT NULL REFERENCES guests(guest_id) ON DELETE CASCADE,
  payment_amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'Fully Paid' CHECK(payment_status IN ('Pending', 'Fully Paid', 'Partial', 'Refunded')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== TABLE 5: CONTACT MESSAGES ====================
-- Stores contact form submissions from the website
CREATE TABLE contact_messages (
  message_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'New' CHECK(status IN ('New', 'Read', 'Replied')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== INDEXES FOR PERFORMANCE ====================
CREATE INDEX idx_guests_email ON guests(email);
CREATE INDEX idx_guests_national_id ON guests(national_id);
CREATE INDEX idx_rooms_type ON rooms(room_type);
CREATE INDEX idx_rooms_status ON rooms(room_status);
CREATE INDEX idx_reservations_guest ON reservations(guest_id);
CREATE INDEX idx_reservations_date ON reservations(check_in_date, check_out_date);
CREATE INDEX idx_reservations_status ON reservations(reservation_status);
CREATE INDEX idx_payments_reservation ON payments(reservation_id);
CREATE INDEX idx_payments_guest ON payments(guest_id);
CREATE INDEX idx_contact_status ON contact_messages(status);

-- ==================== INSERT SAMPLE ROOMS (25 Total) ====================
-- 7x Single Rooms (101-107) @ $129/night, Capacity: 1
INSERT INTO rooms (room_number, room_type, price_per_night, room_status, capacity) VALUES
('101', 'Single', 129, 'Available', 1),
('102', 'Single', 129, 'Available', 1),
('103', 'Single', 129, 'Occupied', 1),
('104', 'Single', 129, 'Available', 1),
('105', 'Single', 129, 'Available', 1),
('106', 'Single', 129, 'Available', 1),
('107', 'Single', 129, 'Available', 1);

-- 7x Double Rooms (201-207) @ $199/night, Capacity: 2
INSERT INTO rooms (room_number, room_type, price_per_night, room_status, capacity) VALUES
('201', 'Double', 199, 'Available', 2),
('202', 'Double', 199, 'Available', 2),
('203', 'Double', 199, 'Occupied', 2),
('204', 'Double', 199, 'Available', 2),
('205', 'Double', 199, 'Available', 2),
('206', 'Double', 199, 'Available', 2),
('207', 'Double', 199, 'Available', 2);

-- 6x Deluxe Rooms (301-306) @ $299/night, Capacity: 2
INSERT INTO rooms (room_number, room_type, price_per_night, room_status, capacity) VALUES
('301', 'Deluxe', 299, 'Available', 2),
('302', 'Deluxe', 299, 'Available', 2),
('303', 'Deluxe', 299, 'Available', 2),
('304', 'Deluxe', 299, 'Occupied', 2),
('305', 'Deluxe', 299, 'Available', 2),
('306', 'Deluxe', 299, 'Available', 2);

-- 5x Suite Rooms (401-405) @ $499/night, Capacity: 4
INSERT INTO rooms (room_number, room_type, price_per_night, room_status, capacity) VALUES
('401', 'Suite', 499, 'Available', 4),
('402', 'Suite', 499, 'Available', 4),
('403', 'Suite', 499, 'Available', 4),
('404', 'Suite', 499, 'Occupied', 4),
('405', 'Suite', 499, 'Available', 4);