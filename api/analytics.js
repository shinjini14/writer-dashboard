const jwt = require('jsonwebtoken');

// Authentication middleware
function authenticateToken(req) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    return decoded;
  } catch (error) {
    return null;
  }
}

// Mock analytics data
const analyticsData = {
  totalViews: 8500000,
  targetViews: 10000000,
  monthlyViews: [
    { month: 'Jan', views: 750000 },
    { month: 'Feb', views: 820000 },
    { month: 'Mar', views: 950000 },
    { month: 'Apr', views: 1100000 },
    { month: 'May', views: 1200000 },
    { month: 'Jun', views: 1350000 },
    { month: 'Jul', views: 1400000 },
    { month: 'Aug', views: 1500000 },
    { month: 'Sep', views: 1600000 },
    { month: 'Oct', views: 1750000 },
    { month: 'Nov', views: 1850000 },
    { month: 'Dec', views: 2000000 }
  ],
  topPerformingContent: [
    {
      id: 1,
      title: '[STL] My boy best friend thinks we\'ve been dating for a year',
      views: 2500000,
      engagement: 85,
      publishDate: '2024-03-16'
    },
    {
      id: 2,
      title: '[Original] The mystery of the missing cat',
      views: 1800000,
      engagement: 78,
      publishDate: '2024-04-05'
    },
    {
      id: 3,
      title: '[TLDR] How I accidentally became a millionaire',
      views: 1600000,
      engagement: 82,
      publishDate: '2024-03-28'
    },
    {
      id: 4,
      title: '[Original] The time I met a celebrity',
      views: 1400000,
      engagement: 75,
      publishDate: '2024-03-20'
    },
    {
      id: 5,
      title: '[STL] She said yes but I wasn\'t ready',
      views: 1200000,
      engagement: 88,
      publishDate: '2024-04-12'
    }
  ],
  engagementMetrics: {
    averageEngagement: 81,
    totalLikes: 450000,
    totalComments: 125000,
    totalShares: 85000,
    subscriberGrowth: 15000
  },
  contentTypeBreakdown: [
    { type: 'STL/Trope', count: 8, percentage: 44 },
    { type: 'Original', count: 6, percentage: 33 },
    { type: 'TLDR', count: 4, percentage: 23 }
  ],
  statusBreakdown: [
    { status: 'Posted', count: 4, percentage: 22 },
    { status: 'Under Review', count: 4, percentage: 22 },
    { status: 'Pending', count: 4, percentage: 22 },
    { status: 'Rejected', count: 3, percentage: 17 },
    { status: 'Draft', count: 3, percentage: 17 }
  ]
};

// Vercel serverless function for analytics
module.exports = function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Authenticate user
  const user = authenticateToken(req);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Return analytics data
    res.json(analyticsData);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
