require('dotenv').config();

// Fail fast when required env vars are missing to avoid silent 401s
if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
  console.error('Missing required environment variables: JWT_SECRET and/or MONGO_URI.');
  console.error('Create a .env file in the backend folder (see .env.example) and set these values.');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

connectDB();

const app = express();

// CORS configuration
// app.use(cors({
//   origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));
const cors = require("cors");

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.options('*', cors());

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads folder
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased for development
  message: 'Too many requests from this IP, please try again later.',
});

const jobSearchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many job search requests, please try again later.',
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Routes with rate limits
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/jobs/search', jobSearchLimiter, require('./routes/jobs'));
app.use('/api/resume', require('./routes/resume'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/career', require('./routes/career'));
app.use('/api/subscription', require('./routes/subscription'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Cron job: daily job search at 8 AM IST (2:30 AM UTC)
cron.schedule('30 2 * * *', async () => {
  console.log('Running daily job search...');
  // TODO: Implement daily job search logic
  // 1. Get all active users
  // 2. For each user, run job search
  // 3. Send Telegram notification
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
