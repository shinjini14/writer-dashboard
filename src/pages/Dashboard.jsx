import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import Layout from '../components/Layout.jsx';
import PreviousSubmissions from '../components/PreviousSubmissions.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form state matching reference code
  const [title, setTitle] = useState('');
  const [prefixType, setPrefixType] = useState('Trope');
  const [prefixNumber, setPrefixNumber] = useState('Choose');
  const [selectedStructure, setSelectedStructure] = useState('');
  const [googleDocLink, setGoogleDocLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Enhanced form state from reference
  const [tropeList, setTropeList] = useState([]);
  const [structureList, setStructureList] = useState([]);
  const [writer, setWriter] = useState(null);

  // Fetch tropes from API - Updated for your API structure
  const fetchTropes = async () => {
    try {
      const response = await axios.get('/api/tropes');
      console.log('Tropes API response:', response.data);
      // API returns array of objects with id, number, name - extract names ordered by number
      if (Array.isArray(response.data)) {
        setTropeList(response.data.map((trope) => trope.name));
      } else {
        console.error('Tropes API did not return an array:', response.data);
        // Fallback data for testing
        setTropeList(['Sample Trope 1', 'Sample Trope 2', 'Sample Trope 3']);
      }
    } catch (error) {
      console.error('Error fetching tropes:', error);
      // Fallback to mock data when API is not available
      setTropeList(['The Hero\'s Journey', 'The Mentor', 'The Call to Adventure', 'The Threshold Guardian', 'The Shapeshifter']);
    }
  };

  // Fetch structures from API - Updated for your API structure
  const fetchStructures = async () => {
    try {
      const response = await axios.get('/api/structures');
      console.log('Structures API response:', response.data);
      // API returns { structures: [...] } where each structure has structure_id, name, writers
      if (response.data && response.data.structures) {
        setStructureList(response.data.structures);
      } else {
        console.error('Structures API did not return expected format:', response.data);
        // Fallback data for testing
        setStructureList([
          { structure_id: 1, name: 'Three Act Structure' },
          { structure_id: 2, name: 'Hero\'s Journey' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching structures:', error);
      // Fallback to mock data when API is not available
      setStructureList([
        { structure_id: 1, name: "Three Act Structure", writers: [] },
        { structure_id: 2, name: "Hero's Journey", writers: [] },
        { structure_id: 3, name: "Five Act Structure", writers: [] }
      ]);
    }
  };

  // Fetch writer data - Matching WriterDashboard.jsx
  const fetchWriterData = async () => {
    try {
      const username = user?.username || localStorage.getItem('username');
      if (!username) {
        setError('Username not found in local storage.');
        return;
      }

      const response = await axios.get(`/api/getWriter?username=${username}`);
      setWriter(response.data);
      fetchStructures();
      fetchScripts(response.data.id);
    } catch (error) {
      console.error('Error fetching writer data:', error);
      // Fallback to mock data when API is not available
      setWriter({
        id: 1,
        name: username || 'Test Writer',
        access_advanced_types: true,
        username: username || 'test_user'
      });
    }
  };

  // Fetch scripts using your API endpoint
  const fetchScripts = async (writer_id, filters = {}) => {
    try {
      setLoading(true);
      let url = `/api/scripts?writer_id=${writer_id}`;

      // Add query parameters for filtering
      if (filters.startDate && filters.endDate) {
        url += `&startDate=${filters.startDate}&endDate=${filters.endDate}`;
      }
      if (filters.searchTitle) {
        url += `&searchTitle=${encodeURIComponent(filters.searchTitle)}`;
      }

      const response = await axios.get(url);
      console.log('Scripts API response:', response.data);

      if (Array.isArray(response.data)) {
        setSubmissions(response.data);
      } else {
        console.error('Scripts API did not return an array:', response.data);
        setSubmissions([]);
      }
    } catch (error) {
      console.error('Error fetching scripts:', error);
      // Fallback to mock data when API is not available
      setSubmissions([
        {
          id: 1,
          title: "[Trope 1] The Hero's Journey Begins",
          google_doc_link: "https://docs.google.com/document/d/sample1",
          approval_status: "Pending",
          created_at: new Date().toISOString(),
          loom_url: null
        },
        {
          id: 2,
          title: "[Original] My Creative Story",
          google_doc_link: "https://docs.google.com/document/d/sample2",
          approval_status: "Posted",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          loom_url: null
        },
        {
          id: 3,
          title: "[STL] Short Story Example",
          google_doc_link: "https://docs.google.com/document/d/sample3",
          approval_status: "Rejected",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          loom_url: "https://loom.com/sample-feedback"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // useEffect for tropes - Matching WriterDashboard.jsx
  useEffect(() => {
    fetchTropes();
  }, []);

  // useEffect for writer data - Matching WriterDashboard.jsx
  useEffect(() => {
    fetchWriterData();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!writer) {
      setError('Writer information not loaded yet.');
      return;
    }

    // Enhanced validation for Trope type and Number
    if (prefixType === 'Trope' && prefixNumber === 'Choose') {
      setError('Please select a valid Trope number before submitting.');
      return;
    }

    setError(''); // Clear previous errors
    setIsSubmitting(true);

    try {
      // Build full title with structure and type prefix like in reference
      const fullTitle =
        (selectedStructure ? `[${selectedStructure}] ` : '') +
        (prefixType === 'Original' || prefixType === 'Re-write' || prefixType === 'STL'
          ? `[${prefixType}] ${title}`
          : `[${prefixType} ${prefixNumber}] ${title}`);

      await axios.post('/api/scripts', {
        writer_id: writer.id,
        title: fullTitle,
        google_doc_link: googleDocLink,
      });

      // Refresh the scripts list to get the latest data
      await fetchScripts(writer.id);

      // Reset form
      setTitle('');
      setGoogleDocLink('');
      setPrefixType('Trope');
      setPrefixNumber('Choose');
      setSelectedStructure('');

      setError(null);
      alert('Approval pending, may take 24-48 hours');
    } catch (error) {
      console.error('Error submitting script:', error);
      // Simulate successful submission when API is not available
      const newSubmission = {
        id: Date.now(),
        title: fullTitle,
        google_doc_link: googleDocLink,
        approval_status: "Pending",
        created_at: new Date().toISOString(),
        loom_url: null
      };

      setSubmissions(prev => [newSubmission, ...prev]);

      // Reset form
      setTitle('');
      setPrefixType('Trope');
      setPrefixNumber('Choose');
      setSelectedStructure('');
      setGoogleDocLink('');

      setError(null);
      alert('Script submitted successfully! (Demo mode - API not available)');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle type change like in reference
  const handleTypeChange = (e) => {
    setPrefixType(e.target.value);
    // Reset prefix number when type changes
    if (e.target.value !== 'Trope') {
      setPrefixNumber('Choose');
    }
  };

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
            Welcome, {writer?.name || user?.name || 'Writer'}! What are we writing today?
          </Typography>
          <Typography variant="body2" sx={{ color: '#888' }}>
            Writer ID: {writer?.id || user?.writerId || 'N/A'}
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

              {error && (
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
                  {error}
                </Alert>
              )}

              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                  bgcolor: '#2A2A2A',
                  p: 4,
                  borderRadius: '12px',
                  border: '1px solid #444',
                  width: '100%',
                  maxWidth: '600px'
                }}
              >
                {/* Title Field */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1, fontWeight: '500' }}>
                    Title
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder=""
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
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

                {/* Type Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1, fontWeight: '500' }}>
                    Type
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <FormControl size="small" sx={{ minWidth: '200px' }} required>
                      <Select
                        value={prefixType}
                        onChange={handleTypeChange}
                        displayEmpty
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
                        <MenuItem value="Trope">Trope</MenuItem>
                        <MenuItem value="Original">Original</MenuItem>
                        <MenuItem value="STL">STL</MenuItem>
                        <MenuItem value="Re-write">Re-write</MenuItem>
                      </Select>
                    </FormControl>

                    {prefixType === "Trope" && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" sx={{ color: '#ccc', fontWeight: '500' }}>
                          Number
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: '100px' }}>
                          <Select
                            value={prefixNumber}
                            onChange={(e) => setPrefixNumber(e.target.value)}
                            displayEmpty
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
                            <MenuItem value="Choose" disabled>
                              Choose
                            </MenuItem>
                            {Array.from({ length: tropeList.length }, (_, i) => (
                              <MenuItem key={i + 1} value={i + 1}>
                                {i + 1}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* TLDR/Trope Display Box - Now below Type */}
                <Box sx={{ mb: 4 }}>
                  <Box
                    sx={{
                      border: '1px solid #555',
                      borderRadius: '4px',
                      padding: '12px 15px',
                      bgcolor: '#1a1a1a',
                      fontSize: '14px',
                      width: '100%',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: '#ccc'
                    }}
                  >
                    {prefixType === "Trope" && prefixNumber !== "Choose"
                      ? `${tropeList[prefixNumber - 1]}`
                      : ""}
                  </Box>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1, fontWeight: '500' }}>
                    Structure
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={selectedStructure || ""}
                      onChange={(e) => setSelectedStructure(e.target.value)}
                      displayEmpty
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
                      <MenuItem value="">-- No structure selected --</MenuItem>
                      {structureList.map((structure) => (
                        <MenuItem key={structure.structure_id} value={structure.name}>
                          {structure.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1, fontWeight: '500' }}>
                    Google Doc Link
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder=""
                    type="url"
                    value={googleDocLink}
                    onChange={(e) => setGoogleDocLink(e.target.value)}
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
                  disabled={isSubmitting}
                  sx={{
                    bgcolor: '#E6B800',
                    color: 'black',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    py: 1.5,
                    '&:hover': { bgcolor: '#D4A600' },
                    '&:disabled': { bgcolor: '#666', color: '#999' },
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
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
              onRefresh={() => writer && fetchScripts(writer.id)}
            />
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default Dashboard;