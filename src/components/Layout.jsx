import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Article as ContentIcon,
  Settings as SettingsIcon,
  BugReport as BugReportIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import SendFeedback from './SendFeedback.jsx';

const drawerWidth = 250;

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
    { text: 'Content', icon: <ContentIcon />, path: '/content' },
  ];

  const bottomMenuItems = [
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { text: 'Send problem', icon: <BugReportIcon />, path: '/support' },
  ];

  const handleMenuClick = (path) => {
    if (path === '/support') {
      setFeedbackOpen(true);
    } else {
      navigate(path);
    }
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleProfileMenuClose();
  };

  return (
    <Box sx={{ display: 'flex' }}>

      {/* Sidebar */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#2A2A2A',
            borderRight: 'none',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #444' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                bgcolor: '#E6B800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <EditIcon sx={{ color: 'black', fontSize: 18 }} />
            </Box>
            <Typography variant="h6" fontWeight="600" sx={{ color: 'white' }}>
              Studio
            </Typography>
          </Box>
        </Box>

        {/* User Info */}
        <Box sx={{ p: 2, borderBottom: '1px solid #444' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: '#555',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              L
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="600" sx={{ color: 'white' }}>
                Writer
              </Typography>
              <Typography variant="caption" sx={{ color: '#888' }}>
                Login Paul
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Main Navigation */}
        <Box sx={{ px: 1, py: 2 }}>
          {menuItems.map((item) => (
            <Box
              key={item.text}
              onClick={() => handleMenuClick(item.path)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                mb: 0.5,
                borderRadius: '8px',
                cursor: 'pointer',
                bgcolor: location.pathname === item.path ? '#E6B800' : 'transparent',
                color: location.pathname === item.path ? 'black' : '#ccc',
                '&:hover': {
                  bgcolor: location.pathname === item.path ? '#E6B800' : 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              <Box sx={{ color: 'inherit', fontSize: 18 }}>
                {item.icon}
              </Box>
              <Typography variant="body2" fontWeight="500" sx={{ color: 'inherit' }}>
                {item.text}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Bottom Navigation */}
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ px: 1, pb: 2 }}>
          {bottomMenuItems.map((item) => (
            <Box
              key={item.text}
              onClick={() => handleMenuClick(item.path)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                mb: 0.5,
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#888',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  color: '#ccc',
                },
              }}
            >
              <Box sx={{ color: 'inherit', fontSize: 16 }}>
                {item.icon}
              </Box>
              <Typography variant="body2" fontWeight="400" sx={{ color: 'inherit' }}>
                {item.text}
              </Typography>
            </Box>
          ))}
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: '#1a1a1a',
          minHeight: '100vh',
          position: 'relative',
        }}
      >
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>

      {/* Send Feedback Modal */}
      <SendFeedback
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </Box>
  );
};

export default Layout;
