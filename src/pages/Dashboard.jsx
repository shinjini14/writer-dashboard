import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Alert,
} from '@mui/material';
import Layout from '../components/Layout.jsx';
import PreviousSubmissions from '../components/PreviousSubmissions.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import axios from 'axios';
import { buildApiUrl, API_CONFIG } from '../config/api.js';

const Dashboard = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // New submission form state
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    number: '',
    structure: '',
    googleDocLink: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  const fetchSubmissions = async () => {
    try {
      const response = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.SUBMISSIONS.LIST));
      setSubmissions(response.data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const response = await axios.post(buildApiUrl(API_CONFIG.ENDPOINTS.SUBMISSIONS.CREATE), formData);
      setSubmissions(prev => [response.data, ...prev]);
      setFormSuccess(true);

      // Reset form
      setFormData({
        title: '',
        type: '',
        number: '',
        structure: '',
        googleDocLink: '',
      });

      setTimeout(() => setFormSuccess(false), 3000);
    } catch (error) {
      setFormError(error.response?.data?.message || 'Failed to create submission');
    } finally {
      setFormLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setFormError('');
    setFormSuccess(false);
  };

  const typeOptions = ['Trope', 'Original', 'TLDR'];
  const numberOptions = ['Choose', 'TLDR', '1', '2', '3'];

  return (
    <Layout>
      <Box sx={{
        minHeight: '100vh',
        bgcolor: '#1a1a1a',
        color: 'white',
        p: { xs: 2, lg: 4 },
        width: '100%'
      }}>
        {/* Welcome Header */}
        <Box sx={{ mb: 4, textAlign: 'left' }}>
          <Typography variant="h5" fontWeight="600" sx={{ color: 'white', mb: 0.5 }}>
            Welcome, {user?.name || 'Writer'}! What are we writing today?
          </Typography>
          <Typography variant="body2" sx={{ color: '#888' }}>
            Writer ID: {user?.writerId || 'N/A'}
          </Typography>
        </Box>

        <Box sx={{
          display: 'flex',
          gap: 4,
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', lg: 'row' },
          alignItems: { xs: 'center', lg: 'flex-start' },
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* New Script Submission - Left Side */}
          <Box sx={{
            width: { xs: '100%', lg: '450px' },
            maxWidth: { xs: '550px', lg: '500px' },
            flex: { lg: '0 0 550px' }
          }}>
            <Box>
              <Typography
                variant="h6"
                fontWeight="600"
                sx={{
                  color: 'white',
                  mb: 3,
                }}
              >
                New Script Submission
              </Typography>

              {formError && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    bgcolor: 'rgba(244, 67, 54, 0.1)',
                    border: '1px solid rgba(244, 67, 54, 0.3)',
                    borderRadius: '12px',
                    '& .MuiAlert-message': { color: '#ff6b6b' }
                  }}
                >
                  {formError}
                </Alert>
              )}

              {formSuccess && (
                <Alert
                  severity="success"
                  sx={{
                    mb: 3,
                    bgcolor: 'rgba(76, 175, 80, 0.1)',
                    border: '1px solid rgba(76, 175, 80, 0.3)',
                    borderRadius: '12px',
                    '& .MuiAlert-message': { color: '#4caf50' }
                  }}
                >
                  Submission created successfully!
                </Alert>
              )}

              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                  bgcolor: '#2A2A2A',
                  p: 3,
                  borderRadius: '8px',
                  border: '1px solid #444',
                }}
              >
                {/* Title Field */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    Title *
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder=""
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#1a1a1a',
                        border: '1px solid #555',
                        '& fieldset': { border: 'none' },
                        '&:hover fieldset': { border: 'none' },
                        '&.Mui-focused fieldset': { border: '1px solid #FFD700' },
                      },
                      '& .MuiInputBase-input': { color: 'white' },
                    }}
                  />
                </Box>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                      Type *
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {typeOptions.map((option) => (
                        <Chip
                          key={option}
                          label={option}
                          clickable
                          onClick={() => handleInputChange('type', option)}
                          sx={{
                            bgcolor: formData.type === option ? '#E6B800' : '#444',
                            color: formData.type === option ? 'black' : 'white',
                            '&:hover': {
                              bgcolor: formData.type === option ? '#E6B800' : '#555',
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                      Number *
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {numberOptions.map((option) => (
                        <Chip
                          key={option}
                          label={option}
                          clickable
                          onClick={() => handleInputChange('number', option)}
                          sx={{
                            bgcolor: formData.number === option ? '#E6B800' : '#444',
                            color: formData.number === option ? 'black' : 'white',
                            '&:hover': {
                              bgcolor: formData.number === option ? '#E6B800' : '#555',
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    Structure *
                  </Typography>
                  <FormControl fullWidth size="small" required>
                    <Select
                      value={formData.structure}
                      onChange={(e) => handleInputChange('structure', e.target.value)}
                      displayEmpty
                      required
                      sx={{
                        bgcolor: '#1a1a1a',
                        border: '1px solid #555',
                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: '1px solid #E6B800' },
                        '& .MuiSelect-select': { color: 'white' },
                        '& .MuiSvgIcon-root': { color: 'white' },
                      }}
                    >
                      <MenuItem value="">-- Select structure --</MenuItem>
                      <MenuItem value="Three Act Structure">Three Act Structure</MenuItem>
                      <MenuItem value="Hero's Journey">Hero's Journey</MenuItem>
                      <MenuItem value="Save the Cat">Save the Cat</MenuItem>
                      <MenuItem value="Freytag's Pyramid">Freytag's Pyramid</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    Google Doc Link *
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder=""
                    value={formData.googleDocLink}
                    onChange={(e) => handleInputChange('googleDocLink', e.target.value)}
                    required
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#1a1a1a',
                        border: '1px solid #555',
                        '& fieldset': { border: 'none' },
                        '&:hover fieldset': { border: 'none' },
                        '&.Mui-focused fieldset': { border: '1px solid #E6B800' },
                      },
                      '& .MuiInputBase-input': { color: 'white' },
                    }}
                  />
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={formLoading || !formData.title || !formData.type || !formData.number || !formData.structure || !formData.googleDocLink}
                  sx={{
                    bgcolor: '#E6B800',
                    color: 'black',
                    fontWeight: 'bold',
                    '&:hover': { bgcolor: '#D4A600' },
                    '&:disabled': { bgcolor: '#666', color: '#999' },
                  }}
                >
                  {formLoading ? 'Submitting...' : 'Submit'}
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Previous Submissions - Right Side */}
          <Box sx={{
            width: { xs: '100%', lg: '500px' },
            maxWidth: { xs: '600px', lg: '500px' },
            flex: { lg: '0 0 500px' }
          }}>
            <PreviousSubmissions
              submissions={submissions}
              loading={loading}
              onRefresh={fetchSubmissions}
            />
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default Dashboard;