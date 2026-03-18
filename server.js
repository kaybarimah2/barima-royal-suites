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
// Force the server to send index.html when users visit the main URL
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

app.get('/api/guests/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM guests WHERE guest_id = $1', [req.params.id]);
    res.json(result.rows[0] || {});
  } catch (err) {
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

app.get('/api/rooms/:number', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rooms WHERE room_number = $1', [req.params.number]);
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/rooms/:number', async (req, res) => {
  try {
    const { room_status } = req.body;
    const result = await pool.query(
      'UPDATE rooms SET room_status = $1 WHERE room_number = $2 RETURNING *',
      [room_status, req.params.number]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== RESERVATIONS ====================
app.post('/api/reservations', async (req, res) => {
  try {
    const {
      guest_id,
      room_number,
      room_type,
      check_in_date,
      check_out_date,
      payment_method
    } = req.body;

    const reservation_id = 'RES-' + uuidv4().slice(0, 6).toUpperCase();
    const reservation_date = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `INSERT INTO reservations 
       (reservation_id, guest_id, room_number, room_type, check_in_date, check_out_date, reservation_date, reservation_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Confirmed')
       RETURNING *`,
      [reservation_id, guest_id, room_number, room_type, check_in_date, check_out_date, reservation_date]
    );

    // Update room status to Occupied
    await pool.query('UPDATE rooms SET room_status = $1 WHERE room_number = $2', ['Occupied', room_number]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating reservation:', err);
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

app.get('/api/reservations/lookup/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, g.full_name, g.email, g.phone_number, p.payment_amount, p.payment_id
       FROM reservations r
       JOIN guests g ON r.guest_id = g.guest_id
       LEFT JOIN payments p ON r.reservation_id = p.reservation_id
       WHERE r.reservation_id = $1`,
      [req.params.id]
    );
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/reservations/:id', async (req, res) => {
  try {
    const { reservation_status, room_number } = req.body;
    
    // If cancelling, mark room as available
    if (reservation_status === 'Cancelled' && room_number) {
      await pool.query('UPDATE rooms SET room_status = $1 WHERE room_number = $2', ['Available', room_number]);
    }

    const result = await pool.query(
      'UPDATE reservations SET reservation_status = $1 WHERE reservation_id = $2 RETURNING *',
      [reservation_status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/reservations/:id', async (req, res) => {
  try {
    // Get reservation to find room number
    const resResult = await pool.query('SELECT room_number FROM reservations WHERE reservation_id = $1', [req.params.id]);
    const reservation = resResult.rows[0];

    if (reservation) {
      // Mark room as available
      await pool.query('UPDATE rooms SET room_status = $1 WHERE room_number = $2', ['Available', reservation.room_number]);
    }

    // Delete reservation
    await pool.query('DELETE FROM reservations WHERE reservation_id = $1', [req.params.id]);
    
    // Delete associated payments
    await pool.query('DELETE FROM payments WHERE reservation_id = $1', [req.params.id]);

    res.json({ success: true });
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

app.get('/api/payments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payments ORDER BY payment_date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== CONTACT ====================
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO contact_messages (name, email, message, status) 
       VALUES ($1, $2, $3, 'New') 
       RETURNING *`,
      [name, email, message]
    );

    res.status(201).json({ success: true, message: 'Thank you! We will get back to you within 24 hours.' });
  } catch (err) {
    console.error('Error submitting contact form:', err);
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/contact', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json(result.rows);
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

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running ✅', timestamp: new Date() });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
});

// You need to save this very well