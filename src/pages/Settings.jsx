import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Switch,
  Button,
  Divider,
  FormControlLabel
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import Layout from '../components/Layout.jsx';

const Settings = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);

  const handleClose = () => {
    navigate(-1); // Go back to previous page
  };

  const handleSave = () => {
    // In a real app, this would save settings to backend/localStorage
    console.log('Settings saved:', { darkMode });
    navigate(-1);
  };

  const handleDarkModeChange = (event) => {
    setDarkMode(event.target.checked);
  };

  return (
    <Layout>
      <Box sx={{
        minHeight: '100vh',
        bgcolor: '#1a1a1a',
        color: 'white',
        p: 4,
        position: 'relative'
      }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          mb: 4,
          pb: 2,
          borderBottom: '1px solid #333'
        }}>
          <SettingsIcon sx={{ color: '#888', fontSize: 24 }} />
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
            Settings
          </Typography>
        </Box>

        {/* General Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 500 }}>
            General
          </Typography>

          {/* Dark Mode Setting */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: 2
          }}>
            <Typography variant="body1" sx={{ color: 'white' }}>
              Dark Mode
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: '#888' }}>
                {darkMode ? 'ON' : 'OFF'}
              </Typography>
              <Switch
                checked={darkMode}
                onChange={handleDarkModeChange}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#E6B800',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#E6B800',
                  },
                  '& .MuiSwitch-track': {
                    backgroundColor: '#666',
                  }
                }}
              />
            </Box>
          </Box>

          <Divider sx={{ bgcolor: '#333', my: 2 }} />

          {/* Additional settings can be added here */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: 2,
            opacity: 0.5
          }}>
            <Typography variant="body1" sx={{ color: '#888' }}>
              Notifications
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Coming soon
            </Typography>
          </Box>

          <Divider sx={{ bgcolor: '#333', my: 2 }} />

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: 2,
            opacity: 0.5
          }}>
            <Typography variant="body1" sx={{ color: '#888' }}>
              Language
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              English (US)
            </Typography>
          </Box>

          <Divider sx={{ bgcolor: '#333', my: 2 }} />

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: 2,
            opacity: 0.5
          }}>
            <Typography variant="body1" sx={{ color: '#888' }}>
              Auto-save
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Enabled
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: 'flex',
          gap: 2
        }}>
          <Button
            variant="outlined"
            onClick={handleClose}
            sx={{
              color: '#888',
              borderColor: '#444',
              textTransform: 'none',
              px: 3,
              py: 1,
              '&:hover': {
                borderColor: '#666',
                bgcolor: 'rgba(255,255,255,0.05)'
              }
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              bgcolor: '#E6B800',
              color: 'black',
              textTransform: 'none',
              px: 3,
              py: 1,
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#D4A600'
              }
            }}
          >
            Save
          </Button>
        </Box>
      </Box>
    </Layout>
  );
};

export default Settings;
