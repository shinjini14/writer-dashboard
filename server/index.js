const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const submissionRoutes = require('./routes/submissions');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/user');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Writer Dashboard API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
