const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test DB connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('DB Connection Error:', err);
  else console.log('✓ Database connected');
});

// ==================== GUESTS ====================
app.post('/api/guests', async (req, res) => {
  try {
    const { full_name, phone_number, email, national_id } = req.body;
    const guest_id = 'G-' + uuidv4().slice(0, 6).toUpperCase();
    
    const result = await pool.query(
      'INSERT INTO guests (guest_id, full_name, phone_number, email, national_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [guest_id, full_name, phone_number, email, national_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating guest:', err);
    res.status(400).json({ error: err.message });
  }
});

// ==================== ROOMS ====================
app.get('/api/rooms', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rooms ORDER BY room_number');
    res.json(result.rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== RESERVATIONS ====================
app.post('/api/reservations', async (req, res) => {
  try {
    const { full_name, phone_number, email, national_id, room_type, check_in_date, check_out_date, payment_method, payment_amount } = req.body;
    
    // Step 1: Create or get guest
    const guest_id = 'G-' + uuidv4().slice(0, 6).toUpperCase();
    const guestResult = await pool.query(
      'INSERT INTO guests (guest_id, full_name, phone_number, email, national_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [guest_id, full_name, phone_number, email, national_id]
    );
    
    // Step 2: Find an available room with the requested type
    const roomResult = await pool.query(
      'SELECT * FROM rooms WHERE room_type = $1 AND room_status = $2 LIMIT 1',
      [room_type, 'Available']
    );
    
    if (roomResult.rows.length === 0) {
      return res.status(400).json({ error: 'No available rooms of this type' });
    }
    
    const room = roomResult.rows[0];
    const room_number = room.room_number;
    
    // Step 3: Create reservation
    const reservation_id = 'RES-' + uuidv4().slice(0, 6).toUpperCase();
    const reservation_date = new Date().toISOString().split('T')[0];

    const resResult = await pool.query(
      `INSERT INTO reservations 
       (reservation_id, guest_id, room_number, room_type, check_in_date, check_out_date, reservation_date, reservation_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Confirmed')
       RETURNING *`,
      [reservation_id, guest_id, room_number, room_type, check_in_date, check_out_date, reservation_date]
    );

    // Step 4: Update room status
    await pool.query('UPDATE rooms SET room_status = $1 WHERE room_number = $2', ['Occupied', room_number]);
    
    // Step 5: Create payment record
    const payment_id = 'PAY-' + uuidv4().slice(0, 6).toUpperCase();
    const payment_date = new Date().toISOString().split('T')[0];
    
    await pool.query(
      `INSERT INTO payments 
       (payment_id, reservation_id, guest_id, payment_amount, payment_date, payment_method, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Fully Paid')`,
      [payment_id, reservation_id, guest_id, payment_amount, payment_date, payment_method]
    );
    
    // Return comprehensive response with all data from database
    const fullReservation = resResult.rows[0];
    res.json({
      ...fullReservation,
      guest_id: guestResult.rows[0].guest_id,
      full_name: guestResult.rows[0].full_name,
      payment_id: payment_id,
      payment_amount: payment_amount
    });
  } catch (err) {
    console.error('Reservation error:', err);
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/reservations', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.reservation_id,
        r.guest_id,
        r.room_number,
        r.room_type,
        r.check_in_date,
        r.check_out_date,
        r.reservation_date,
        r.reservation_status,
        g.full_name,
        g.email,
        g.phone_number,
        p.payment_amount,
        p.payment_method,
        p.payment_status
      FROM reservations r
      LEFT JOIN guests g ON r.guest_id = g.guest_id
      LEFT JOIN payments p ON r.reservation_id = p.reservation_id
      ORDER BY r.reservation_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== PAYMENTS ====================
app.post('/api/payments', async (req, res) => {
  try {
    const { reservation_id, guest_id, payment_amount, payment_method } = req.body;
    const payment_id = 'PAY-' + uuidv4().slice(0, 6).toUpperCase();
    const payment_date = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `INSERT INTO payments 
       (payment_id, reservation_id, guest_id, payment_amount, payment_date, payment_method, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Fully Paid')
       RETURNING *`,
      [payment_id, reservation_id, guest_id, payment_amount, payment_date, payment_method]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== STATS ====================
app.get('/api/stats', async (req, res) => {
  try {
    const reservations = await pool.query('SELECT COUNT(*) as total FROM reservations');
    const confirmed = await pool.query("SELECT COUNT(*) as total FROM reservations WHERE reservation_status = 'Confirmed'");
    const revenue = await pool.query('SELECT SUM(payment_amount) as total FROM payments');

    res.json({
      total_reservations: parseInt(reservations.rows[0].total),
      active_bookings: parseInt(confirmed.rows[0].total),
      total_revenue: parseFloat(revenue.rows[0].total || 0)
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== STAFF LOGIN ====================
app.post('/api/staff/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM staff WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      delete user.password; 
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== START SERVER (ALWAYS AT THE BOTTOM) ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
});