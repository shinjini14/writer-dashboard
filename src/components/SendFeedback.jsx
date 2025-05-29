import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  CameraAlt as CameraIcon
} from '@mui/icons-material';

const SendFeedback = ({ open, onClose }) => {
  const [problemDescription, setProblemDescription] = useState('');
  const [screenshot, setScreenshot] = useState(null);

  const handleSubmit = () => {
    // In a real app, this would send feedback to backend
    console.log('Feedback submitted:', {
      problem: problemDescription,
      screenshot: screenshot
    });
    
    // Reset form
    setProblemDescription('');
    setScreenshot(null);
    onClose();
  };

  const handleCaptureScreenshot = async () => {
    try {
      // In a real app, this would use screen capture API
      // For now, we'll just simulate the action
      console.log('Screenshot capture initiated');
      
      // Simulate screenshot capture
      setScreenshot('screenshot_captured.png');
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#2A2A2A',
          color: 'white',
          borderRadius: 2,
          border: '1px solid #444'
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 3,
          borderBottom: '1px solid #444'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              Send feedback to
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ 
                color: 'white', 
                fontWeight: 700,
                letterSpacing: '0.5px'
              }}>
                PLOT
              </Typography>
              <Box sx={{
                width: 8,
                height: 8,
                bgcolor: '#E6B800',
                borderRadius: '50%'
              }} />
              <Typography variant="h6" sx={{ 
                color: 'white', 
                fontWeight: 700,
                letterSpacing: '0.5px'
              }}>
                POINTE
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{ 
              color: '#888',
              '&:hover': { color: 'white' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          {/* Problem Description */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 500 }}>
              Describe your problem
            </Typography>
            <TextField
              multiline
              rows={6}
              fullWidth
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="Tell us the problem! ex: wrong video uploaded (send video uploaded + the script)"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#1a1a1a',
                  color: 'white',
                  '& fieldset': {
                    borderColor: '#444',
                  },
                  '&:hover fieldset': {
                    borderColor: '#666',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#E6B800',
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#888',
                  opacity: 1,
                },
              }}
            />
          </Box>

          {/* Screenshot Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>
              A screenshot will help us better understand your problem (optional)
            </Typography>
            
            <Button
              variant="outlined"
              startIcon={<CameraIcon />}
              onClick={handleCaptureScreenshot}
              fullWidth
              sx={{
                color: '#4A9EFF',
                borderColor: '#444',
                textTransform: 'none',
                py: 2,
                fontSize: '16px',
                '&:hover': {
                  borderColor: '#4A9EFF',
                  bgcolor: 'rgba(74, 158, 255, 0.1)'
                }
              }}
            >
              Capture screenshot
            </Button>
            
            {screenshot && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#1a1a1a', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ color: '#4CAF50' }}>
                  ✓ Screenshot captured: {screenshot}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                color: '#888',
                borderColor: '#444',
                textTransform: 'none',
                px: 3,
                '&:hover': {
                  borderColor: '#666',
                  bgcolor: 'rgba(255,255,255,0.05)'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!problemDescription.trim()}
              sx={{
                bgcolor: '#E6B800',
                color: 'black',
                textTransform: 'none',
                px: 3,
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#D4A600'
                },
                '&:disabled': {
                  bgcolor: '#666',
                  color: '#999'
                }
              }}
            >
              Send Feedback
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SendFeedback;
