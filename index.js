const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://tossdown.com';

// CORS configuration
const corsOptions = {
  origin: ALLOWED_ORIGIN,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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

