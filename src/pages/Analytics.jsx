import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Refresh as RefreshIcon
} from '@mui/icons-material';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import Layout from '../components/Layout.jsx';
import { buildApiUrl, API_CONFIG } from '../config/api.js';

// Utility functions like WriterAnalytics.jsx
const formatNumber = (value) => {
  if (typeof value !== "number") return "N/A";
  return Math.round(value).toLocaleString(); // Round to the nearest integer and format with commas
};

// Utility function to format dates for display
const formatDate = (date) => {
  const parsedDate = dayjs(date);
  return parsedDate.isValid()
    ? parsedDate.format("MMM D, YYYY")
    : "Invalid Date";
};

const Analytics = () => {
  console.log('🎯 Analytics component is rendering!');

  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('last30days');
  const [tabValue, setTabValue] = useState(0);
  const [contentFilter, setContentFilter] = useState('all'); // 'all', 'content', 'shorts'

  const dateRangeOptions = [
    { value: 'last7days', label: 'Last 7 days' },
    { value: 'last30days', label: 'Last 30 days' },
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
    console.log('🔥 fetchAnalytics function called with dateRange:', dateRange);
    setLoading(true);
    setError(null);

    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      let writerId = localStorage.getItem('writerId') || '110';

      if (!token) {
        setError('Please log in to view analytics');
        setLoading(false);
        return;
      }

      console.log('📊 Fetching analytics data using BigQuery overview endpoint...');
      console.log('📊 Date range for BigQuery:', { dateRange, writerId });

      // Initialize data - will be populated from BigQuery overview endpoint
      let viewsData = [];
      let totalViews = 0;
      let chartData = [];

      console.log('📊 Will use BigQuery data from overview endpoint');

      // Fetch overview data from BigQuery (includes chart data and total views)
      // Add strong cache-busting parameters to force fresh data
      const cacheBuster = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const overviewResponse = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS.OVERVIEW)}?range=${dateRange}&_t=${cacheBuster}&_r=${randomId}&force_refresh=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      let overviewData = {};
      if (overviewResponse.ok) {
        overviewData = await overviewResponse.json();
        console.log('📊 BigQuery Overview data received:', {
          totalViews: overviewData.totalViews,
          totalSubmissions: overviewData.totalSubmissions,
          chartDataPoints: overviewData.chartData?.length || 0,
          aggregatedViewsDataPoints: overviewData.aggregatedViewsData?.length || 0
        });

        // Debug: Check for June 6th in the received data
        if (overviewData.aggregatedViewsData) {
          const june6th = overviewData.aggregatedViewsData.find(item => item.time === '2025-06-06');
          if (june6th) {
            console.log('🎯 June 6th found in API response:', june6th.views.toLocaleString(), 'views');
          } else {
            console.log('⚠️ June 6th NOT found in API response');
            console.log('📊 Available dates:', overviewData.aggregatedViewsData.slice(0, 5).map(item => item.time));
          }
        }

        // Use BigQuery aggregatedViewsData directly (this is the correct chart data)
        if (overviewData.aggregatedViewsData && overviewData.aggregatedViewsData.length > 0) {
          // Use the aggregatedViewsData directly - this is already in the correct format
          viewsData = overviewData.aggregatedViewsData;

          // Transform for chartData compatibility
          chartData = overviewData.aggregatedViewsData.map(item => ({
            date: item.time,
            views: item.views,
            formattedDate: dayjs(item.time).format('MMM D, YYYY')
          }));

          totalViews = overviewData.totalViews || viewsData.reduce((acc, item) => acc + item.views, 0);

          console.log('✅ Using BigQuery aggregatedViewsData directly:', {
            aggregatedViewsDataPoints: viewsData.length,
            chartDataPoints: chartData.length,
            totalViews: totalViews.toLocaleString(),
            sampleAggregatedData: viewsData[0],
            sampleChartData: chartData[0]
          });

          // Debug: Check June 6th in processed data
          const june6th = viewsData.find(item => item.time === '2025-06-06');
          if (june6th) {
            console.log('🎯 June 6th in processed viewsData:', june6th.views.toLocaleString(), 'views');
          } else {
            console.log('⚠️ June 6th missing from processed viewsData');
          }
        } else {
          console.log('⚠️ No aggregatedViewsData in overview response');
        }
      }

      // Fetch top content and latest content using writer-specific endpoints
      console.log('📊 Fetching top content and latest content using writer-specific endpoints');
      const topVideosData = await fetchTopContent();
      console.log('📊 fetchTopContent returned:', topVideosData);
      const latestContentData = await fetchLatestContent();
      console.log('📊 fetchLatestContent returned:', latestContentData);

      console.log('📊 Top content received:', topVideosData?.length || 0, 'videos');
      console.log('📊 Latest content received:', latestContentData?.title || 'None');

      // Combine all data - Use BigQuery data for views and chart
      const combinedData = {
        ...overviewData,
        // Use BigQuery data for views and chart
        totalViews: totalViews,
        chartData: chartData,
        aggregatedViewsData: viewsData, // This is what the chart component expects
        topVideos: topVideosData || [], // Ensure it's always an array
        latestContent: latestContentData,
        // Calculate additional metrics from BigQuery data
        avgDailyViews: chartData.length > 0 ? Math.round(totalViews / chartData.length) : 0,
        summary: {
          progressToTarget: (totalViews / 100000000) * 100, // Progress to 100M views
          highestDay: chartData.length > 0 ? Math.max(...chartData.map(d => d.views)) : 0,
          lowestDay: chartData.length > 0 ? Math.min(...chartData.map(d => d.views)) : 0
        },
        metadata: {
          source: 'NEW BigQuery Table (youtube_video_report_historical) + PostgreSQL',
          dataSource: 'BigQuery: youtube_video_report_historical (daily views) + InfluxDB fallback',
          lastUpdated: new Date().toISOString(),
          dateRange: dateRange,
          bigQueryIntegrated: true,
          postgresqlIntegrated: true,
          newTableImplemented: true,
          tableUsed: 'youtube_video_report_historical'
        }
      };

      console.log('📊 Final analytics data:', {
        totalViews: combinedData.totalViews,
        chartDataPoints: combinedData.chartData?.length || 0,
        aggregatedViewsDataPoints: combinedData.aggregatedViewsData?.length || 0,
        topVideosCount: combinedData.topVideos?.length || 0,
        hasLatestContent: !!combinedData.latestContent,
        progressToTarget: combinedData.summary?.progressToTarget,
        dataSource: 'BigQuery + PostgreSQL',
        sampleAggregatedData: combinedData.aggregatedViewsData?.[0]
      });

      setAnalyticsData(combinedData);

      // Log successful data update for debugging
      console.log('🎉 FRONTEND: Analytics data updated successfully!');
      console.log('📊 FRONTEND: Chart should now display new BigQuery data');
      if (combinedData.aggregatedViewsData) {
        const june6th = combinedData.aggregatedViewsData.find(item => item.time === '2025-06-06');
        if (june6th) {
          console.log(`🎯 FRONTEND: June 6th will show ${june6th.views.toLocaleString()} views in chart`);
        }
      }
    } catch (err) {
      console.error('❌ Analytics API error:', err);
      setError(`Failed to load analytics data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Writer-specific top content function with BigQuery enhancement
  const fetchTopContent = async (filterType = contentFilter) => {
    try {
      const token = localStorage.getItem('token');
      let writerId = localStorage.getItem('writerId') || '110';

      console.log('🏆 Fetching top content for writer with BigQuery enhancement');
      console.log('🔍 Debug info:', {
        writerId: writerId,
        filterType: filterType,
        dateRange: dateRange,
        hasToken: !!token
      });

      // Convert dateRange to range parameter
      let range = '30';
      switch (dateRange) {
        case 'last7days':
          range = '7';
          break;
        case 'last30days':
          range = '30';
          break;
        case 'last90days':
          range = '90';
          break;
        case 'last365days':
          range = '365';
          break;
        case 'lifetime':
          range = 'lifetime';
          break;
        default:
          range = '28';
      }

      // Use writer-specific top content endpoint
      const url = `${buildApiUrl('/api/analytics/writer/top-content')}?writer_id=${writerId}&range=${range}&limit=10&type=${filterType}`;
      console.log('🔗 Top content URL (using writer-specific endpoint):', url);
      console.log('🔍 Debug - writerId:', writerId, 'range:', range, 'filterType:', filterType);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Top content response status:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('📊 Top content API response:', result);

        let topContent = result.data || result || [];
        console.log('🏆 Top content found:', topContent.length, 'videos');

        if (topContent.length > 0) {
          console.log('📊 Sample top content:', topContent[0]);
          console.log('📊 All top content views:', topContent.map(v => ({
            title: v.title,
            views: v.views,
            account_name: v.account_name || v.channelTitle,
            writer_name: v.writer_name
          })));

          return topContent;
        }

        return [];
      } else {
        const errorText = await response.text();
        console.error('❌ Top content API error:', response.status, errorText);
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching top content:', error);
      return [];
    }
  };

  const fetchLatestContent = async () => {
    try {
      const token = localStorage.getItem('token');
      let writerId = localStorage.getItem('writerId') || '110';

      console.log('📅 Fetching latest content for writer with BigQuery enhancement');

      // Use writer-specific latest content endpoint
      const url = `${buildApiUrl('/api/analytics/writer/latest-content')}?writer_id=${writerId}`;
      console.log('🔗 Latest content URL (using writer-specific endpoint):', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Latest content response status:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('📊 Latest content API response:', result);

        const latestContent = result.data || null;
        console.log('📅 Latest content found:', latestContent?.title || 'None');

        if (latestContent) {
          console.log('📊 Latest content data:', {
            title: latestContent.title,
            account_name: latestContent.account_name || latestContent.channelTitle,
            writer_name: latestContent.writer_name,
            views: latestContent.views
          });
        }

        return latestContent;
      } else {
        const errorText = await response.text();
        console.error('❌ Latest content API error:', response.status, errorText);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching latest content:', error);
      return null;
    }
  };



  useEffect(() => {
    console.log('🚀 Analytics useEffect triggered, dateRange:', dateRange);
    fetchAnalytics();
  }, [dateRange]);

  const formatNumber = (num) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
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

  const handleContentFilterChange = async (newFilter) => {
    setContentFilter(newFilter);
    console.log('📊 Content filter changed to:', newFilter);

    // Fetch new top content with the filter
    if (analyticsData) {
      const newTopContent = await fetchTopContent(newFilter);
      setAnalyticsData(prev => ({
        ...prev,
        topVideos: newTopContent
      }));
    }
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

            <Tooltip title="Force Refresh (NEW SIMPLIFIED Analytics)">
              <IconButton
                onClick={() => {
                  console.log('🔄 FRONTEND: FORCE REFRESH - Clearing all caches and fetching new data...');
                  console.log('🔄 FRONTEND: Using NEW SIMPLIFIED Analytics with duplicate date summing');
                  // Clear any cached data
                  setAnalyticsData(null);
                  setError(null);
                  // Force refresh with new data
                  fetchAnalytics();
                }}
                sx={{
                  color: 'white',
                  bgcolor: '#FF6B00',
                  border: '1px solid #FF6B00',
                  '&:hover': { bgcolor: '#E55A00' }
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
            {/* Tab Content */}
            {tabValue === 0 && (
              <>
                {/* Main Stats */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h3" sx={{
                color: 'white',
                fontWeight: 700,
                mb: 1,
                textAlign: 'center'
              }}>
                You got {formatNumber(analyticsData.totalViews || 0)} views in the {getDateRangeLabel()}
              </Typography>

              {/* Progress to Target */}
              {analyticsData.summary?.progressToTarget !== undefined && (
                <Box sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Progress to 100M views
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#E6B800' }}>
                      {analyticsData.summary.progressToTarget.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(analyticsData.summary.progressToTarget, 100)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: '#333',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#E6B800',
                        borderRadius: 4
                      }
                    }}
                  />
                </Box>
              )}

              {/* Data Source Debug Panel */}
              {analyticsData.metadata && (
                <Box sx={{
                  bgcolor: '#2A2A2A',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  p: 2,
                  mb: 3,
                  mx: 'auto',
                  maxWidth: 800
                }}>
                  <Typography variant="body2" sx={{ color: '#E6B800', fontWeight: 600, mb: 1 }}>
                    📊 Data Source Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, fontSize: '12px' }}>
                    <Box sx={{ color: '#4CAF50' }}>
                      ✅ Table: {analyticsData.metadata.tableUsed || 'youtube_video_report_historical'}
                    </Box>
                    <Box sx={{ color: '#2196F3' }}>
                      📅 Range: {analyticsData.metadata.dateRange}
                    </Box>
                    <Box sx={{ color: '#9C27B0' }}>
                      📊 Points: {analyticsData.aggregatedViewsData?.length || 0}
                    </Box>
                    {(() => {
                      const june6th = analyticsData.aggregatedViewsData?.find(item => item.time === '2025-06-06');
                      return june6th ? (
                        <Box sx={{ color: '#4CAF50' }}>
                          🎯 June 6th: {june6th.views.toLocaleString()} views
                        </Box>
                      ) : (
                        <Box sx={{ color: '#ff9800' }}>
                          ⚠️ June 6th: Not in range
                        </Box>
                      );
                    })()}
                    <Box sx={{ color: '#888' }}>
                      🕒 Updated: {new Date(analyticsData.metadata.lastUpdated).toLocaleTimeString()}
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Additional Stats Row */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 4,
                mb: 3,
                flexWrap: 'wrap'
              }}>
                {analyticsData.totalLikes !== undefined && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ color: '#E91E63', fontWeight: 600 }}>
                      {formatNumber(analyticsData.totalLikes)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Total Likes
                    </Typography>
                  </Box>
                )}
                {analyticsData.totalComments !== undefined && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ color: '#9C27B0', fontWeight: 600 }}>
                      {formatNumber(analyticsData.totalComments)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Total Comments
                    </Typography>
                  </Box>
                )}
                {(analyticsData.totalSubmissions !== undefined || analyticsData.topVideos?.length) && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ color: '#E6B800', fontWeight: 600 }}>
                      {analyticsData.totalSubmissions || analyticsData.topVideos?.length || 50}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Total Submissions
                    </Typography>
                  </Box>
                )}
                {(analyticsData.acceptedSubmissions !== undefined || analyticsData.topVideos?.length) && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                      {analyticsData.acceptedSubmissions || analyticsData.topVideos?.length || 50}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Published Videos
                    </Typography>
                  </Box>
                )}
                {(analyticsData.acceptanceRate !== undefined || analyticsData.topVideos?.length) && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ color: '#2196F3', fontWeight: 600 }}>
                      {analyticsData.acceptanceRate ||
                        (analyticsData.topVideos?.length && analyticsData.totalSubmissions ?
                          Math.round((analyticsData.topVideos.length / analyticsData.totalSubmissions) * 100) :
                          100)}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Success Rate
                    </Typography>
                  </Box>
                )}
                {analyticsData.avgDailyViews !== undefined && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ color: '#FF9800', fontWeight: 600 }}>
                      {formatNumber(analyticsData.avgDailyViews)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Daily Average
                    </Typography>
                  </Box>
                )}
              </Box>


            </Box>

            {/* Data Source Indicator */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
              mt: 4,
              px: 1
            }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                Daily Views Chart
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{
                  bgcolor: '#4CAF50',
                  color: 'white',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  <Box sx={{
                    width: 6,
                    height: 6,
                    bgcolor: 'white',
                    borderRadius: '50%'
                  }} />
                  NEW BigQuery Table
                </Box>
                <Typography variant="caption" sx={{ color: '#888', fontSize: '10px' }}>
                  youtube_video_report_historical
                </Typography>
              </Box>
            </Box>

            {/* Chart */}
            <Box sx={{ width: '100%', height: '400px' }}>
              <ReactECharts
                option={{
                  tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(50, 50, 50, 0.9)',
                    borderColor: '#4fc3f7',
                    borderWidth: 1,
                    textStyle: { color: '#fff' },
                    formatter: (params) => {
                      const date = params[0]?.axisValue || 'N/A';
                      const value = params[0]?.value || 0;
                      const formattedValue = formatNumber(value);
                      return `
                        <div style="min-width: 150px;">
                          <div style="font-size: 12px; color: #ccc;">${date}</div>
                          <div style="font-size: 18px; font-weight: 600; color: #fff;">${formattedValue} views</div>
                        </div>
                      `;
                    },
                    extraCssText: 'box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);',
                  },
                  grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true,
                    backgroundColor: 'transparent'
                  },
                  xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: analyticsData.aggregatedViewsData?.map(item => formatDate(item.time)) || [],
                    axisLabel: {
                      formatter: (value, index) => index % 2 === 0 ? value : '',
                      color: '#9e9e9e'
                    },
                    axisLine: {
                      lineStyle: { color: '#424242' }
                    }
                  },
                  yAxis: {
                    type: 'value',
                    axisLabel: {
                      formatter: formatNumber,
                      color: '#9e9e9e'
                    },
                    axisLine: {
                      lineStyle: { color: '#424242' }
                    },
                    splitLine: {
                      lineStyle: { color: '#424242', type: 'dashed' }
                    }
                  },
                  series: [{
                    data: analyticsData.aggregatedViewsData?.map(item => item.views) || [],
                    type: 'line',
                    smooth: true,
                    lineStyle: {
                      color: '#4fc3f7',
                      width: 3
                    },
                    areaStyle: {
                      color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                          { offset: 0, color: 'rgba(79, 195, 247, 0.3)' },
                          { offset: 1, color: 'rgba(79, 195, 247, 0.05)' },
                        ],
                      },
                    },
                    symbol: 'circle',
                    symbolSize: 6,
                    itemStyle: {
                      color: '#4fc3f7'
                    }
                  }]
                }}
                style={{ height: '100%', width: '100%' }}
              />
            </Box>

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
                      variant={contentFilter === 'all' ? 'contained' : 'outlined'}
                      onClick={() => handleContentFilterChange('all')}
                      sx={{
                        bgcolor: contentFilter === 'all' ? '#E6B800' : 'transparent',
                        color: contentFilter === 'all' ? 'black' : '#888',
                        borderColor: contentFilter === 'all' ? '#E6B800' : '#444',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: contentFilter === 'all' ? '#D4A600' : 'rgba(255,255,255,0.05)',
                          borderColor: '#666'
                        }
                      }}
                    >
                      All Content
                    </Button>
                    <Button
                      variant={contentFilter === 'content' ? 'contained' : 'outlined'}
                      onClick={() => handleContentFilterChange('content')}
                      sx={{
                        bgcolor: contentFilter === 'content' ? '#E6B800' : 'transparent',
                        color: contentFilter === 'content' ? 'black' : '#888',
                        borderColor: contentFilter === 'content' ? '#E6B800' : '#444',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: contentFilter === 'content' ? '#D4A600' : 'rgba(255,255,255,0.05)',
                          borderColor: '#666'
                        }
                      }}
                    >
                      Videos
                    </Button>
                    <Button
                      variant={contentFilter === 'shorts' ? 'contained' : 'outlined'}
                      onClick={() => handleContentFilterChange('shorts')}
                      sx={{
                        bgcolor: contentFilter === 'shorts' ? '#E6B800' : 'transparent',
                        color: contentFilter === 'shorts' ? 'black' : '#888',
                        borderColor: contentFilter === 'shorts' ? '#E6B800' : '#444',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: contentFilter === 'shorts' ? '#D4A600' : 'rgba(255,255,255,0.05)',
                          borderColor: '#666'
                        }
                      }}
                    >
                      Shorts
                    </Button>
                  </Box>

                  {/* Content List */}
                  <Box>
                    {!analyticsData || !analyticsData.topVideos || analyticsData.topVideos.length === 0 ? (
                      <Box sx={{
                        textAlign: 'center',
                        py: 4,
                        bgcolor: '#2A2A2A',
                        borderRadius: '8px',
                        border: '1px solid #333'
                      }}>
                        <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                          {loading ? 'Loading top content...' : 'No content available for this period'}
                        </Typography>
                        {!loading && (
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            Try adjusting the date range or check your content in the Content tab
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      (analyticsData.topVideos || []).map((content, index) => (
                        <Box
                          key={content.id || index}
                          onClick={() => navigate(`/content/video/${content.id}`)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            p: 1.5,
                            mb: 0.5,
                            bgcolor: '#2A2A2A',
                            borderRadius: '6px',
                            border: '1px solid #333',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            width: '100%',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            '&:hover': {
                              bgcolor: '#333',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                            }
                          }}
                        >
                          {/* Compact Rank */}
                          <Typography variant="body2" sx={{
                            color: index < 3 ? '#E6B800' : '#888',
                            minWidth: 16,
                            fontWeight: index < 3 ? 600 : 400,
                            fontSize: '12px'
                          }}>
                            {index + 1}
                          </Typography>

                          {/* Extra Compact Thumbnail */}
                          <Box sx={{ position: 'relative' }}>
                            <Box
                              component="img"
                              src={content.highThumbnail || content.mediumThumbnail || content.thumbnail || content.preview || `https://img.youtube.com/vi/${content.url?.split('v=')[1] || content.url?.split('/').pop()}/maxresdefault.jpg`}
                              sx={{
                                width: 50,
                                height: 32,
                                borderRadius: '3px',
                                objectFit: 'cover',
                                border: '1px solid #333',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  border: '1px solid #E6B800',
                                  transform: 'scale(1.02)'
                                }
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <Box
                              sx={{
                                width: 50,
                                height: 32,
                                bgcolor: content.type === 'short' ? '#4CAF50' : '#2196F3',
                                borderRadius: '3px',
                                border: '1px solid #333',
                                display: 'none',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px'
                              }}
                            >
                              {content.type === 'short' ? '🎯' : '📺'}
                            </Box>

                            {/* Duration overlay */}
                            {content.duration && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  bottom: 1,
                                  right: 1,
                                  bgcolor: 'rgba(0,0,0,0.8)',
                                  color: 'white',
                                  px: 0.3,
                                  borderRadius: '2px',
                                  fontSize: '8px',
                                  fontWeight: 500
                                }}
                              >
                                {content.duration}
                              </Box>
                            )}
                          </Box>

                          {/* Extra Compact Content Info - Fixed Width */}
                          <Box sx={{
                            width: '280px',
                            minWidth: '280px',
                            maxWidth: '280px',
                            mr: 1,
                            overflow: 'hidden'
                          }}>
                            <Typography variant="body2" sx={{
                              color: 'white',
                              fontWeight: 500,
                              mb: 0.3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '12px',
                              lineHeight: 1.2,
                              width: '100%'
                            }}>
                              {content.title || 'Untitled Video'}
                            </Typography>
                            <Typography variant="caption" sx={{
                              color: '#888',
                              fontSize: '10px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              width: '100%',
                              display: 'block'
                            }}>
                              {content.type && (
                                <Box component="span" sx={{ mr: 0.5 }}>
                                  {content.type === 'short' ? '📱' : '🎬'} •
                                </Box>
                              )}
                              {content.account_name || content.channelTitle || content.writer_name || 'Not Available'} • {content.posted_date ? new Date(content.posted_date).toLocaleDateString() : 'Unknown'}
                            </Typography>
                          </Box>

                          {/* Extra Compact Views */}
                          <Box sx={{ textAlign: 'right', minWidth: 45 }}>
                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, fontSize: '11px' }}>
                              {formatNumber(content.views)}
                            </Typography>
                          </Box>

                          {/* Extra Compact Engagement */}
                          <Box sx={{ textAlign: 'right', minWidth: 60 }}>
                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, mb: 0.3, fontSize: '11px' }}>
                              {content.likes && content.views ?
                                ((content.likes / content.views) * 100).toFixed(1) + '%' :
                                'N/A'
                              }
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#888', fontSize: '9px' }}>
                              {content.likes?.toLocaleString() || '0'} likes
                            </Typography>
                          </Box>
                        </Box>
                      ))
                    )}
                  </Box>

                  {/* See More Button */}
                  <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={() => window.location.href = '/content'}
                      sx={{
                        color: 'white',
                        borderColor: '#444',
                        textTransform: 'none',
                        '&:hover': { borderColor: '#666', bgcolor: 'rgba(255,255,255,0.05)' }
                      }}
                    >
                      See more in Content
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
                  {/* Performance Summary Section */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                      Performance Summary
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: '#2A2A2A',
                        borderRadius: '8px',
                        border: '1px solid #333',
                        p: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          Average Daily Views
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#E6B800', fontWeight: 600 }}>
                          {formatNumber(analyticsData.avgDailyViews || 0)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          Best Day
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                          {formatNumber(analyticsData.summary?.highestDay || 0)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          Total Likes
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#E91E63', fontWeight: 600 }}>
                          {formatNumber(analyticsData.totalLikes || 0)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          Total Comments
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#9C27B0', fontWeight: 600 }}>
                          {formatNumber(analyticsData.totalComments || 0)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          Total Videos
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#2196F3', fontWeight: 600 }}>
                          {analyticsData.topVideos?.length || analyticsData.totalSubmissions || 0}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          Progress to Target
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#E6B800', fontWeight: 600 }}>
                          {analyticsData.summary?.progressToTarget?.toFixed(1) || 0}%
                        </Typography>
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
                      {analyticsData.latestContent ? (
                        <>
                          {/* Enhanced Video Thumbnail with Preview */}
                          <Box sx={{ position: 'relative', mb: 3 }}>
                            <Box
                              component="img"
                              src={analyticsData.latestContent.highThumbnail || analyticsData.latestContent.mediumThumbnail || analyticsData.latestContent.thumbnail || analyticsData.latestContent.preview || `https://img.youtube.com/vi/${analyticsData.latestContent.url?.split('v=')[1] || analyticsData.latestContent.url?.split('/').pop()}/maxresdefault.jpg`}
                              sx={{
                                width: '100%',
                                height: 140,
                                borderRadius: '8px',
                                objectFit: 'cover',
                                border: '2px solid #333',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                '&:hover': {
                                  border: '2px solid #E6B800',
                                  transform: 'scale(1.02)'
                                }
                              }}
                              onClick={() => analyticsData.latestContent.url && window.open(analyticsData.latestContent.url, '_blank')}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <Box
                              sx={{
                                width: '100%',
                                height: 140,
                                bgcolor: analyticsData.latestContent.type === 'short' ? '#4CAF50' : '#2196F3',
                                borderRadius: '8px',
                                border: '2px solid #333',
                                display: 'none',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '50px',
                                cursor: 'pointer'
                              }}
                              onClick={() => analyticsData.latestContent.url && window.open(analyticsData.latestContent.url, '_blank')}
                            >
                              {analyticsData.latestContent.type === 'short' ? '🎯' : '📺'}
                            </Box>

                            {/* Play Button Overlay */}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: 50,
                                height: 50,
                                bgcolor: 'rgba(0,0,0,0.8)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  bgcolor: 'rgba(228,184,0,0.9)',
                                  transform: 'translate(-50%, -50%) scale(1.1)'
                                }
                              }}
                              onClick={() => analyticsData.latestContent.url && window.open(analyticsData.latestContent.url, '_blank')}
                            >
                              <Typography sx={{ color: 'white', fontSize: '20px' }}>▶</Typography>
                            </Box>

                            {/* Duration Badge */}
                            {analyticsData.latestContent.duration && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  bottom: 8,
                                  right: 8,
                                  bgcolor: 'rgba(0,0,0,0.9)',
                                  color: 'white',
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 600
                                }}
                              >
                                {analyticsData.latestContent.duration}
                              </Box>
                            )}

                            {/* Video Type Badge */}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                bgcolor: analyticsData.latestContent.type === 'short' ? '#4CAF50' : '#2196F3',
                                color: 'white',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: 600,
                                textTransform: 'uppercase'
                              }}
                            >
                              {analyticsData.latestContent.type === 'short' ? 'SHORT' : 'VIDEO'}
                            </Box>
                          </Box>

                          {/* Video Title */}
                          <Typography variant="body2" sx={{
                            color: 'white',
                            fontWeight: 600,
                            mb: 2,
                            fontSize: '15px',
                            lineHeight: 1.4
                          }}>
                            {analyticsData.latestContent.title || 'Untitled Video'}
                          </Typography>

                          {/* Video Stats - matching Content tab format */}
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="caption" sx={{ color: '#888' }}>Account</Typography>
                              <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                                {analyticsData.latestContent.account_name || analyticsData.latestContent.channelTitle || analyticsData.latestContent.writer_name || 'Not Available'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="caption" sx={{ color: '#888' }}>Views</Typography>
                              <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                                {formatNumber(analyticsData.latestContent.views || 0)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="caption" sx={{ color: '#888' }}>Engagement</Typography>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, display: 'block' }}>
                                  {analyticsData.latestContent.likes && analyticsData.latestContent.views ?
                                    ((analyticsData.latestContent.likes / analyticsData.latestContent.views) * 100).toFixed(1) + '%' :
                                    'N/A'
                                  }
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#888' }}>
                                  {analyticsData.latestContent.likes?.toLocaleString() || '0'} likes
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          {/* YouTube URL */}
                          {analyticsData.latestContent.url && (
                            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#333', borderRadius: '6px' }}>
                              <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 0.5 }}>
                                YouTube URL:
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#E6B800',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                                onClick={() => window.open(analyticsData.latestContent.url, '_blank')}
                              >
                                {analyticsData.latestContent.url.length > 40 ?
                                  analyticsData.latestContent.url.substring(0, 40) + '...' :
                                  analyticsData.latestContent.url
                                }
                              </Typography>
                            </Box>
                          )}

                          {/* Publication Date */}
                          <Typography variant="caption" sx={{ color: '#888', mb: 3, display: 'block' }}>
                            {analyticsData.latestContent.posted_date ?
                              `Published ${new Date(analyticsData.latestContent.posted_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}` :
                              'Recently published'
                            }
                          </Typography>

                          {/* Action Buttons */}
                          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => navigate(`/content/video/${analyticsData.latestContent.id}`)}
                              sx={{
                                color: 'white',
                                borderColor: '#444',
                                textTransform: 'none',
                                flex: 1,
                                '&:hover': { borderColor: '#666', bgcolor: 'rgba(255,255,255,0.05)' }
                              }}
                            >
                              Analytics
                            </Button>
                            {analyticsData.latestContent.url && (
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => window.open(analyticsData.latestContent.url, '_blank')}
                                sx={{
                                  bgcolor: '#E6B800',
                                  color: 'black',
                                  textTransform: 'none',
                                  flex: 1,
                                  '&:hover': { bgcolor: '#D4A600' }
                                }}
                              >
                                Watch
                              </Button>
                            )}
                          </Box>

                          {/* Footer Info */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#888' }}>
                              Latest of {analyticsData.totalSubmissions || 0} videos
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#E6B800', fontWeight: 600 }}>
                              LATEST
                            </Typography>
                          </Box>
                        </>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <Typography variant="body2" sx={{ color: '#888', mb: 2 }}>
                            No recent content available
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            Latest videos will appear here when posted
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
              </>
            )}

            {/* Trends Tab */}
            {tabValue === 1 && (
              <Box>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 4 }}>
                  Performance Trends
                </Typography>

                {/* Trend Cards */}
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' },
                  gap: 3,
                  mb: 4
                }}>
                  {/* Views Trend */}
                  <Card sx={{ bgcolor: '#2A2A2A', border: '1px solid #333' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                        Views Trend
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#E6B800', mb: 1 }}>
                        {analyticsData.summary?.trend === 'up' ? '↗️' : '↘️'} {analyticsData.summary?.trend === 'up' ? '+' : '-'}
                        {Math.abs(((analyticsData.summary?.highestDay || 0) - (analyticsData.summary?.lowestDay || 0)) / (analyticsData.summary?.lowestDay || 1) * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#888' }}>
                        {analyticsData.summary?.trend === 'up' ? 'Trending upward' : 'Needs attention'}
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* Daily Average */}
                  <Card sx={{ bgcolor: '#2A2A2A', border: '1px solid #333' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                        Daily Average
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#4CAF50', mb: 1 }}>
                        {formatNumber(analyticsData.avgDailyViews || 0)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#888' }}>
                        Views per day
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* Best Performance */}
                  <Card sx={{ bgcolor: '#2A2A2A', border: '1px solid #333' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                        Peak Day
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#2196F3', mb: 1 }}>
                        {formatNumber(analyticsData.summary?.highestDay || 0)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#888' }}>
                        Best single day
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                {/* Monthly Submissions Chart */}
                {analyticsData.monthlySubmissions && analyticsData.monthlySubmissions.length > 0 && (
                  <Card sx={{ bgcolor: '#2A2A2A', border: '1px solid #333', mb: 4 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                        Monthly Submissions Trend
                      </Typography>
                      <Box sx={{
                        display: 'flex',
                        gap: 2,
                        overflowX: 'auto',
                        pb: 2
                      }}>
                        {analyticsData.monthlySubmissions.map((month, index) => (
                          <Box key={index} sx={{
                            minWidth: 120,
                            textAlign: 'center',
                            p: 2,
                            bgcolor: '#333',
                            borderRadius: 1
                          }}>
                            <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                              {month.month}
                            </Typography>
                            <Typography variant="h5" sx={{ color: '#E6B800', mb: 1 }}>
                              {month.submissions}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#4CAF50' }}>
                              {month.accepted} published
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Activity */}
                {analyticsData.recentActivity && analyticsData.recentActivity.length > 0 && (
                  <Card sx={{ bgcolor: '#2A2A2A', border: '1px solid #333' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                        Recent Activity
                      </Typography>
                      <Box>
                        {analyticsData.recentActivity.map((activity, index) => (
                          <Box key={index} sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            p: 2,
                            mb: 1,
                            bgcolor: '#333',
                            borderRadius: 1
                          }}>
                            <Box sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: activity.action.includes('Published') ? '#4CAF50' : '#E6B800'
                            }} />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ color: 'white' }}>
                                {activity.action}: {activity.title}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#888' }}>
                                {activity.date}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}
          </>
        )}
      </Box>
    </Layout>
  );
};

export default Analytics;
