// Simple server for testing BigQuery integration
const http = require('http');
const url = require('url');

const PORT = 5001;

// Mock data generator
function generateMockViewsData(startDate, endDate) {
  const mockData = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    mockData.push({
      time: { value: d.toISOString().split('T')[0] },
      views: Math.floor(Math.random() * 100000) + 50000
    });
  }
  
  return mockData;
}

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const query = parsedUrl.query;

  console.log(`${req.method} ${path}`, query);

  // Health check
  if (path === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', message: 'Simple server is running' }));
    return;
  }

  // Login endpoint
  if (path === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { username, password } = JSON.parse(body);
        console.log('🔐 Login attempt:', username);
        
        // Mock successful login
        const response = {
          success: true,
          token: 'mock-jwt-token-12345',
          username: username,
          role: 'writer',
          message: 'Login successful'
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid request' }));
      }
    });
    return;
  }

  // BigQuery writer views endpoint
  if (path === '/api/writer/views' && req.method === 'GET') {
    const { writer_id, startDate, endDate } = query;
    
    if (!writer_id || !startDate || !endDate) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing writer_id, startDate, or endDate' }));
      return;
    }
    
    console.log('📊 Mock BigQuery views request:', { writer_id, startDate, endDate });
    
    const mockData = generateMockViewsData(startDate, endDate);
    console.log(`📊 Returning ${mockData.length} mock data points`);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockData));
    return;
  }

  // Default 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`✅ Simple server running on port ${PORT}`);
  console.log(`📋 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Login: http://localhost:${PORT}/api/auth/login`);
  console.log(`📊 Views: http://localhost:${PORT}/api/writer/views`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error.message);
});
