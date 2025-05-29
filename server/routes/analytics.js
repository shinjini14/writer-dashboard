const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get analytics data
router.get('/', authenticateToken, (req, res) => {
  try {
    // Dummy analytics data
    const analyticsData = {
      totalSubmissions: 15,
      acceptedSubmissions: 8,
      rejectedSubmissions: 4,
      pendingSubmissions: 3,
      acceptanceRate: 53.3,
      monthlySubmissions: [
        { month: 'Jan', submissions: 2, accepted: 1 },
        { month: 'Feb', submissions: 3, accepted: 2 },
        { month: 'Mar', submissions: 4, accepted: 2 },
        { month: 'Apr', submissions: 6, accepted: 3 }
      ],
      submissionsByType: [
        { type: 'Trope', count: 8 },
        { type: 'Original', count: 5 },
        { type: 'TLDR', count: 2 }
      ],
      recentActivity: [
        { date: '2025-04-20', action: 'Submission created', title: '[STL] test test do not edit this' },
        { date: '2025-04-15', action: 'Submission created', title: '[Original] My family has a death' },
        { date: '2025-03-16', action: 'Submission accepted', title: '[STL] My boy best friend thinks...' },
        { date: '2025-03-01', action: 'Submission rejected', title: '[STL] testing 123' }
      ]
    };

    res.json(analyticsData);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get submission statistics by date range
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Dummy filtered statistics
    const stats = {
      period: `${startDate} to ${endDate}`,
      totalSubmissions: 8,
      acceptedSubmissions: 4,
      rejectedSubmissions: 2,
      pendingSubmissions: 2,
      averageResponseTime: '5.2 days',
      topPerformingTypes: [
        { type: 'Trope', acceptanceRate: 60 },
        { type: 'Original', acceptanceRate: 40 },
        { type: 'TLDR', acceptanceRate: 50 }
      ]
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get channel analytics data
router.get('/channel', authenticateToken, (req, res) => {
  try {
    const { range = 'last28days' } = req.query;

    // Generate dynamic data based on date range
    const generateChartData = (days) => {
      const data = [];
      const baseViews = 2500000; // Base daily views
      const today = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Add some randomness to make it realistic
        const variation = (Math.random() - 0.5) * 0.4; // ±20% variation
        const seasonalFactor = 1 + Math.sin((i / days) * Math.PI * 2) * 0.1; // Seasonal pattern
        const weekendFactor = [0, 6].includes(date.getDay()) ? 1.2 : 1.0; // Weekend boost

        const views = Math.floor(baseViews * (1 + variation) * seasonalFactor * weekendFactor);

        data.push({
          date: date.toISOString().split('T')[0],
          views: views,
          timestamp: date.getTime()
        });
      }
      return data;
    };

    const getDaysFromRange = (range) => {
      switch (range) {
        case 'last7days': return 7;
        case 'last28days': return 28;
        case 'last90days': return 90;
        case 'last365days': return 365;
        case 'lifetime': return 1000; // Simulate lifetime data
        case '2025': return 150; // Partial year
        case '2024': return 365;
        case 'may': return 31;
        case 'april': return 30;
        case 'march': return 31;
        default: return 28;
      }
    };

    const days = getDaysFromRange(range);
    const chartData = generateChartData(days);
    const totalViews = chartData.reduce((sum, day) => sum + day.views, 0);

    // Calculate some realistic metrics
    const avgDailyViews = Math.floor(totalViews / days);
    const hasDataIssues = Math.random() > 0.7; // 30% chance of data issues

    const analyticsData = {
      totalViews: totalViews,
      avgDailyViews: avgDailyViews,
      hasDataIssues: hasDataIssues,
      dateRange: range,
      chartData: chartData,
      summary: {
        highestDay: Math.max(...chartData.map(d => d.views)),
        lowestDay: Math.min(...chartData.map(d => d.views)),
        trend: totalViews > (avgDailyViews * days * 0.95) ? 'up' : 'down',
        progressToTarget: Math.min((totalViews / 10000000) * 100, 100) // Progress to 10M
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
        dataQuality: hasDataIssues ? 'partial' : 'complete',
        source: 'YouTube Analytics API'
      }
    };

    res.json(analyticsData);
  } catch (error) {
    console.error('Channel analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
