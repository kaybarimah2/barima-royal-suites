# 🏨 Barima Royal Suites - Backend Setup Guide

## ✅ What's Installed

Your backend is **ready to run**! All dependencies are installed.

---

## 🔧 Step 1: Get Your Database Connection String from Railway

### A. Go to Railway Dashboard:
1. Visit **https://railway.app** (login to your account)
2. Click on your **Barima Royal Suites** project
3. Find the **PostgreSQL** service card and click it
4. Click the **"Connect"** tab

### B. Copy the Connection String:
Look for **"Postgres Connection"** and copy the full string that looks like:
```
postgresql://postgres:abc123xyz@containers-us-west-123.railway.app:7890/railway
```

---

## 🔑 Step 2: Update Your .env File

1. Open `.env` file in VS Code
2. Replace the line:
   ```
   DATABASE_URL=postgresql://postgres:your_password@your-railway-host:5432/barima_royal_suites
   ```
   With your actual connection string from Railway

3. Save the file

**Example of completed .env:**
```
DATABASE_URL=postgresql://postgres:abc123xyz@containers-us-west-123.railway.app:7890/railway
PORT=3000
NODE_ENV=production
```

---

## 🚀 Step 3: Start the Backend Server

### Option 1: Run Locally (for testing)
```bash
npm start
```

You should see:
```
✓ Database connected
✓ Server running on port 3000
```

### Option 2: Run with Nodemon (auto-reload on changes)
```bash
npm run dev
```

---

## 📡 Step 4: Test Your Backend

Open your browser and go to:
```
http://localhost:3000/api/health
```

You should see:
```json
{
  "status": "Backend is running ✅",
  "timestamp": "2026-03-18T..."
}
```

---

## 🔌 Connect Frontend to Backend

In your `index.html` and `script.js`, you need to update API calls.

Currently your frontend uses mock Data SDK. Replace it with real API calls:

### Example 1: Get All Rooms
**Before (Mock):**
```javascript
// This won't work - uses mock SDK
```

**After (Real API):**
```javascript
fetch('http://localhost:3000/api/rooms')
  .then(res => res.json())
  .then(data => console.log(data));
```

### Example 2: Create Reservation
**Before (Mock):**
```javascript
// Booking form submission
```

**After (Real API):**
```javascript
const bookingData = {
  full_name: "John Smith",
  email: "john@example.com",
  phone_number: "+233XXXXXXXXX",
  national_id: "GHA-XXXXXXXXX-X",
  room_type: "Single",
  check_in_date: "2026-04-01",
  check_out_date: "2026-04-03",
  payment_method: "Card"
};

fetch('http://localhost:3000/api/guests', { method: 'POST', body: JSON.stringify(bookingData) })
  .then(res => res.json())
  .then(guest => {
    // Save guest ID, then create reservation...
  });
```

---

## 📚 Available API Endpoints

### Guests
- `POST /api/guests` - Create new guest
- `GET /api/guests/:id` - Get guest by ID

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:number` - Get room by number
- `PUT /api/rooms/:number` - Update room status

### Reservations
- `POST /api/reservations` - Create reservation
- `GET /api/reservations` - Get all reservations (admin)
- `GET /api/reservations/lookup/:id` - Lookup reservation
- `PUT /api/reservations/:id` - Update reservation status
- `DELETE /api/reservations/:id` - Delete reservation

### Payments
- `POST /api/payments` - Create payment
- `GET /api/payments` - Get all payments

### Contact
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Get all contact messages (admin)

### Stats
- `GET /api/stats` - Get dashboard statistics

### Health
- `GET /api/health` - Check if backend is running

---

## 🚢 Deploy to Railway

### Option 1: Deploy Backend to Railway
1. Your backend code already connects to Railway Postgres
2. Create a new service in Railway for Node.js
3. Connect your GitHub repo
4. Railway will auto-deploy on git push

### Option 2: Use Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

---

## ❌ Troubleshooting

### "Cannot connect to database"
- Check `.env` file has correct `DATABASE_URL`
- Verify Railway Postgres service is running
- Make sure you copied the FULL connection string

### "Port 3000 already in use"
- Change `PORT` in `.env` to something like `3001` or `5000`
- Or kill the existing process using that port

### "Tables don't exist"
- Make sure you ran `init-db.sql` in your Railway Postgres database first

---

## 🎉 Next Steps

1. **Update your frontend** to use real API instead of mock SDK
2. **Test each form** (booking, contact lookup, etc.)
3. **Deploy to Railway** when ready
4. **Monitor** your backend with `railway logs`

---

**Your backend is now connected to your Railway PostgreSQL database!** 🚀
