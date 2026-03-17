-- Create tables
CREATE TABLE guests (
  guest_id VARCHAR(20) PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(100) NOT NULL,
  national_id VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rooms (
  room_number VARCHAR(10) PRIMARY KEY,
  room_type VARCHAR(50) NOT NULL,
  price_per_night DECIMAL(10, 2) NOT NULL,
  room_status VARCHAR(20) DEFAULT 'Available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reservations (
  reservation_id VARCHAR(20) PRIMARY KEY,
  guest_id VARCHAR(20) NOT NULL REFERENCES guests(guest_id),
  room_number VARCHAR(10) NOT NULL REFERENCES rooms(room_number),
  room_type VARCHAR(50) NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_status VARCHAR(20) DEFAULT 'Confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
  payment_id VARCHAR(20) PRIMARY KEY,
  reservation_id VARCHAR(20) NOT NULL REFERENCES reservations(reservation_id),
  guest_id VARCHAR(20) NOT NULL REFERENCES guests(guest_id),
  payment_amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'Fully Paid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample rooms
INSERT INTO rooms (room_number, room_type, price_per_night, room_status) VALUES
('101', 'Single', 129, 'Available'),
('102', 'Single', 129, 'Occupied'),
-- ... (add all 25 rooms from your template)