const express = require('./server/node_modules/express');
const cors = require('./server/node_modules/cors');
const jwt = require('./server/node_modules/jsonwebtoken');

console.log('🚀 Starting test server...');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// JWT verification middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, 'fallback_secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Health check
app.get('/api/health', (req, res) => {
  console.log('📋 Health check requested');
  res.json({ status: 'OK', message: 'Test server is running' });
});

// Mock BigQuery writer views endpoint
app.get("/api/writer/views", authenticateToken, async (req, res) => {
  const { writer_id, startDate, endDate } = req.query;

  // Validate required parameters
  if (!writer_id || !startDate || !endDate) {
    return res
      .status(400)
      .json({ error: "Missing writer_id, startDate, or endDate" });
  }

  try {
    console.log('📊 Mock BigQuery views request:', { writer_id, startDate, endDate });

    // Generate mock data for testing
    const mockData = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      mockData.push({
        time: { value: d.toISOString().split('T')[0] },
        views: Math.floor(Math.random() * 100000) + 50000
      });
    }
    
    console.log(`📊 Returning ${mockData.length} mock data points`);
    res.json(mockData);

  } catch (error) {
    console.error("❌ Error generating mock views data:", error);
    res.status(500).json({ error: "Error generating mock views data" });
  }
});

// Simple login endpoint for testing
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Mock login attempt:', req.body);
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password required' 
      });
    }

    // Mock authentication - accept any username/password for testing
    const token = jwt.sign(
      { 
        id: 1, 
        username: username, 
        role: 'writer' 
      },
      'fallback_secret',
      { expiresIn: '24h' }
    );

    console.log('✅ Mock login successful for:', username);

    res.json({
      success: true,
      token,
      username: username,
      role: 'writer',
      message: 'Mock login successful'
    });

  } catch (error) {
    console.error('❌ Mock login error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`📋 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Login: http://localhost:${PORT}/api/auth/login`);
  console.log(`📊 Views: http://localhost:${PORT}/api/writer/views`);
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error.message);
});
