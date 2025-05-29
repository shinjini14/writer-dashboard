import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  FormControl,
  Select,
  MenuItem,
  Button,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import Layout from '../components/Layout.jsx';
import ChannelChart from '../components/ChannelChart.jsx';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('last28days');
  const [tabValue, setTabValue] = useState(0);

  const dateRangeOptions = [
    { value: 'last7days', label: 'Last 7 days' },
    { value: 'last28days', label: 'Last 28 days' },
    { value: 'last90days', label: 'Last 90 days' },
    { value: 'last365days', label: 'Last 365 days' },
    { value: 'lifetime', label: 'Lifetime' },
    { value: '2025', label: '2025' },
    { value: '2024', label: '2024' },
    { value: 'may', label: 'May' },
    { value: 'april', label: 'April' },
    { value: 'march', label: 'March' },
    { value: 'custom', label: 'Custom' }
  ];

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:5001/api/analytics/channel?range=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // If API fails, use local dummy data
        console.warn('API not available, using dummy data');
        const dummyData = generateDummyData(dateRange);
        setAnalyticsData(dummyData);
        return;
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.warn('API error, using dummy data:', err);
      // Fallback to dummy data
      const dummyData = generateDummyData(dateRange);
      setAnalyticsData(dummyData);
    } finally {
      setLoading(false);
    }
  };

  const generateDummyData = (range) => {
    const getDaysFromRange = (range) => {
      switch (range) {
        case 'last7days': return 7;
        case 'last28days': return 28;
        case 'last90days': return 90;
        case 'last365days': return 365;
        case 'lifetime': return 1000;
        case '2025': return 150;
        case '2024': return 365;
        case 'may': return 31;
        case 'april': return 30;
        case 'march': return 31;
        default: return 28;
      }
    };

    const days = getDaysFromRange(range);
    const chartData = [];

    // Base data to match the design (81.1M views for 28 days)
    const targetTotalViews = 81109571;
    const baseViews = targetTotalViews / days;
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Create a more realistic variation pattern
      const variation = (Math.random() - 0.5) * 0.3;
      const trendFactor = 1 + (i / days) * 0.1; // Slight upward trend
      const weekendFactor = [0, 6].includes(date.getDay()) ? 0.8 : 1.0; // Lower on weekends

      const views = Math.floor(baseViews * (1 + variation) * trendFactor * weekendFactor);

      chartData.push({
        date: date.toISOString().split('T')[0],
        views: views,
        timestamp: date.getTime()
      });
    }

    // Ensure total matches target for 28 days
    const currentTotal = chartData.reduce((sum, day) => sum + day.views, 0);
    const adjustment = targetTotalViews - currentTotal;
    if (Math.abs(adjustment) > 0 && chartData.length > 0) {
      const adjustmentPerDay = adjustment / chartData.length;
      chartData.forEach(day => {
        day.views = Math.max(0, Math.floor(day.views + adjustmentPerDay));
      });
    }

    const totalViews = chartData.reduce((sum, day) => sum + day.views, 0);
    const hasDataIssues = true; // Always show data issues warning as in design

    return {
      totalViews: totalViews,
      avgDailyViews: Math.floor(totalViews / days),
      hasDataIssues: hasDataIssues,
      dateRange: range,
      chartData: chartData,
      summary: {
        highestDay: Math.max(...chartData.map(d => d.views)),
        lowestDay: Math.min(...chartData.map(d => d.views)),
        trend: 'same', // "About the same as usual"
        progressToTarget: 67 // Fixed at 67% as shown in design
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
        dataQuality: 'partial',
        source: 'Dummy Data Generator'
      }
    };
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };



  const getDateRangeLabel = () => {
    const option = dateRangeOptions.find(opt => opt.value === dateRange);
    return option ? option.label.toLowerCase() : dateRange;
  };

  const generateTopContent = () => {
    return [
      {
        title: "Children of family vloggers, what's the family viewers never saw?",
        date: "May 19, 2025",
        views: "3.07",
        percentage: "91.1%",
        totalViews: "2,216,236",
        emoji: "👨‍👩‍👧‍👦",
        color: "#D2691E"
      },
      {
        title: "What types of bad parenting do kids not recover from?",
        date: "May 16, 2025",
        views: "1.56",
        percentage: "89.3%",
        totalViews: "2,216,219",
        emoji: "🍼",
        color: "#708090"
      },
      {
        title: "Parents, what's the creepiest thing your child has ever said?",
        date: "May 17, 2025",
        views: "2.19",
        percentage: "78.1%",
        totalViews: "2,176,583",
        emoji: "🧸",
        color: "#FFD700"
      },
      {
        title: "What secret would ruin your life if it came out?",
        date: "Apr 27, 2025",
        views: "3.22",
        percentage: "79.6%",
        totalViews: "2,076,614",
        emoji: "🤐",
        color: "#32CD32"
      },
      {
        title: "Single moms, when did you realize your kid wasn't as innocent as you thought?",
        date: "May 18, 2025",
        views: "3.20",
        percentage: "78.1%",
        totalViews: "1,765,747",
        emoji: "🦊",
        color: "#FF6347"
      },
      {
        title: "What's the worst thing a teacher has ever done to your kids?",
        date: "May 20, 2025",
        views: "2.29",
        percentage: "84.7%",
        totalViews: "1,644,567",
        emoji: "🍎",
        color: "#8B4513"
      },
      {
        title: "The CEOs who thought he could take advantage of me, so I took over the compa...",
        date: "May 5, 2025",
        views: "2.25",
        percentage: "81.5%",
        totalViews: "1,533,895",
        emoji: "💼",
        color: "#32CD32"
      },
      {
        title: "When did your dad's happiness come at the cost of your own?",
        date: "May 16, 2025",
        views: "2.13",
        percentage: "74.5%",
        totalViews: "1,427,518",
        emoji: "✏️",
        color: "#DC143C"
      },
      {
        title: "What's the worst demand your family ever made of you?",
        date: "May 15, 2025",
        views: "2.10",
        percentage: "75.8%",
        totalViews: "1,380,933",
        emoji: "😔",
        color: "#DAA520"
      },
      {
        title: "What's the most heartbreaking secret your best friend has ever told you?",
        date: "May 17, 2025",
        views: "2.02",
        percentage: "77.4%",
        totalViews: "1,298,747",
        emoji: "🎀",
        color: "#FF69B4"
      }
    ];
  };

  if (loading) {
    return (
      <Layout>
        <Box sx={{
          minHeight: '100vh',
          bgcolor: '#1a1a1a',
          color: 'white',
          p: { xs: 2, lg: 4 }
        }}>
          <Box sx={{ width: '100%', mb: 4 }}>
            <LinearProgress sx={{
              bgcolor: '#333',
              '& .MuiLinearProgress-bar': { bgcolor: '#E6B800' }
            }} />
          </Box>
          <Typography variant="h4" sx={{ color: 'white' }}>
            Loading analytics...
          </Typography>
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
        p: { xs: 2, lg: 4 }
      }}>
        {/* Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2
        }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
            Channel analytics
          </Typography>

          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                sx={{
                  bgcolor: '#2A2A2A',
                  color: 'white',
                  border: '1px solid #444',
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '& .MuiSvgIcon-root': { color: 'white' },
                }}
              >
                {dateRangeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Tooltip title="Refresh data">
              <IconButton
                onClick={fetchAnalytics}
                sx={{
                  color: 'white',
                  bgcolor: '#2A2A2A',
                  border: '1px solid #444',
                  '&:hover': { bgcolor: '#333' }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              bgcolor: 'rgba(244, 67, 54, 0.1)',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              '& .MuiAlert-message': { color: '#ff6b6b' }
            }}
            action={
              <Button color="inherit" size="small" onClick={fetchAnalytics}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ mb: 4 }}>
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
              '& .MuiTabs-indicator': { backgroundColor: '#E6B800' }
            }}
          >
            <Tab label="Overview" />
            <Tab label="Trends" />
          </Tabs>
        </Box>

        {analyticsData && (
          <>
            {/* Main Stats */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h3" sx={{
                color: 'white',
                fontWeight: 700,
                mb: 1,
                textAlign: 'center'
              }}>
                You got {formatNumber(analyticsData.totalViews)} views in the {getDateRangeLabel()}
              </Typography>

              {analyticsData.hasDataIssues && (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  mb: 3
                }}>
                  <WarningIcon sx={{ color: '#ff9800', fontSize: 16 }} />
                  <Typography variant="body2" sx={{ color: '#888' }}>
                    There are temporary data issues affecting your views, check back later
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Chart */}
            <ChannelChart data={analyticsData.chartData} />

            {/* Top Content Section */}
            <Box sx={{ mt: 6 }}>
              <Box sx={{
                display: 'flex',
                gap: 4,
                alignItems: 'flex-start',
                '@media (max-width: 960px)': {
                  flexDirection: 'column'
                }
              }}>
                {/* Left Side - Your top content */}
                <Box sx={{
                  flex: '1 1 65%',
                  '@media (max-width: 960px)': {
                    flex: '1 1 100%'
                  }
                }}>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 3 }}>
                    Your top content in this period
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                      variant="contained"
                      sx={{
                        bgcolor: '#E6B800',
                        color: 'black',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#D4A600' }
                      }}
                    >
                      Content
                    </Button>
                    <Button
                      variant="outlined"
                      sx={{
                        color: '#888',
                        borderColor: '#444',
                        textTransform: 'none',
                        '&:hover': { borderColor: '#666', bgcolor: 'rgba(255,255,255,0.05)' }
                      }}
                    >
                      Shorts
                    </Button>
                  </Box>

                  {/* Content List */}
                  <Box>
                    {generateTopContent().map((content, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 2,
                          mb: 1,
                          bgcolor: '#2A2A2A',
                          borderRadius: '8px',
                          border: '1px solid #333',
                          '&:hover': { bgcolor: '#333' }
                        }}
                      >
                        {/* Rank */}
                        <Typography variant="body2" sx={{ color: '#888', minWidth: 20 }}>
                          {index + 1}
                        </Typography>

                        {/* Thumbnail */}
                        <Box
                          sx={{
                            width: 60,
                            height: 40,
                            bgcolor: content.color,
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px'
                          }}
                        >
                          {content.emoji}
                        </Box>

                        {/* Content Info */}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, mb: 0.5 }}>
                            {content.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#888' }}>
                            {content.date}
                          </Typography>
                        </Box>

                        {/* Views */}
                        <Box sx={{ textAlign: 'right', minWidth: 80 }}>
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                            {content.views}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#888' }}>
                            ({content.percentage})
                          </Typography>
                        </Box>

                        {/* Total Views */}
                        <Typography variant="body2" sx={{ color: '#888', minWidth: 80, textAlign: 'right' }}>
                          {content.totalViews}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* See More Button */}
                  <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Button
                      variant="outlined"
                      sx={{
                        color: 'white',
                        borderColor: '#444',
                        textTransform: 'none',
                        '&:hover': { borderColor: '#666', bgcolor: 'rgba(255,255,255,0.05)' }
                      }}
                    >
                      See more
                    </Button>
                  </Box>
                </Box>

                {/* Right Side - Podcasts and Latest Content */}
                <Box sx={{
                  flex: '1 1 35%',
                  '@media (max-width: 960px)': {
                    flex: '1 1 100%'
                  }
                }}>
                  {/* Podcasts Section */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                      Podcasts
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: '#2A2A2A',
                        borderRadius: '8px',
                        border: '1px solid #333',
                        p: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: '#4A90E2',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px'
                          }}
                        >
                          🎧
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                            Top-performing books Podcast 2.0...
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#888' }}>
                            Updated 2 weeks ago • 91.8 views
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Latest Content Section */}
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                      Latest content
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: '#2A2A2A',
                        borderRadius: '8px',
                        border: '1px solid #333',
                        p: 2
                      }}
                    >
                      {/* Calendar/Grid Image */}
                      <Box
                        sx={{
                          width: '100%',
                          height: 120,
                          bgcolor: '#8B4513',
                          borderRadius: '4px',
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '40px'
                        }}
                      >
                        📅
                      </Box>

                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, mb: 2 }}>
                        Has your tech ever stolen your business?
                      </Typography>

                      <Typography variant="caption" sx={{ color: '#888', mb: 1, display: 'block' }}>
                        Past 1 hour • 69 minutes
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          Views
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                          3.5K
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          Average percentage viewed
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          --
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          Likes
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          --
                        </Typography>
                      </Box>

                      <Typography variant="caption" sx={{ color: '#888', mb: 2, display: 'block' }}>
                        Additional metrics become available 3 hours after publish.
                      </Typography>

                      <Button
                        variant="outlined"
                        size="small"
                        sx={{
                          color: 'white',
                          borderColor: '#444',
                          textTransform: 'none',
                          width: '100%',
                          '&:hover': { borderColor: '#666', bgcolor: 'rgba(255,255,255,0.05)' }
                        }}
                      >
                        See video analytics
                      </Button>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Typography variant="caption" sx={{ color: '#888' }}>
                          1 of 15
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#888' }}>
                          →
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Layout>
  );
};

export default Analytics;
