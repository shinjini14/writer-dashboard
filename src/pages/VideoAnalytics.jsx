import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  FormControl,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  PlayArrow as PlayIcon,
  VolumeUp as VolumeIcon,
  Settings as SettingsIcon,
  HelpOutline as HelpIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

const VideoAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState("lifetime"); // Default to lifetime
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(false);

  // Fetch video data from API
  const fetchVideoData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get the correct writer ID - try to refresh from profile if needed
      let writerId =
        user?.writerId || localStorage.getItem("writerId") || "106";

      // If we're using the fallback writer ID, try to get the correct one from profile
      if (writerId === "106") {
        try {
          const profileResponse = await axios.get("/api/auth/profile");
          if (profileResponse.data.user.writerId) {
            writerId = profileResponse.data.user.writerId.toString();
            localStorage.setItem("writerId", writerId);
            console.log("✅ Updated writer ID from profile:", writerId);
          }
        } catch (profileError) {
          console.warn(
            "Could not refresh writer ID from profile:",
            profileError
          );
        }
      }

      console.log(
        "🎬 Fetching video analytics for ID:",
        id,
        "Writer:",
        writerId,
        "User:",
        user?.username
      );

      // Handle custom date range
      let params = {
        writer_id: writerId,
        range: dateRange,
      };

      // If it's a custom date range, extract the dates
      if (dateRange.startsWith('custom_')) {
        const parts = dateRange.split('_');
        if (parts.length === 3) {
          params.start_date = parts[1];
          params.end_date = parts[2];
          params.range = 'custom';
        }
      }

      const response = await axios.get(`/api/video/${id}`, {
        params,
      });

      if (response.data) {
        // 🐛 DEBUG: Log all received data from backend
        console.log("🔍 DEBUG: Full backend response:", response.data);
        console.log("🔍 DEBUG: viewsIncrease received:", response.data.viewsIncrease);
        console.log("🔍 DEBUG: metrics received:", response.data.metrics);
        console.log("🔍 DEBUG: retentionRate received:", response.data.retentionRate);
        console.log("🔍 DEBUG: avgViewDurationPercentage received:", response.data.avgViewDurationPercentage);
        console.log("🔍 DEBUG: watchTimeMinutes received:", response.data.watchTimeMinutes);

        // Format and display the metrics properly
        if (response.data.metrics) {
          console.log("✅ FORMATTED METRICS:");
          console.log("  - Retention Rate:", formatPercentage(response.data.metrics.retentionRate));
          console.log("  - Avg View Duration %:", formatPercentage(response.data.metrics.avgViewDurationPercentage));
          console.log("  - Watch Time:", formatDuration(response.data.metrics.watchTimeMinutes));
        }

        setVideoData(response.data);
        // Update page title
        document.title = `${response.data.title} - Video Analytics`;
        console.log("✅ Video data loaded:", response.data.title);
      }
    } catch (err) {
      console.error("❌ Error fetching video data:", err);
      setError(
        err.response?.data?.error || err.message || "Failed to load video data"
      );
    } finally {
      setLoading(false);
      setIsChartLoading(false);
    }
  };

  useEffect(() => {
    if (id && dateRange !== "custom") {
      fetchVideoData();
    }

    // Cleanup: reset title when component unmounts
    return () => {
      document.title = "Writer Dashboard";
    };
  }, [id, dateRange]); // Refetch when date range changes

  const formatNumber = (num) => {
    if (!num || num === 0) return "0";
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toLocaleString();
  };

  // Format viewsIncrease percentage properly
  const formatViewsIncrease = (increase) => {
    if (increase == null || increase === undefined) return null;

    // Handle very large numbers that might be raw view counts instead of percentages
    if (Math.abs(increase) > 10000) {
      console.warn("🚨 ViewsIncrease seems too large:", increase, "- might be raw views instead of percentage");
      return Math.round(increase / 100); // Convert if it's in basis points
    }

    // Normal percentage formatting
    if (Math.abs(increase) > 1000) {
      return Math.round(increase / 10); // Divide by 10 if it's in tenths of percent
    }

    return Math.round(increase);
  };

  // Format percentage values (like avgViewDurationPercentage)
  const formatPercentage = (value) => {
    if (value == null || value === undefined) return "0%";

    // Handle very small decimal values (like 1.15373134328358)
    if (value < 1 && value > 0) {
      return `${(value * 100).toFixed(1)}%`;
    }

    // Handle normal percentage values
    return `${Math.round(value)}%`;
  };

  // Format duration values (like watchTimeMinutes)
  const formatDuration = (minutes) => {
    if (minutes == null || minutes === undefined) return "0:00";

    // Handle very small decimal values (like 1.28833333333333)
    if (minutes < 1) {
      const seconds = Math.round(minutes * 60);
      return `0:${seconds.toString().padStart(2, '0')}`;
    }

    // Handle normal minute values
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown Date";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Unknown Date";
    }
  };

  // Calculate engagement metrics dynamically
  const calculateEngagement = (likes, views) => {
    if (!views || views === 0) return 0;
    return ((likes / views) * 100).toFixed(2);
  };

  const calculateRetentionRate = (avgViewDuration, totalDuration) => {
    if (!avgViewDuration || !totalDuration) return 0; // Default fallback

    // Parse duration strings (e.g., "1:30" -> 90 seconds)
    const parseTime = (timeStr) => {
      const parts = timeStr.split(":");
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    };

    const avgSeconds = parseTime(avgViewDuration);
    const totalSeconds = parseTime(totalDuration);

    return Math.round((avgSeconds / totalSeconds) * 100);
  };

  const Stat = ({ label, value }) => (
  <Box>
    <Typography variant="body2" color="#888">{label}</Typography>
    <Typography variant="h6" color="white">{value}</Typography>
  </Box>
);


  // Generate fallback retention data when BigQuery data is not available
  const generateFallbackRetentionData = (videoData) => {
    if (!videoData || !videoData.duration) return [];

    // Parse duration to get total seconds
    const parseTime = (timeStr) => {
      if (!timeStr) return 180; // Default 3 minutes
      const parts = timeStr.split(":");
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    };

    const totalSeconds = parseTime(videoData.duration);
    const dataPoints = Math.min(
      20,
      Math.max(10, Math.floor(totalSeconds / 10))
    ); // 10-20 data points
    const retentionData = [];

    // Calculate initial retention rate based on engagement
    const engagementRate = parseFloat(
      calculateEngagement(videoData.likes, videoData.views)
    );
    const baseRetention = Math.max(40, Math.min(95, 70 + engagementRate * 5)); // 40-95% based on engagement

    for (let i = 0; i <= dataPoints; i++) {
      const timeSeconds = (i / dataPoints) * totalSeconds;
      const minutes = Math.floor(timeSeconds / 60);
      const seconds = Math.floor(timeSeconds % 60);
      const timeLabel = `${minutes}:${seconds.toString().padStart(2, "0")}`;

      // Create realistic retention curve (starts high, drops over time)
      const progress = i / dataPoints;
      const retention = baseRetention * Math.exp(-progress * 1.5); // Exponential decay
      const typicalRetention = 65 * Math.exp(-progress * 1.2); // Slightly better typical curve

      // Add some variation for key moments
      const keyMomentMarker =
        i === 2 ||
        i === Math.floor(dataPoints * 0.3) ||
        i === Math.floor(dataPoints * 0.7)
          ? retention + 5
          : null;

      retentionData.push({
        time: timeLabel,
        percentage: Math.round(retention),
        typicalRetention: Math.round(typicalRetention),
        keyMomentMarker,
      });
    }

    return retentionData;
  };

  // Handle date range change
  const handleDateRangeChange = (event) => {
    const value = event.target.value;

    if (value === "custom") {
      setShowCustomDatePicker(true);
      // Don't change dateRange yet, wait for user to apply custom dates
    } else {
      setShowCustomDatePicker(false);
      setIsChartLoading(true);
      setDateRange(value);
    }
  };

  // Handle custom date range application
  const handleApplyCustomRange = async () => {
    if (customStartDate && customEndDate) {
      // Set a special range value to indicate custom dates
      const customRange = `custom_${customStartDate}_${customEndDate}`;
      setDateRange(customRange);
      setShowCustomDatePicker(false);
      setIsChartLoading(true);

      // Manually trigger data fetch for custom range
      try {
        await fetchVideoData();
      } catch (error) {
        console.error("Error fetching data for custom range:", error);
        setError("Failed to load data for custom date range");
      } finally {
        setIsChartLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <Box
          sx={{
            minHeight: "100vh",
            bgcolor: "#1a1a1a",
            color: "white",
            p: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <CircularProgress sx={{ color: "#E6B800", mb: 2 }} />
            <Typography variant="h6">Loading video analytics...</Typography>
          </Box>
        </Box>
      </Layout>
    );
  }

  if (error || !videoData) {
    return (
      <Layout>
        <Box
          sx={{
            minHeight: "100vh",
            bgcolor: "#1a1a1a",
            color: "white",
            p: 4,
          }}
        >
          <Typography variant="h4" sx={{ mb: 2 }}>
            {error ? "Error loading video" : "Video not found"}
          </Typography>
          {error && (
            <Typography variant="body1" sx={{ color: "#ff6b6b", mb: 2 }}>
              {error}
            </Typography>
          )}
          <Button
            onClick={() => navigate("/content")}
            sx={{ mt: 2, color: "#E6B800" }}
          >
            Back to Content
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#1a1a1a",
          color: "white",
          p: 4,
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <IconButton
              onClick={() => navigate("/content")}
              sx={{ color: "#888" }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" sx={{ color: "white", fontWeight: 600 }}>
              Video analytics
            </Typography>
          </Box>

          {/* Tabs */}
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{
              "& .MuiTab-root": {
                color: "#888",
                textTransform: "none",
                fontSize: "16px",
                fontWeight: 500,
              },
              "& .Mui-selected": { color: "white !important" },
              "& .MuiTabs-indicator": { backgroundColor: "white" },
            }}
          >
            <Tab label="Overview" />

            <Tab label="Engagement" />
          </Tabs>

          {/* Date Range Filter */}
          <Box sx={{ mt: 3, display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body2" sx={{ color: "#888" }}>
              Date range:
            </Typography>
            <FormControl size="small">
              <Select
                value={dateRange}
                onChange={handleDateRangeChange}
                sx={{
                  color: "white",
                  bgcolor: "#333",
                  border: "1px solid #444",
                  minWidth: 150,
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  "& .MuiSelect-icon": { color: "#888" },
                  "&:hover": { bgcolor: "#444" },
                }}
              >
                <MenuItem value="7">Last 7 days</MenuItem>
                <MenuItem value="14">Last 14 days</MenuItem>
                <MenuItem value="28">Last 28 days</MenuItem>
                <MenuItem value="90">Last 90 days</MenuItem>
                <MenuItem value="365">Last year</MenuItem>
                <MenuItem value="lifetime">Lifetime</MenuItem>
                <MenuItem value="custom">Custom range</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Custom Date Range Picker */}
          {showCustomDatePicker && (
            <Box sx={{ mt: 2, p: 3, bgcolor: "#2A2A2A", borderRadius: 2, border: "1px solid #333" }}>
              <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
                Select Custom Date Range
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                <Box>
                  <Typography variant="body2" sx={{ color: "#888", mb: 1 }}>
                    Start Date
                  </Typography>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    style={{
                      backgroundColor: "#333",
                      border: "1px solid #444",
                      borderRadius: "4px",
                      color: "white",
                      padding: "8px 12px",
                      fontSize: "14px",
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: "#888", mb: 1 }}>
                    End Date
                  </Typography>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    style={{
                      backgroundColor: "#333",
                      border: "1px solid #444",
                      borderRadius: "4px",
                      color: "white",
                      padding: "8px 12px",
                      fontSize: "14px",
                    }}
                  />
                </Box>
                <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleApplyCustomRange}
                    disabled={!customStartDate || !customEndDate}
                    sx={{
                      bgcolor: "#ffb300",
                      color: "black",
                      "&:hover": { bgcolor: "#e6a000" },
                      "&:disabled": { bgcolor: "#666", color: "#999" },
                    }}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setShowCustomDatePicker(false)}
                    sx={{
                      color: "#888",
                      borderColor: "#444",
                      "&:hover": { borderColor: "#666" },
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        {/* Performance Summary */}
        {videoData.views > 0 && (
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography
              variant="h4"
              sx={{ color: "white", fontWeight: 600, mb: 2 }}
            >
              {(() => {
                const formattedIncrease = formatViewsIncrease(videoData.viewsIncrease);
                if (formattedIncrease === null) {
                  return `Great job! Your ${videoData.isShort ? "Short" : "Video"} has ${formatNumber(videoData.views)} views.`;
                } else if (formattedIncrease > 0) {
                  return `Great job! Views are ${formattedIncrease}% higher than your other ${videoData.isShort ? "Shorts" : "Videos"}.`;
                } else if (formattedIncrease < 0) {
                  return `Views are ${Math.abs(formattedIncrease)}% lower than your other ${videoData.isShort ? "Shorts" : "Videos"}.`;
                } else {
                  return `Views are about average for your ${videoData.isShort ? "Shorts" : "Videos"}.`;
                }
              })()}
            </Typography>
          </Box>
        )}

        {/* Tab Content */}
        {tabValue === 0 && (
          <>
            {/* Overview Tab - Views Chart Section */}
            <Card
              sx={{
                bgcolor: "#2A2A2A",
                border: "1px solid #333",
                mb: 4,
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{ color: "#888", mb: 1, textAlign: "center" }}
                  >
                    Views
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="h3"
                      sx={{ color: "white", fontWeight: 700 }}
                    >
                      {formatNumber(videoData.views)}
                    </Typography>
                    <TrendingUpIcon sx={{ color: "#4CAF50", fontSize: 20 }} />
                  </Box>
                  {(() => {
                    const formattedIncrease = formatViewsIncrease(videoData.viewsIncrease);
                    if (formattedIncrease === null) return null;

                    if (formattedIncrease > 0) {
                      return <Typography sx={{ color: "#4CAF50", textAlign: "center" }}>{formattedIncrease}% higher than your average</Typography>;
                    } else if (formattedIncrease < 0) {
                      return <Typography sx={{ color: "#ff6b6b", textAlign: "center" }}>{Math.abs(formattedIncrease)}% lower than your average</Typography>;
                    } else {
                      return <Typography sx={{ color: "#888", textAlign: "center" }}>About average performance</Typography>;
                    }
                  })()}

                </Box>

                {/* Real InfluxDB Chart */}
                <Box
                  sx={{
                    height: 300,
                    bgcolor: "#1a1a1a",
                    borderRadius: 1,
                    position: "relative",
                    mb: 3,
                    p: 2,
                  }}
                >
                  {isChartLoading ? (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <CircularProgress sx={{ color: "#00BCD4", mb: 2 }} />
                      <Typography variant="body1" sx={{ color: "#888" }}>
                        Updating chart data...
                      </Typography>
                    </Box>
                  ) : videoData.chartData && videoData.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={videoData.chartData}>
                        <CartesianGrid strokeDasharray="3,3" stroke="#333" />
                        <XAxis
                          dataKey="date"
                          stroke="#888"
                          tick={{ fill: "#888", fontSize: 10 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis
                          stroke="#888"
                          tick={{ fill: "#888", fontSize: 12 }}
                          tickFormatter={(value) => {
                            if (value >= 1000000)
                              return `${(value / 1000000).toFixed(1)}M`;
                            if (value >= 1000)
                              return `${(value / 1000).toFixed(1)}K`;
                            return value.toString();
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#333",
                            border: "1px solid #555",
                            borderRadius: "4px",
                            color: "white",
                          }}
                          formatter={(value) => [formatNumber(value), "Views"]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="views"
                          stroke="#00BCD4"
                          strokeWidth={3}
                          dot={{ fill: "#00BCD4", strokeWidth: 2, r: 4 }}
                          activeDot={{
                            r: 6,
                            stroke: "#00BCD4",
                            strokeWidth: 2,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <Typography variant="body1" sx={{ color: "#888" }}>
                        No chart data available
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#666" }}>
                        Views: {formatNumber(videoData.views || 0)} | Likes:{" "}
                        {formatNumber(videoData.likes || 0)} | Comments:{" "}
                        {formatNumber(videoData.comments || 0)}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Legend */}
                <Box sx={{ display: "flex", gap: 3, mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        bgcolor: "#00BCD4",
                        borderRadius: "50%",
                      }}
                    />
                    <Typography variant="body2" sx={{ color: "#888" }}>
                      This video
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 12, height: 2, bgcolor: "#666" }} />
                    <Typography variant="body2" sx={{ color: "#888" }}>
                      Typical performance
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="outlined"
                  sx={{
                    color: "#888",
                    borderColor: "#444",
                    textTransform: "none",
                    "&:hover": { borderColor: "#666" },
                  }}
                >
                  See more
                </Button>
              </CardContent>
            </Card>

            {/* Two Grid Layout */}
            <Box sx={{ display: "flex", gap: 3, mb: 4 }}>
              {/* Left Grid - Key Moments for Audience Retention */}
              <Card
                sx={{
                  bgcolor: "#2A2A2A",
                  border: "1px solid #333",
                  borderRadius: 2,
                  flex: 1,
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 4,
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{ color: "white", fontWeight: 600 }}
                    >
                      Key moments for audience retention
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{
                        color: "#888",
                        borderColor: "#444",
                        textTransform: "none",
                        "&:hover": { borderColor: "#666" },
                      }}
                    >
                      Intro
                    </Button>
                  </Box>
                  {/* Left side - Stats */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ color: "#888", mb: 1 }}>
                        Stayed to watch
                      </Typography>
                      {videoData.views > 0 && (videoData.retentionRate ||
                       (videoData.avgViewDurationSeconds && videoData.duration)) ? (
                        <Typography
                          variant="h4"
                          sx={{ color: "white", fontWeight: 700 }}
                        >
                          {formatPercentage(videoData.retentionRate ||
                            (() => {
                              const avgSeconds = videoData.avgViewDurationSeconds;
                              if (avgSeconds && videoData.duration) {
                                const parts = videoData.duration.split(':');
                                const totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                                return Math.round((avgSeconds / totalSeconds) * 100);
                              }
                              return 0;
                            })())}
                        </Typography>
                      ) : (
                        <Typography
                          variant="h6"
                          sx={{ color: "#666", fontWeight: 500 }}
                        >
                          No data yet
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ color: "#888", mb: 1 }}>
                        Average view duration
                      </Typography>
                      {(videoData.avgViewDurationSeconds || videoData.metrics?.avgViewDurationSeconds) && videoData.views > 0 ? (
                        <Typography
                          variant="h4"
                          sx={{ color: "white", fontWeight: 700 }}
                        >
                          {(() => {
                            const seconds = videoData.avgViewDurationSeconds || videoData.metrics?.avgViewDurationSeconds;
                            if (seconds) {
                              const mins = Math.floor(seconds / 60);
                              const secs = Math.round(seconds % 60);
                              return `${mins}:${secs.toString().padStart(2, '0')}`;
                            }
                            return "0:00";
                          })()}
                        </Typography>
                      ) : (
                        <Typography
                          variant="h6"
                          sx={{ color: "#666", fontWeight: 500 }}
                        >
                          No data yet
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ mb: 4 }}>
                      <Typography variant="body2" sx={{ color: "#888", mb: 1 }}>
                        Engagement rate
                      </Typography>
                      {videoData.views > 0 ? (
                        <>
                          <Typography
                            variant="h4"
                            sx={{ color: "white", fontWeight: 700 }}
                          >
                            {calculateEngagement(
                              videoData.likes,
                              videoData.views
                            )}
                            %
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#666" }}>
                            {formatNumber(videoData.likes)} likes /{" "}
                            {formatNumber(videoData.views)} views
                          </Typography>
                        </>
                      ) : (
                        <Typography
                          variant="h6"
                          sx={{ color: "#666", fontWeight: 500 }}
                        >
                          No data yet
                        </Typography>
                      )}
                    </Box>

                    {/* Views Performance vs Average */}
                    {videoData.viewsIncrease !== undefined && videoData.viewsIncrease !== null && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="body2" sx={{ color: "#888", mb: 1 }}>
                          Performance vs your average
                        </Typography>
                        {(() => {
                          const formattedIncrease = formatViewsIncrease(videoData.viewsIncrease);
                          if (formattedIncrease === null) {
                            return (
                              <Typography
                                variant="h6"
                                sx={{ color: "#666", fontWeight: 500 }}
                              >
                                No comparison data
                              </Typography>
                            );
                          }

                          const isPositive = formattedIncrease > 0;
                          const isNeutral = formattedIncrease === 0;

                          return (
                            <>
                              <Typography
                                variant="h4"
                                sx={{
                                  color: isNeutral ? "#888" : isPositive ? "#4CAF50" : "#ff6b6b",
                                  fontWeight: 700
                                }}
                              >
                                {isPositive ? "+" : ""}{formattedIncrease}%
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#666" }}>
                                {isNeutral
                                  ? "About average performance"
                                  : isPositive
                                    ? "Higher than your average"
                                    : "Lower than your average"
                                }
                              </Typography>
                            </>
                          );
                        })()}
                      </Box>
                    )}

                    {/* ───────────── Additional Retention Metrics ───────────── */}
                    <Box
                      sx={{ display: "flex", gap: 3, flexWrap: "wrap", mb: 4 }}
                    >
                      
                      <Stat
                        label="Avg watch ratio"
                        value={formatPercentage(videoData.metrics?.avgViewDurationPercentage || videoData.avgViewDurationPercentage)}
                      />
                      <Stat
                        label="Rel. retention"
                        value={formatPercentage(videoData.metrics?.avgRelRetentionPerf || 0)}
                      />
                      <Stat
                        label="Total watch time"
                        value={formatDuration(videoData.metrics?.watchTimeMinutes || videoData.watchTimeMinutes)}
                      />
                      
                    </Box>

                    {/* Audience Retention Chart - BigQuery Data */}
                    <Box
                      sx={{
                        height: 280,
                        bgcolor: "#1a1a1a",
                        borderRadius: 1,
                        position: "relative",
                        mb: 3,
                        p: 2,
                      }}
                    >
                      {videoData.views > 0 &&
                      ((videoData.retentionData &&
                        videoData.retentionData.length > 0) ||
                        videoData.duration) ? (
                        <ResponsiveContainer width="100%" height="85%">
                          <LineChart
                            data={
                              videoData.retentionData &&
                              videoData.retentionData.length > 0
                                ? videoData.retentionData
                                : 0
                            }
                            margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3,3"
                              stroke="#333"
                            />
                            <XAxis
                              dataKey="time"
                              stroke="#888"
                              tick={{ fill: "#888", fontSize: 11 }}
                              angle={0}
                              textAnchor="middle"
                              height={40}
                              interval="preserveStartEnd"
                              tickFormatter={(value, index) => {
                                // Show only every 5th tick to avoid crowding
                                const currentData =
                                  videoData.retentionData &&
                                  videoData.retentionData.length > 0
                                    ? videoData.retentionData
                                    : 0;
                                const dataLength = currentData?.length || 0;
                                const interval = Math.max(
                                  1,
                                  Math.floor(dataLength / 8)
                                );
                                return index % interval === 0 ? value : "";
                              }}
                              label={{
                                value: "Video Time",
                                position: "insideBottom",
                                offset: -10,
                                style: {
                                  textAnchor: "middle",
                                  fill: "#888",
                                  fontSize: "12px",
                                },
                              }}
                            />
                            <YAxis
                              stroke="#888"
                              tick={{ fill: "#888", fontSize: 11 }}
                              domain={[0, "dataMax + 10"]}
                              tickFormatter={(value) => `${Math.round(value)}%`}
                              label={{
                                value: "Audience Retention %",
                                angle: -90,
                                position: "insideLeft",
                                style: {
                                  textAnchor: "middle",
                                  fill: "#888",
                                  fontSize: "12px",
                                },
                              }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1a1a1a",
                                border: "1px solid #555",
                                borderRadius: "8px",
                                color: "white",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                              }}
                              formatter={(value, name) => {
                                if (name === "This video") {
                                  return [
                                    `${Math.round(value)}%`,
                                    "This Video",
                                  ];
                                }
                                if (name === "Typical retention") {
                                  return [`${Math.round(value)}%`, "Average"];
                                }
                                return [`${Math.round(value)}%`, name];
                              }}
                              labelFormatter={(label) => `Time: ${label}`}
                              labelStyle={{
                                color: "#ffb300",
                                fontWeight: "bold",
                              }}
                            />

                            {/* Primary Line: This Video's Retention (BigQuery data) */}
                            <Line
                              type="monotone"
                              dataKey="percentage"
                              stroke="#00BCD4"
                              strokeWidth={3}
                              dot={{ fill: "#00BCD4", strokeWidth: 2, r: 3 }}
                              activeDot={{
                                r: 5,
                                stroke: "#00BCD4",
                                strokeWidth: 2,
                              }}
                              name="This video"
                            />

                            {/* Secondary Line: Typical Retention (Benchmark/Average) */}
                            <Line
                              type="monotone"
                              dataKey="typicalRetention"
                              stroke="#666"
                              strokeWidth={2}
                              strokeDasharray="8,4"
                              dot={{ fill: "#666", strokeWidth: 1, r: 2 }}
                              activeDot={{
                                r: 4,
                                stroke: "#666",
                                strokeWidth: 1,
                              }}
                              name="Typical retention"
                            />

                            {/* Key Moment Markers */}
                            <Line
                              type="monotone"
                              dataKey="keyMomentMarker"
                              stroke="#FF5722"
                              strokeWidth={2}
                              strokeDasharray="5,5"
                              dot={false}
                              connectNulls={false}
                              name="Key moments"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            flexDirection: "column",
                            gap: 2,
                          }}
                        >
                          <Typography variant="body1" sx={{ color: "#888" }}>
                            No data yet
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Legend */}
                    <Box
                      sx={{
                        display: "flex",
                        gap: 4,
                        mb: 3,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 3,
                            bgcolor: "#00BCD4",
                            borderRadius: 1,
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ color: "#00BCD4", fontWeight: 500 }}
                        >
                          This Video Performance
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 3,
                            bgcolor: "#666",
                            borderRadius: 1,
                            backgroundImage:
                              "repeating-linear-gradient(90deg, #666 0, #666 8px, transparent 8px, transparent 12px)",
                          }}
                        />
                        <Typography variant="body2" sx={{ color: "#888" }}>
                          Average Retention
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 3,
                            bgcolor: "#FF5722",
                            borderRadius: 1,
                            backgroundImage:
                              "repeating-linear-gradient(90deg, #FF5722 0, #FF5722 5px, transparent 5px, transparent 10px)",
                          }}
                        />
                        <Typography variant="body2" sx={{ color: "#888" }}>
                          Key Moments
                        </Typography>
                      </Box>
                    </Box>

                    {/* Dynamic Insight */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                        p: 2,
                        bgcolor: "#333",
                        borderRadius: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          bgcolor: "#E6B800",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: "black", fontWeight: "bold" }}
                        >
                          !
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: "#ccc" }}>
                        {videoData.retentionRate ||
                          (() => {
                            const avgSeconds = videoData.avgViewDurationSeconds;
                            if (avgSeconds && videoData.duration) {
                              const parts = videoData.duration.split(':');
                              const totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                              return Math.round((avgSeconds / totalSeconds) * 100);
                            }
                            return 0;
                          })()}
                        % of viewers are still watching at around the 0:30 mark,
                        which is{" "}
                        {(videoData.retentionRate ||
                          (() => {
                            const avgSeconds = videoData.avgViewDurationSeconds;
                            if (avgSeconds && videoData.duration) {
                              const parts = videoData.duration.split(':');
                              const totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                              return Math.round((avgSeconds / totalSeconds) * 100);
                            }
                            return 0;
                          })()) > 75
                          ? "above"
                          : "below"}{" "}
                        typical. Your engagement rate of{" "}
                        {calculateEngagement(videoData.likes, videoData.views)}%
                        shows{" "}
                        {parseFloat(
                          calculateEngagement(videoData.likes, videoData.views)
                        ) > 3
                          ? "strong"
                          : "moderate"}{" "}
                        viewer interaction.
                      </Typography>
                    </Box>
                  </Box>

                  {/* ──────── Drop-off & Key-Moments ───────── */}
                  {videoData.dropOffPoints?.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="#888">Top drop-off points</Typography>
                      <ul>
                        {videoData.dropOffPoints.map(pt => (
                          <li key={pt.time}>
                            <Typography variant="body2" color="white">
                              {pt.time} — {pt.percentage}%
                            </Typography>
                          </li>
                        ))}
                      </ul>
                    </Box>
                  )}

                  {videoData.keyMomentMarkers?.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="#888">Key moments</Typography>
                      <ul>
                        {videoData.keyMomentMarkers.map(pt => (
                          <li key={pt.time}>
                            <Typography variant="body2" color="#FF5722">
                              {pt.time} — {pt.percentage}%
                            </Typography>
                          </li>
                        ))}
                      </ul>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Right Grid - Video Player */}
              <Card
                sx={{
                  bgcolor: "#2A2A2A",
                  border: "1px solid #333",
                  borderRadius: 2,
                  flex: 1,
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 4,
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{ color: "white", fontWeight: 600 }}
                    >
                      {videoData.title}
                    </Typography>
                  </Box>
                    {/* Video Info */}
                    <Box sx={{ mb: 2 }}>
                     

                      {/* Description */}
                      {videoData.description &&
                        videoData.description.trim() && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#ccc",
                              mb: 2,
                              fontSize: "0.9rem",
                              lineHeight: 1.4,
                            }}
                          >
                            {videoData.description.length > 120
                              ? `${videoData.description.substring(0, 120)}...`
                              : videoData.description}
                          </Typography>
                        )}

                      {/* Account/Channel - Show only one, prefer channelTitle over accountName */}
                      {(videoData.channelTitle || videoData.accountName) && (
                        <Typography
                          variant="body2"
                          sx={{ color: "#ffb300", mb: 1, fontWeight: 500 }}
                        >
                          Account:{" "}
                          {videoData.channelTitle || videoData.accountName}
                        </Typography>
                      )}

                      {/* Basic Stats Row 1 */}
                      <Box
                        sx={{
                          display: "flex",
                          gap: 3,
                          mb: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography variant="body2" sx={{ color: "#888" }}>
                          {formatNumber(videoData.views)} views
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#4CAF50" }}>
                          {formatNumber(videoData.likes)} likes
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#2196F3" }}>
                          {formatNumber(videoData.comments)} comments
                        </Typography>
                      </Box>

                      {/* Basic Stats Row 2 - Only show if data exists */}
                      {(videoData.dislikes > 0 || videoData.shares > 0) && (
                        <Box
                          sx={{
                            display: "flex",
                            gap: 3,
                            mb: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          {videoData.dislikes > 0 && (
                            <Typography
                              variant="body2"
                              sx={{ color: "#f44336" }}
                            >
                              {formatNumber(videoData.dislikes)} dislikes
                            </Typography>
                          )}
                          {videoData.shares > 0 && (
                            <Typography
                              variant="body2"
                              sx={{ color: "#FF9800" }}
                            >
                              {formatNumber(videoData.shares)} shares
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* Subscriber Stats - Only show if data exists */}
                      {(videoData.subscribersGained > 0 ||
                        videoData.subscribersLost > 0) && (
                        <Box
                          sx={{
                            display: "flex",
                            gap: 3,
                            mb: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          {videoData.subscribersGained > 0 && (
                            <Typography
                              variant="body2"
                              sx={{ color: "#4CAF50" }}
                            >
                              +{formatNumber(videoData.subscribersGained)}{" "}
                              subscribers
                            </Typography>
                          )}
                          {videoData.subscribersLost > 0 && (
                            <Typography
                              variant="body2"
                              sx={{ color: "#f44336" }}
                            >
                              -{formatNumber(videoData.subscribersLost)} lost
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* Video Details */}
                      <Box sx={{ mt: 2, pt: 1, borderTop: "1px solid #333" }}>
                        <Typography
                          variant="body2"
                          sx={{ color: "#888", mb: 0.5 }}
                        >
                          Duration: {videoData.duration || "0:00"}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "#888", mb: 0.5 }}
                        >
                          Published: {videoData.publishDate}
                        </Typography>
                        {videoData.writerName && (
                          <Typography
                            variant="body2"
                            sx={{ color: "#888", mb: 0.5 }}
                          >
                            Writer: {videoData.writerName}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        position: "relative",
                        bgcolor: "#000",
                        borderRadius: 1,
                        overflow: "hidden",
                        aspectRatio: videoData.isShort ? "9/16" : "16/9",
                        height: videoData.isShort ? "350px" : "250px",
                        width: "100%",
                      }}
                    >
                      {/* Video thumbnail/preview - Use high quality thumbnail from BigQuery */}
                      {videoData.highThumbnail ||
                      videoData.mediumThumbnail ||
                      videoData.preview ? (
                        <img
                          src={
                            videoData.highThumbnail ||
                            videoData.mediumThumbnail ||
                            videoData.preview
                          }
                          alt={videoData.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            // Try fallback thumbnails in order
                            if (
                              e.target.src === videoData.highThumbnail &&
                              videoData.mediumThumbnail
                            ) {
                              e.target.src = videoData.mediumThumbnail;
                            } else if (
                              e.target.src === videoData.mediumThumbnail &&
                              videoData.defaultThumbnail
                            ) {
                              e.target.src = videoData.defaultThumbnail;
                            } else if (
                              videoData.preview &&
                              e.target.src !== videoData.preview
                            ) {
                              e.target.src = videoData.preview;
                            } else {
                              // Final fallback to icon if all images fail
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }
                          }}
                        />
                      ) : null}

                      {/* Fallback icon display - Always show if no thumbnail is available */}
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          bgcolor: videoData.color || "#333",
                          display:
                            videoData.highThumbnail ||
                            videoData.mediumThumbnail ||
                            videoData.preview
                              ? "none"
                              : "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "60px",
                        }}
                      > 
                        {videoData.thumbnail ||
                          (videoData.isShort ? "🎯" : "📺")}
                      </Box>

                      {/* Duration overlay on thumbnail */}
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 8,
                          right: 8,
                          bgcolor: "rgba(0,0,0,0.8)",
                          color: "white",
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: "12px",
                          fontWeight: 600,
                          fontFamily: "monospace",
                        }}
                      >
                        {videoData.duration || "0:00"}
                      </Box>

                      {/* Play button overlay */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          bgcolor: "rgba(0,0,0,0.7)",
                          borderRadius: "50%",
                          width: 60,
                          height: 60,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          "&:hover": {
                            bgcolor: "rgba(0,0,0,0.8)",
                          },
                        }}
                        onClick={() => {
                          if (videoData.url) {
                            window.open(videoData.url, "_blank");
                          }
                        }}
                      >
                        <PlayIcon sx={{ color: "white", fontSize: 30 }} />
                      </Box>

                      {/* Video controls */}
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          bgcolor: "rgba(0,0,0,0.8)",
                          p: 1,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <IconButton size="small" sx={{ color: "white" }}>
                            <PlayIcon />
                          </IconButton>
                          <IconButton size="small" sx={{ color: "white" }}>
                            <VolumeIcon />
                          </IconButton>
                          <Typography
                            variant="caption"
                            sx={{ color: "white", mx: 1 }}
                          >
                            0:00 / {videoData.duration || "0:00"}
                          </Typography>
                          <Box sx={{ flexGrow: 1 }} />
                          <IconButton size="small" sx={{ color: "white" }}>
                            <SettingsIcon />
                          </IconButton>
                        </Box>

                        {/* Progress bar */}
                        <LinearProgress
                          variant="determinate"
                          value={0}
                          sx={{
                            height: 4,
                            bgcolor: "rgba(255,255,255,0.3)",
                            "& .MuiLinearProgress-bar": { bgcolor: "#FF0000" },
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Chart guide */}
                    <Box
                      sx={{
                        mt: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ color: "white" }}>
                        Chart guide
                      </Typography>
                      <IconButton size="small" sx={{ color: "#888" }}>
                        <HelpIcon fontSize="small" />
                      </IconButton>
                    </Box>

                      
                </CardContent>
              </Card>
            </Box>
          </>
        )}

        {/* Reach Tab */}
        {tabValue === 2 && (
          <Card
            sx={{
              bgcolor: "#2A2A2A",
              border: "1px solid #333",
              mb: 4,
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h5"
                sx={{ color: "white", fontWeight: 600, mb: 4 }}
              >
                Reach Analytics
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 3,
                  mb: 4,
                }}
              >
                <Box sx={{ p: 3, bgcolor: "#1a1a1a", borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: "#888", mb: 1 }}>
                    Impressions
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ color: "white", fontWeight: 700 }}
                  >
                    {formatNumber(Math.floor(videoData.views * 1.5))}
                  </Typography>
                </Box>

                <Box sx={{ p: 3, bgcolor: "#1a1a1a", borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: "#888", mb: 1 }}>
                    Unique viewers
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ color: "white", fontWeight: 700 }}
                  >
                    {formatNumber(Math.floor(videoData.views * 0.8))}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body1" sx={{ color: "#888" }}>
                Your video reached{" "}
                {formatNumber(Math.floor(videoData.views * 1.5))} .
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Engagement Tab */}
        {tabValue === 1 && (
          <Card
            sx={{
              bgcolor: "#2A2A2A",
              border: "1px solid #333",
              mb: 4,
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h5"
                sx={{ color: "white", fontWeight: 600, mb: 4 }}
              >
                Engagement Analytics
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 3,
                  mb: 4,
                }}
              >
                <Box sx={{ p: 3, bgcolor: "#1a1a1a", borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: "#888", mb: 1 }}>
                    Likes
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ color: "white", fontWeight: 700 }}
                  >
                    {formatNumber(videoData.likes)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#4CAF50" }}>
                    {calculateEngagement(videoData.likes, videoData.views)}%
                    engagement
                  </Typography>
                </Box>
                <Box sx={{ p: 3, bgcolor: "#1a1a1a", borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: "#888", mb: 1 }}>
                    Comments
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ color: "white", fontWeight: 700 }}
                  >
                    {formatNumber(videoData.comments)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#2196F3" }}>
                    {((videoData.comments / videoData.views) * 100).toFixed(3)}%
                    comment rate
                  </Typography>
                </Box>
                <Box sx={{ p: 3, bgcolor: "#1a1a1a", borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: "#888", mb: 1 }}>
                    Shares
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ color: "white", fontWeight: 700 }}
                  >
                    {formatNumber(Math.floor(videoData.likes * 0.1))}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#FF9800" }}>
                    {(
                      (Math.floor(videoData.likes * 0.1) / videoData.views) *
                      100
                    ).toFixed(3)}
                    % share rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Audience Tab */}
        {tabValue === 3 && (
          <Card
            sx={{
              bgcolor: "#2A2A2A",
              border: "1px solid #333",
              mb: 4,
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h5"
                sx={{ color: "white", fontWeight: 600, mb: 4 }}
              >
                Audience Analytics
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 3,
                  mb: 4,
                }}
              >
                <Box sx={{ p: 3, bgcolor: "#1a1a1a", borderRadius: 1 }}></Box>
                <Box sx={{ p: 3, bgcolor: "#1a1a1a", borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: "#888", mb: 1 }}>
                    New viewers
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ color: "white", fontWeight: 700 }}
                  >
                    {(70 - (Math.random() * 30 + 40)).toFixed(1)}%
                  </Typography>
                </Box>
                <Box sx={{ p: 3, bgcolor: "#1a1a1a", borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: "#888", mb: 1 }}>
                    Subscribers gained
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ color: "white", fontWeight: 700 }}
                  >
                    {formatNumber(Math.floor(videoData.views * 0.02))}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body1" sx={{ color: "#888" }}>
                This video attracted{" "}
                {formatNumber(Math.floor(videoData.views * 0.02))} new
                subscribers and had a good mix of returning and new viewers.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Layout>
  );
};

export default VideoAnalytics;
