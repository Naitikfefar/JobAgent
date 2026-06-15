require('dotenv').config();
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

// Root health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'JobAgent API is running' });
});

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

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
  max: 10,
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
