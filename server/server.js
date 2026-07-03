const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ===== IMPORTANT: Routes =====
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/resume', require('./routes/resumeRoutes'));

// Home Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 AI Resume Builder API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/me'
      },
      resume: {
        create: 'POST /api/resume',
        getAll: 'GET /api/resume',
        getOne: 'GET /api/resume/:id',
        update: 'PUT /api/resume/:id',
        delete: 'DELETE /api/resume/:id',
        tailor: 'POST /api/resume/tailor/:id'
      }
    }
  });
});

// Error Handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Test: http://localhost:${PORT}`);
});
