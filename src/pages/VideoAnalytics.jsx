import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  IconButton,
  LinearProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  PlayArrow as PlayIcon,
  VolumeUp as VolumeIcon,
  Settings as SettingsIcon,
  HelpOutline as HelpIcon
} from '@mui/icons-material';
import Layout from '../components/Layout.jsx';

const VideoAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [videoData, setVideoData] = useState(null);

  // Mock video data - in real app this would come from API
  const mockVideoData = {
    1: {
      title: 'Have you ever made a joke at the moment decision that you regret?',
      thumbnail: '🎯',
      color: '#4CAF50',
      duration: '2:41',
      views: 290800,
      viewsIncrease: 34,
      retentionRate: 81.7,
      avgViewDuration: '1:49',
      isShort: true,
      publishDate: 'May 24, 2025',
      chartData: [
        { day: 0, views: 45000 },
        { day: 1, views: 85000 },
        { day: 2, views: 125000 },
        { day: 3, views: 165000 },
        { day: 4, views: 205000 },
        { day: 5, views: 245000 },
        { day: 6, views: 275000 },
        { day: 7, views: 290800 }
      ],
      retentionData: [
        { time: '0:00', percentage: 100 },
        { time: '0:10', percentage: 95 },
        { time: '0:20', percentage: 88 },
        { time: '0:30', percentage: 86 },
        { time: '0:40', percentage: 82 },
        { time: '0:50', percentage: 80 },
        { time: '1:00', percentage: 78 },
        { time: '1:10', percentage: 75 },
        { time: '1:20', percentage: 72 },
        { time: '1:30', percentage: 70 },
        { time: '1:40', percentage: 68 },
        { time: '1:49', percentage: 65 },
        { time: '2:00', percentage: 62 },
        { time: '2:10', percentage: 58 },
        { time: '2:20', percentage: 55 },
        { time: '2:30', percentage: 52 },
        { time: '2:41', percentage: 48 }
      ]
    },
    2: {
      title: 'Nightingale, what\'s your "they didn\'t realize I could understand them" moment?',
      thumbnail: '🎮',
      color: '#2196F3',
      duration: '1:11',
      views: 29700,
      viewsIncrease: 28,
      retentionRate: 89.2,
      avgViewDuration: '1:02',
      isShort: true,
      publishDate: 'May 23, 2025'
    },
    3: {
      title: 'Girls, how did you learn that your father was a sociopath?',
      thumbnail: '💔',
      color: '#E91E63',
      duration: '0:52',
      views: 56500,
      viewsIncrease: 42,
      retentionRate: 76.8,
      avgViewDuration: '0:45',
      isShort: true,
      publishDate: 'May 22, 2025'
    },
    4: {
      title: 'Parents, do you actually have a favorite child?',
      thumbnail: '👶',
      color: '#FF9800',
      duration: '1:47',
      views: 27100,
      viewsIncrease: 31,
      retentionRate: 83.5,
      avgViewDuration: '1:32',
      isShort: true,
      publishDate: 'May 22, 2025'
    },
    5: {
      title: 'What made you realize the villain of a story?',
      thumbnail: '📖',
      color: '#9C27B0',
      duration: '3:02',
      views: 14800,
      viewsIncrease: 25,
      retentionRate: 72.1,
      avgViewDuration: '2:18',
      isShort: true,
      publishDate: 'May 22, 2025'
    }
  };

  useEffect(() => {
    const data = mockVideoData[id];
    if (data) {
      setVideoData(data);
      // Update page title
      document.title = `${data.title} - Video Analytics`;
    }

    // Cleanup: reset title when component unmounts
    return () => {
      document.title = 'Writer Dashboard';
    };
  }, [id]);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  if (!videoData) {
    return (
      <Layout>
        <Box sx={{
          minHeight: '100vh',
          bgcolor: '#1a1a1a',
          color: 'white',
          p: 4
        }}>
          <Typography variant="h4">Video not found</Typography>
          <Button
            onClick={() => navigate('/content')}
            sx={{ mt: 2, color: '#E6B800' }}
          >
            Back to Content
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{
        minHeight: '100vh',
        bgcolor: '#1a1a1a',
        color: 'white',
        p: 4
      }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <IconButton
              onClick={() => navigate('/content')}
              sx={{ color: '#888' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
              Video analytics
            </Typography>
          </Box>

          {/* Tabs */}
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{
              '& .MuiTab-root': {
                color: '#888',
                textTransform: 'none',
                fontSize: '16px',
                fontWeight: 500
              },
              '& .Mui-selected': { color: 'white !important' },
              '& .MuiTabs-indicator': { backgroundColor: 'white' }
            }}
          >
            <Tab label="Overview" />
            <Tab label="Reach" />
            <Tab label="Engagement" />
            <Tab label="Audience" />
          </Tabs>
        </Box>

        {/* Performance Summary */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
            Great job! Views are {videoData.viewsIncrease}% higher than your other {videoData.isShort ? 'Shorts' : 'Videos'}.
          </Typography>
        </Box>

        {/* Views Chart Section */}
        <Card sx={{
          bgcolor: '#2A2A2A',
          border: '1px solid #333',
          mb: 4,
          borderRadius: 2
        }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ color: '#888', mb: 1, textAlign: 'center' }}>
                Views
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                  {formatNumber(videoData.views)}
                </Typography>
                <TrendingUpIcon sx={{ color: '#4CAF50', fontSize: 20 }} />
              </Box>
              <Typography variant="body2" sx={{ color: '#888', textAlign: 'center' }}>
                73.8K more than usual
              </Typography>
            </Box>

            {/* Chart Area */}
            <Box sx={{
              height: 200,
              bgcolor: '#1a1a1a',
              borderRadius: 1,
              position: 'relative',
              mb: 3
            }}>
              {/* Simple chart representation */}
              <svg width="100%" height="100%" viewBox="0 0 600 200">
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00BCD4" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#00BCD4" stopOpacity="0"/>
                  </linearGradient>
                </defs>

                {/* Chart line */}
                <path
                  d="M 50 150 Q 150 120 250 100 Q 350 90 450 85 Q 500 82 550 80"
                  stroke="#00BCD4"
                  strokeWidth="3"
                  fill="none"
                />

                {/* Chart area fill */}
                <path
                  d="M 50 150 Q 150 120 250 100 Q 350 90 450 85 Q 500 82 550 80 L 550 180 L 50 180 Z"
                  fill="url(#chartGradient)"
                />

                {/* Typical performance line */}
                <path
                  d="M 50 160 L 550 140"
                  stroke="#666"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="5,5"
                />
              </svg>

              {/* Chart labels */}
              <Box sx={{
                position: 'absolute',
                bottom: 10,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'space-between',
                px: 2
              }}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map(day => (
                  <Typography key={day} variant="caption" sx={{ color: '#888' }}>
                    {day}
                  </Typography>
                ))}
              </Box>

              {/* Y-axis labels */}
              <Box sx={{
                position: 'absolute',
                right: 10,
                top: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                py: 2
              }}>
                <Typography variant="caption" sx={{ color: '#888' }}>300.0K</Typography>
                <Typography variant="caption" sx={{ color: '#888' }}>200.0K</Typography>
                <Typography variant="caption" sx={{ color: '#888' }}>100.0K</Typography>
                <Typography variant="caption" sx={{ color: '#888' }}>0</Typography>
              </Box>
            </Box>

            {/* Legend */}
            <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: '#00BCD4', borderRadius: '50%' }} />
                <Typography variant="body2" sx={{ color: '#888' }}>This video</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 2, bgcolor: '#666' }} />
                <Typography variant="body2" sx={{ color: '#888' }}>Typical performance</Typography>
              </Box>
            </Box>

            <Button
              variant="outlined"
              sx={{
                color: '#888',
                borderColor: '#444',
                textTransform: 'none',
                '&:hover': { borderColor: '#666' }
              }}
            >
              See more
            </Button>
          </CardContent>
        </Card>

        {/* Key Moments for Audience Retention */}
        <Card sx={{
          bgcolor: '#2A2A2A',
          border: '1px solid #333',
          borderRadius: 2
        }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                Key moments for audience retention
              </Typography>
              <Button
                variant="outlined"
                size="small"
                sx={{
                  color: '#888',
                  borderColor: '#444',
                  textTransform: 'none',
                  '&:hover': { borderColor: '#666' }
                }}
              >
                Intro
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
              {/* Left side - Stats */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                    Stayed to watch
                  </Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {videoData.retentionRate}%
                  </Typography>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                    Average view duration
                  </Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {videoData.avgViewDuration}
                  </Typography>
                </Box>

                {/* Retention Chart */}
                <Box sx={{
                  height: 200,
                  bgcolor: '#1a1a1a',
                  borderRadius: 1,
                  position: 'relative',
                  mb: 3
                }}>
                  <svg width="100%" height="100%" viewBox="0 0 400 200">
                    {/* Grid lines */}
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#333" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />

                    {/* Retention curve */}
                    <path
                      d="M 20 20 Q 50 25 80 40 Q 120 60 160 80 Q 200 100 240 120 Q 280 140 320 160 Q 350 170 380 180"
                      stroke="#00BCD4"
                      strokeWidth="3"
                      fill="none"
                    />

                    {/* Key moment marker */}
                    <circle cx="60" cy="35" r="4" fill="#FF5722" />
                    <line x1="60" y1="35" x2="60" y2="200" stroke="#FF5722" strokeWidth="2" strokeDasharray="3,3" />
                  </svg>

                  {/* Y-axis labels */}
                  <Box sx={{
                    position: 'absolute',
                    right: 5,
                    top: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    py: 1
                  }}>
                    <Typography variant="caption" sx={{ color: '#888' }}>180%</Typography>
                    <Typography variant="caption" sx={{ color: '#888' }}>120%</Typography>
                    <Typography variant="caption" sx={{ color: '#888' }}>60%</Typography>
                    <Typography variant="caption" sx={{ color: '#888' }}>0%</Typography>
                  </Box>

                  {/* X-axis labels */}
                  <Box sx={{
                    position: 'absolute',
                    bottom: 5,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    px: 2
                  }}>
                    <Typography variant="caption" sx={{ color: '#888' }}>0:00</Typography>
                    <Typography variant="caption" sx={{ color: '#888' }}>1:11</Typography>
                    <Typography variant="caption" sx={{ color: '#888' }}>2:21</Typography>
                  </Box>
                </Box>

                {/* Legend */}
                <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: '#00BCD4', borderRadius: '50%' }} />
                    <Typography variant="body2" sx={{ color: '#888' }}>This video</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 2, bgcolor: '#666' }} />
                    <Typography variant="body2" sx={{ color: '#888' }}>Typical retention not available</Typography>
                  </Box>
                </Box>

                {/* Insight */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, bgcolor: '#333', borderRadius: 1 }}>
                  <Box sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: '#E6B800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    mt: 0.5
                  }}>
                    <Typography variant="caption" sx={{ color: 'black', fontWeight: 'bold' }}>!</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    86% of viewers are still watching at around the 0:30 mark, which is above typical. Learn more by comparing to your other videos.
                  </Typography>
                </Box>
              </Box>

              {/* Right side - Video Player */}
              <Box sx={{ flex: 1, maxWidth: 300 }}>
                <Box sx={{
                  position: 'relative',
                  bgcolor: '#000',
                  borderRadius: 1,
                  overflow: 'hidden',
                  aspectRatio: '9/16'
                }}>
                  {/* Video thumbnail */}
                  <Box sx={{
                    width: '100%',
                    height: '100%',
                    bgcolor: videoData.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '60px'
                  }}>
                    {videoData.thumbnail}
                  </Box>

                  {/* Video controls */}
                  <Box sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: 'rgba(0,0,0,0.8)',
                    p: 1
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <IconButton size="small" sx={{ color: 'white' }}>
                        <PlayIcon />
                      </IconButton>
                      <IconButton size="small" sx={{ color: 'white' }}>
                        <VolumeIcon />
                      </IconButton>
                      <Typography variant="caption" sx={{ color: 'white', mx: 1 }}>
                        0:00 / {videoData.duration}
                      </Typography>
                      <Box sx={{ flexGrow: 1 }} />
                      <IconButton size="small" sx={{ color: 'white' }}>
                        <SettingsIcon />
                      </IconButton>
                    </Box>

                    {/* Progress bar */}
                    <LinearProgress
                      variant="determinate"
                      value={0}
                      sx={{
                        height: 4,
                        bgcolor: 'rgba(255,255,255,0.3)',
                        '& .MuiLinearProgress-bar': { bgcolor: '#FF0000' }
                      }}
                    />
                  </Box>
                </Box>

                {/* Chart guide */}
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'white' }}>Chart guide</Typography>
                  <IconButton size="small" sx={{ color: '#888' }}>
                    <HelpIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};

export default VideoAnalytics;
