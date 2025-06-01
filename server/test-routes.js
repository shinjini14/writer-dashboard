const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = 5003;

// Middleware
app.use(cors());
app.use(express.json());

// Import and test analytics routes
try {
  const analyticsRoutes = require('./routes/analytics');
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/writer', analyticsRoutes);
  console.log('✅ Analytics routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading analytics routes:', error);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Test server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log('🔗 Test the endpoint: http://localhost:5003/api/writer/top-content?writer_id=106&range=28&limit=10&type=all');
});
