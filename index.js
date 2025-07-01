const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://tossdown.com';

// CORS configuration - allow localhost for development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Allow the configured origin
    if (origin === ALLOWED_ORIGIN) {
      return callback(null, true);
    }

    // For development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Handle preflight requests
app.options('*', cors(corsOptions));

// Routes
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/career', require('./routes/career'))
app.use('/api/applications', require('./routes/applications'));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Career Service API' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

