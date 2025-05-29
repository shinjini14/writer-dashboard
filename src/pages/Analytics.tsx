import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import Layout from '../components/Layout';
import axios from 'axios';

interface AnalyticsData {
  totalSubmissions: number;
  acceptedSubmissions: number;
  rejectedSubmissions: number;
  pendingSubmissions: number;
  acceptanceRate: number;
  monthlySubmissions: Array<{
    month: string;
    submissions: number;
    accepted: number;
  }>;
  submissionsByType: Array<{
    type: string;
    count: number;
  }>;
  recentActivity: Array<{
    date: string;
    action: string;
    title: string;
  }>;
}

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/analytics');
        setAnalyticsData(response.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Layout>
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
        </Box>
      </Layout>
    );
  }

  if (!analyticsData) {
    return (
      <Layout>
        <Typography>Error loading analytics data</Typography>
      </Layout>
    );
  }

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box sx={{ color: color }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Analytics Dashboard
        </Typography>

        <Grid container spacing={3}>
          {/* Stats Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Submissions"
              value={analyticsData.totalSubmissions}
              icon={<AssignmentIcon fontSize="large" />}
              color="primary.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Accepted"
              value={analyticsData.acceptedSubmissions}
              icon={<CheckCircleIcon fontSize="large" />}
              color="success.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Rejected"
              value={analyticsData.rejectedSubmissions}
              icon={<CancelIcon fontSize="large" />}
              color="error.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending"
              value={analyticsData.pendingSubmissions}
              icon={<ScheduleIcon fontSize="large" />}
              color="warning.main"
            />
          </Grid>

          {/* Acceptance Rate */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Acceptance Rate
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h3" color="success.main" sx={{ mr: 1 }}>
                    {analyticsData.acceptanceRate}%
                  </Typography>
                  <TrendingUpIcon color="success" />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={analyticsData.acceptanceRate}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Submissions by Type */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Submissions by Type
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {analyticsData.submissionsByType.map((item) => (
                    <Box key={item.type} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography>{item.type}</Typography>
                      <Chip label={item.count} color="primary" />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Monthly Submissions */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Submissions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {analyticsData.monthlySubmissions.map((month) => (
                    <Box key={month.month} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography>{month.month}</Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip label={`${month.submissions} total`} size="small" />
                        <Chip label={`${month.accepted} accepted`} size="small" color="success" />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                <List>
                  {analyticsData.recentActivity.map((activity, index) => (
                    <ListItem key={index} divider={index < analyticsData.recentActivity.length - 1}>
                      <ListItemText
                        primary={activity.action}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {activity.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {activity.date}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
};

export default Analytics;
