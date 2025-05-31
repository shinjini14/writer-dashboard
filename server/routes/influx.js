const express = require('express');
const InfluxService = require('../services/influxService');
const router = express.Router();

let influxService;

// Initialize InfluxDB service with hardcoded credentials for now
const initializeInfluxService = () => {
  try {
    // Hardcode the credentials since .env is not loading properly
    process.env.INFLUXDB_URL = 'https://us-east-1-1.aws.cloud2.influxdata.com';
    process.env.INFLUXDB_TOKEN = 'ojNizGw1U0VID3ltz1khIx2aOQAHG0gIFEbR7VqVk6Ns23fzXOcJG-JxPkGKWL6lluFBQKdagMRbHm6-2iVHSw==';
    process.env.INFLUXDB_ORG = 'engineering team';
    process.env.INFLUXDB_BUCKET = 'youtube_api';

    influxService = new InfluxService();
    return true;
  } catch (error) {
    console.error('Failed to initialize InfluxDB service:', error);
    return false;
  }
};

// Try to initialize on startup
initializeInfluxService();

// Test InfluxDB connection
router.get('/test', async (req, res) => {
  try {
    if (!influxService) {
      return res.status(500).json({
        success: false,
        message: 'InfluxDB service not initialized'
      });
    }

    const isConnected = await influxService.testConnection();
    res.json({
      success: isConnected,
      message: isConnected ? 'Connected to InfluxDB' : 'Failed to connect to InfluxDB'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error testing connection',
      error: error.message
    });
  }
});

// Explore data structure
router.get('/explore', async (req, res) => {
  try {
    if (!influxService) {
      return res.status(500).json({
        success: false,
        message: 'InfluxDB service not initialized'
      });
    }

    const structure = await influxService.exploreDataStructure();
    res.json({
      success: true,
      data: structure
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exploring data structure',
      error: error.message
    });
  }
});

// Get sample data
router.get('/sample', async (req, res) => {
  try {
    if (!influxService) {
      return res.status(500).json({
        success: false,
        message: 'InfluxDB service not initialized'
      });
    }

    const limit = parseInt(req.query.limit) || 20;
    const sampleData = await influxService.getSampleData(limit);
    res.json({
      success: true,
      data: sampleData,
      count: sampleData.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting sample data',
      error: error.message
    });
  }
});

// Get YouTube analytics
router.get('/youtube-analytics', async (req, res) => {
  try {
    if (!influxService) {
      return res.status(500).json({
        success: false,
        message: 'InfluxDB service not initialized'
      });
    }

    const timeRange = req.query.range || '30d';
    const analytics = await influxService.getYouTubeAnalytics(timeRange);
    res.json({
      success: true,
      data: analytics,
      count: analytics.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting YouTube analytics',
      error: error.message
    });
  }
});

// Get video performance
router.get('/video-performance', async (req, res) => {
  try {
    if (!influxService) {
      return res.status(500).json({
        success: false,
        message: 'InfluxDB service not initialized'
      });
    }

    const timeRange = req.query.range || '30d';
    const videoId = req.query.videoId;
    const performance = await influxService.getVideoPerformance(videoId, timeRange);
    res.json({
      success: true,
      data: performance,
      count: performance.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting video performance',
      error: error.message
    });
  }
});

// Get channel stats
router.get('/channel-stats', async (req, res) => {
  try {
    if (!influxService) {
      return res.status(500).json({
        success: false,
        message: 'InfluxDB service not initialized'
      });
    }

    const timeRange = req.query.range || '30d';
    const stats = await influxService.getChannelStats(timeRange);
    res.json({
      success: true,
      data: stats,
      count: stats.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting channel stats',
      error: error.message
    });
  }
});

// Get submissions data
router.get('/submissions', async (req, res) => {
  try {
    if (!influxService) {
      return res.status(500).json({
        success: false,
        message: 'InfluxDB service not initialized'
      });
    }

    const timeRange = req.query.range || '30d';
    const submissions = await influxService.getSubmissionsData(timeRange);
    res.json({
      success: true,
      data: submissions,
      count: submissions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting submissions data',
      error: error.message
    });
  }
});

module.exports = router;
