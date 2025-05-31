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
  LinearProgress,
  CircularProgress,
  Select,
  MenuItem,
  FormControl
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  PlayArrow as PlayIcon,
  VolumeUp as VolumeIcon,
  Settings as SettingsIcon,
  HelpOutline as HelpIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '../components/Layout.jsx';
import axios from 'axios';

const VideoAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('lifetime'); // Default to lifetime

  // Fetch video data from API
  const fetchVideoData = async () => {
    setLoading(true);
    setError(null);
    try {
      const writerId = localStorage.getItem('writerId') || '106';
      console.log('🎬 Fetching video analytics for ID:', id, 'Writer:', writerId);

      const response = await axios.get(`/api/video/${id}`, {
        params: {
          writer_id: writerId,
          range: dateRange
        }
      });

      if (response.data) {
        setVideoData(response.data);
        // Update page title
        document.title = `${response.data.title} - Video Analytics`;
        console.log('✅ Video data loaded:', response.data.title);
      }
    } catch (err) {
      console.error('❌ Error fetching video data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load video data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchVideoData();
    }

    // Cleanup: reset title when component unmounts
    return () => {
      document.title = 'Writer Dashboard';
    };
  }, [id, dateRange]); // Refetch when date range changes

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  // Calculate engagement metrics dynamically
  const calculateEngagement = (likes, views) => {
    if (!views || views === 0) return 0;
    return ((likes / views) * 100).toFixed(2);
  };

  const calculateRetentionRate = (avgViewDuration, totalDuration) => {
    if (!avgViewDuration || !totalDuration) return 75; // Default fallback

    // Parse duration strings (e.g., "1:30" -> 90 seconds)
    const parseTime = (timeStr) => {
      const parts = timeStr.split(':');
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    };

    const avgSeconds = parseTime(avgViewDuration);
    const totalSeconds = parseTime(totalDuration);

    return Math.round((avgSeconds / totalSeconds) * 100);
  };

  if (loading) {
    return (
      <Layout>
        <Box sx={{
          minHeight: '100vh',
          bgcolor: '#1a1a1a',
          color: 'white',
          p: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ color: '#E6B800', mb: 2 }} />
            <Typography variant="h6">Loading video analytics...</Typography>
          </Box>
        </Box>
      </Layout>
    );
  }

  if (error || !videoData) {
    return (
      <Layout>
        <Box sx={{
          minHeight: '100vh',
          bgcolor: '#1a1a1a',
          color: 'white',
          p: 4
        }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            {error ? 'Error loading video' : 'Video not found'}
          </Typography>
          {error && (
            <Typography variant="body1" sx={{ color: '#ff6b6b', mb: 2 }}>
              {error}
            </Typography>
          )}
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

          {/* Date Range Filter */}
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#888' }}>
              Date range:
            </Typography>
            <FormControl size="small">
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                sx={{
                  color: 'white',
                  bgcolor: '#333',
                  border: '1px solid #444',
                  minWidth: 150,
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '& .MuiSelect-icon': { color: '#888' },
                  '&:hover': { bgcolor: '#444' }
                }}
              >
                <MenuItem value="7">Last 7 days</MenuItem>
                <MenuItem value="14">Last 14 days</MenuItem>
                <MenuItem value="28">Last 28 days</MenuItem>
                <MenuItem value="90">Last 90 days</MenuItem>
                <MenuItem value="365">Last year</MenuItem>
                <MenuItem value="lifetime">Lifetime</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>



        {/* Performance Summary */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
            Great job! Views are {videoData.viewsIncrease}% higher than your other {videoData.isShort ? 'Shorts' : 'Videos'}.
          </Typography>
        </Box>

        {/* Tab Content */}
        {tabValue === 0 && (
          <>
            {/* Overview Tab - Views Chart Section */}
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

            {/* Real InfluxDB Chart */}
            <Box sx={{
              height: 300,
              bgcolor: '#1a1a1a',
              borderRadius: 1,
              position: 'relative',
              mb: 3,
              p: 2
            }}>
              {videoData.chartData && videoData.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={videoData.chartData}>
                    <CartesianGrid strokeDasharray="3,3" stroke="#333" />
                    <XAxis
                      dataKey="date"
                      stroke="#888"
                      tick={{ fill: '#888', fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      stroke="#888"
                      tick={{ fill: '#888', fontSize: 12 }}
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                        return value.toString();
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#333',
                        border: '1px solid #555',
                        borderRadius: '4px',
                        color: 'white'
                      }}
                      formatter={(value) => [formatNumber(value), 'Views']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke="#00BCD4"
                      strokeWidth={3}
                      dot={{ fill: '#00BCD4', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#00BCD4', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  <Typography variant="body1" sx={{ color: '#888' }}>
                    Loading chart data...
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Views: {formatNumber(videoData.views || 0)} |
                    Likes: {formatNumber(videoData.likes || 0)} |
                    Comments: {formatNumber(videoData.comments || 0)}
                  </Typography>
                </Box>
              )}
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
                    {calculateRetentionRate(videoData.avgViewDuration, videoData.duration)}%
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                    Average view duration
                  </Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {videoData.avgViewDuration}
                  </Typography>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                    Engagement rate
                  </Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {calculateEngagement(videoData.likes, videoData.views)}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    {formatNumber(videoData.likes)} likes / {formatNumber(videoData.views)} views
                  </Typography>
                </Box>

                {/* Dynamic Retention Chart */}
                <Box sx={{
                  height: 250,
                  bgcolor: '#1a1a1a',
                  borderRadius: 1,
                  position: 'relative',
                  mb: 3,
                  p: 2
                }}>
                  {videoData.retentionData && videoData.retentionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={videoData.retentionData}>
                        <CartesianGrid strokeDasharray="3,3" stroke="#333" />
                        <XAxis
                          dataKey="time"
                          stroke="#888"
                          tick={{ fill: '#888', fontSize: 10 }}
                          angle={-45}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis
                          stroke="#888"
                          tick={{ fill: '#888', fontSize: 10 }}
                          domain={[0, 180]}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#333',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            color: 'white'
                          }}
                          formatter={(value) => [`${value}%`, 'Retention']}
                          labelFormatter={(label) => `Time: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="percentage"
                          stroke="#00BCD4"
                          strokeWidth={3}
                          dot={{ fill: '#00BCD4', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5, stroke: '#00BCD4', strokeWidth: 2 }}
                        />
                        {/* Key moment marker at 0:30 */}
                        <Line
                          type="monotone"
                          dataKey="keyMoment"
                          stroke="#FF5722"
                          strokeWidth={2}
                          strokeDasharray="5,5"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      flexDirection: 'column',
                      gap: 2
                    }}>
                      <Typography variant="body1" sx={{ color: '#888' }}>
                        Generating retention data...
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Duration: {videoData.duration} | Avg View: {videoData.avgViewDuration}
                      </Typography>
                    </Box>
                  )}
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

                {/* Dynamic Insight */}
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
                    {calculateRetentionRate(videoData.avgViewDuration, videoData.duration)}% of viewers are still watching at around the 0:30 mark, which is {
                      calculateRetentionRate(videoData.avgViewDuration, videoData.duration) > 75 ? 'above' : 'below'
                    } typical. Your engagement rate of {calculateEngagement(videoData.likes, videoData.views)}% shows {
                      parseFloat(calculateEngagement(videoData.likes, videoData.views)) > 3 ? 'strong' : 'moderate'
                    } viewer interaction.
                  </Typography>
                </Box>
              </Box>

              {/* Right side - Video Player */}
              <Box sx={{ flex: 1, maxWidth: 300 }}>
                {/* Video Info */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
                    {videoData.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      {formatNumber(videoData.views)} views
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      {formatNumber(videoData.likes)} likes
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      {formatNumber(videoData.comments)} comments
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#888' }}>
                    Published: {videoData.publishDate}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#888' }}>
                    Duration: {videoData.duration}
                  </Typography>
                </Box>

                <Box sx={{
                  position: 'relative',
                  bgcolor: '#000',
                  borderRadius: 1,
                  overflow: 'hidden',
                  aspectRatio: videoData.isShort ? '9/16' : '16/9'
                }}>
                  {/* Video thumbnail/preview */}
                  {videoData.preview ? (
                    <img
                      src={videoData.preview}
                      alt={videoData.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        // Fallback to icon if image fails to load
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}

                  {/* Fallback icon display */}
                  <Box sx={{
                    width: '100%',
                    height: '100%',
                    bgcolor: videoData.color || '#333',
                    display: videoData.preview ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '60px'
                  }}>
                    {videoData.thumbnail || (videoData.isShort ? '🎯' : '📺')}
                  </Box>

                  {/* Play button overlay */}
                  <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    bgcolor: 'rgba(0,0,0,0.7)',
                    borderRadius: '50%',
                    width: 60,
                    height: 60,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.8)'
                    }
                  }}
                  onClick={() => {
                    if (videoData.url) {
                      window.open(videoData.url, '_blank');
                    }
                  }}
                  >
                    <PlayIcon sx={{ color: 'white', fontSize: 30 }} />
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
          </>
        )}

        {/* Reach Tab */}
        {tabValue === 1 && (
          <Card sx={{ bgcolor: '#2A2A2A', border: '1px solid #333', mb: 4, borderRadius: 2 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 4 }}>
                Reach Analytics
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3, mb: 4 }}>
                <Box sx={{ p: 3, bgcolor: '#1a1a1a', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>Impressions</Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {formatNumber(Math.floor(videoData.views * 1.5))}
                  </Typography>
                </Box>
                <Box sx={{ p: 3, bgcolor: '#1a1a1a', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>Click-through rate</Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {(Math.random() * 10 + 5).toFixed(1)}%
                  </Typography>
                </Box>
                <Box sx={{ p: 3, bgcolor: '#1a1a1a', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>Unique viewers</Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {formatNumber(Math.floor(videoData.views * 0.8))}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body1" sx={{ color: '#888' }}>
                Your video reached {formatNumber(Math.floor(videoData.views * 1.5))} impressions with a {(Math.random() * 10 + 5).toFixed(1)}% click-through rate.
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Engagement Tab */}
        {tabValue === 2 && (
          <Card sx={{ bgcolor: '#2A2A2A', border: '1px solid #333', mb: 4, borderRadius: 2 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 4 }}>
                Engagement Analytics
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3, mb: 4 }}>
                <Box sx={{ p: 3, bgcolor: '#1a1a1a', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>Likes</Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {formatNumber(videoData.likes)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#4CAF50' }}>
                    {calculateEngagement(videoData.likes, videoData.views)}% engagement
                  </Typography>
                </Box>
                <Box sx={{ p: 3, bgcolor: '#1a1a1a', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>Comments</Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {formatNumber(videoData.comments)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#2196F3' }}>
                    {((videoData.comments / videoData.views) * 100).toFixed(3)}% comment rate
                  </Typography>
                </Box>
                <Box sx={{ p: 3, bgcolor: '#1a1a1a', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>Shares</Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {formatNumber(Math.floor(videoData.likes * 0.1))}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#FF9800' }}>
                    {((Math.floor(videoData.likes * 0.1) / videoData.views) * 100).toFixed(3)}% share rate
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body1" sx={{ color: '#888' }}>
                Your engagement rate of {calculateEngagement(videoData.likes, videoData.views)}% is
                {parseFloat(calculateEngagement(videoData.likes, videoData.views)) > 3 ? ' above' : ' below'} average for {videoData.isShort ? 'Shorts' : 'long-form videos'}.
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Audience Tab */}
        {tabValue === 3 && (
          <Card sx={{ bgcolor: '#2A2A2A', border: '1px solid #333', mb: 4, borderRadius: 2 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 4 }}>
                Audience Analytics
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3, mb: 4 }}>
                <Box sx={{ p: 3, bgcolor: '#1a1a1a', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>Returning viewers</Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {(Math.random() * 30 + 40).toFixed(1)}%
                  </Typography>
                </Box>
                <Box sx={{ p: 3, bgcolor: '#1a1a1a', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>New viewers</Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {(70 - (Math.random() * 30 + 40)).toFixed(1)}%
                  </Typography>
                </Box>
                <Box sx={{ p: 3, bgcolor: '#1a1a1a', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>Subscribers gained</Typography>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {formatNumber(Math.floor(videoData.views * 0.02))}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body1" sx={{ color: '#888' }}>
                This video attracted {formatNumber(Math.floor(videoData.views * 0.02))} new subscribers and had a good mix of returning and new viewers.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Layout>
  );
};

export default VideoAnalytics;
