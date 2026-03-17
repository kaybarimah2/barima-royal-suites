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
    const { guest_id, room_number, room_type, check_in_date, check_out_date } = req.body;
    const reservation_id = 'RES-' + uuidv4().slice(0, 6).toUpperCase();
    const reservation_date = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `INSERT INTO reservations 
       (reservation_id, guest_id, room_number, room_type, check_in_date, check_out_date, reservation_date, reservation_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Confirmed')
       RETURNING *`,
      [reservation_id, guest_id, room_number, room_type, check_in_date, check_out_date, reservation_date]
    );

    await pool.query('UPDATE rooms SET room_status = $1 WHERE room_number = $2', ['Occupied', room_number]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/reservations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reservations ORDER BY reservation_date DESC');
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