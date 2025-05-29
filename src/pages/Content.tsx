import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Article as ArticleIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import Layout from '../components/Layout';

const Content: React.FC = () => {
  // Dummy content data
  const contentItems = [
    {
      id: 1,
      title: 'Writing Guidelines for Trope Stories',
      type: 'Guide',
      status: 'Published',
      lastModified: '2025-04-15',
      description: 'Comprehensive guide on writing engaging trope-based stories.',
    },
    {
      id: 2,
      title: 'Character Development Templates',
      type: 'Template',
      status: 'Draft',
      lastModified: '2025-04-10',
      description: 'Ready-to-use templates for developing compelling characters.',
    },
    {
      id: 3,
      title: 'Story Structure Examples',
      type: 'Example',
      status: 'Published',
      lastModified: '2025-04-08',
      description: 'Collection of well-structured story examples for reference.',
    },
    {
      id: 4,
      title: 'Dialogue Writing Tips',
      type: 'Guide',
      status: 'Review',
      lastModified: '2025-04-05',
      description: 'Best practices for writing natural and engaging dialogue.',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published':
        return 'success';
      case 'Draft':
        return 'warning';
      case 'Review':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Guide':
        return 'primary';
      case 'Template':
        return 'secondary';
      case 'Example':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Layout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Content Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ bgcolor: 'primary.main', color: 'black' }}
          >
            Create New Content
          </Button>
        </Box>

        <Grid container spacing={3}>
          {contentItems.map((item) => (
            <Grid item xs={12} md={6} lg={4} key={item.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <ArticleIcon color="primary" />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={item.type}
                        color={getTypeColor(item.type) as any}
                        size="small"
                      />
                      <Chip
                        label={item.status}
                        color={getStatusColor(item.status) as any}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <Typography variant="h6" gutterBottom>
                    {item.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {item.description}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Last modified: {item.lastModified}
                  </Typography>
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      variant="outlined"
                      fullWidth
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      variant="outlined"
                      fullWidth
                    >
                      Edit
                    </Button>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick Actions */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <AddIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="subtitle1">
                    New Writing Guide
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <AddIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                  <Typography variant="subtitle1">
                    New Template
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <AddIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                  <Typography variant="subtitle1">
                    New Example
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <EditIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="subtitle1">
                    Bulk Edit
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Layout>
  );
};

export default Content;
