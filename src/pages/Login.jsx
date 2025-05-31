import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Avatar,
  Fade,
  Slide,
  Zoom,
  IconButton,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility,
  VisibilityOff,
  VideoLibrary,
  Analytics,
  Dashboard,
  TrendingUp,
  Star,
  PlayCircle
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.jsx';

const Login = () => {
  const [username, setUsername] = useState('HannahMosk');
  const [password, setPassword] = useState('Elijahthornberry3');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      // Navigation will be handled by useEffect when user state updates
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #000000 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 20%, rgba(244, 196, 48, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(244, 196, 48, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 40% 60%, rgba(244, 196, 48, 0.03) 0%, transparent 50%)
          `,
          animation: 'backgroundFloat 8s ease-in-out infinite',
        },
        '@keyframes backgroundFloat': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-10px) rotate(1deg)' },
          '66%': { transform: 'translateY(5px) rotate(-1deg)' },
        },
        '@keyframes float3D': {
          '0%, 100%': { transform: 'translateY(0px) translateZ(0px) rotateX(0deg)' },
          '50%': { transform: 'translateY(-20px) translateZ(10px) rotateX(5deg)' },
        },
        '@keyframes rotate3D': {
          '0%': { transform: 'rotateY(0deg) rotateX(0deg)' },
          '100%': { transform: 'rotateY(360deg) rotateX(360deg)' },
        },
        '@keyframes pulse3D': {
          '0%, 100%': { transform: 'scale(1) rotateZ(0deg)', boxShadow: '0 0 20px rgba(244, 196, 48, 0.3)' },
          '50%': { transform: 'scale(1.1) rotateZ(180deg)', boxShadow: '0 0 40px rgba(244, 196, 48, 0.6)' },
        },
      }}
    >
      {/* 3D Animated Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '15%',
          left: '8%',
          width: '120px',
          height: '120px',
          background: 'linear-gradient(45deg, rgba(244, 196, 48, 0.2), rgba(244, 196, 48, 0.05))',
          borderRadius: '20px',
          animation: 'float3D 6s ease-in-out infinite',
          animationDelay: '0s',
          transform: 'perspective(1000px)',
          boxShadow: '0 10px 30px rgba(244, 196, 48, 0.1)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '60%',
          right: '10%',
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, rgba(244, 196, 48, 0.15), transparent)',
          borderRadius: '50%',
          animation: 'rotate3D 20s linear infinite',
          animationDelay: '2s',
          transform: 'perspective(1000px)',
          border: '1px solid rgba(244, 196, 48, 0.2)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '25%',
          right: '20%',
          width: '60px',
          height: '60px',
          background: 'rgba(244, 196, 48, 0.1)',
          borderRadius: '10px',
          animation: 'pulse3D 4s ease-in-out infinite',
          animationDelay: '1s',
          transform: 'perspective(1000px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '15%',
          width: '100px',
          height: '100px',
          background: 'linear-gradient(90deg, rgba(244, 196, 48, 0.08), rgba(244, 196, 48, 0.02))',
          borderRadius: '15px',
          animation: 'float3D 8s ease-in-out infinite',
          animationDelay: '3s',
          transform: 'perspective(1000px) rotateY(45deg)',
          border: '1px solid rgba(244, 196, 48, 0.1)',
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
        >
          {/* Header Section - Clean, No Animations */}
          <Box textAlign="center" mb={4}>
            <Avatar
              sx={{
                bgcolor: '#f4c430',
                width: 80,
                height: 80,
                mb: 3,
                mx: 'auto',
                boxShadow: '0 8px 32px rgba(244, 196, 48, 0.4)',
                background: 'linear-gradient(135deg, #f4c430 0%, #f39c12 100%)',
                border: '2px solid rgba(244, 196, 48, 0.3)',
              }}
            >
              <EditIcon sx={{ fontSize: 40, color: '#000' }} />
            </Avatar>

            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 700,
                color: '#f4c430',
                mb: 1,
                textShadow: '0 2px 8px rgba(244, 196, 48, 0.3)',
              }}
            >
              Writer Studio
            </Typography>

            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 300,
                mb: 1,
              }}
            >
              Professional Content Dashboard
            </Typography>

            {/* Feature Chips - Static */}
            <Box display="flex" justifyContent="center" gap={1} flexWrap="wrap" mt={2}>
              <Chip
                icon={<Analytics />}
                label="Analytics"
                size="small"
                sx={{
                  bgcolor: 'rgba(244, 196, 48, 0.1)',
                  color: '#f4c430',
                  border: '1px solid rgba(244, 196, 48, 0.3)',
                }}
              />
              <Chip
                icon={<VideoLibrary />}
                label="Content"
                size="small"
                sx={{
                  bgcolor: 'rgba(244, 196, 48, 0.1)',
                  color: '#f4c430',
                  border: '1px solid rgba(244, 196, 48, 0.3)',
                }}
              />
              <Chip
                icon={<TrendingUp />}
                label="Growth"
                size="small"
                sx={{
                  bgcolor: 'rgba(244, 196, 48, 0.1)',
                  color: '#f4c430',
                  border: '1px solid rgba(244, 196, 48, 0.3)',
                }}
              />
            </Box>
          </Box>

          {/* Login Card - Clean, No Animations */}
          <Card
            sx={{
              width: '100%',
              maxWidth: 450,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(244, 196, 48, 0.3)',
              borderRadius: 4,
              boxShadow: '0 20px 60px rgba(244, 196, 48, 0.1), inset 0 1px 0 rgba(244, 196, 48, 0.2)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    bgcolor: 'rgba(244, 67, 54, 0.1)',
                    border: '1px solid rgba(244, 67, 54, 0.3)',
                    color: '#ff6b6b',
                  }}
                >
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  margin="normal"
                  required
                  autoComplete="username"
                  autoFocus
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      '& fieldset': {
                        borderColor: 'rgba(244, 196, 48, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(244, 196, 48, 0.6)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#f4c430',
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(244, 196, 48, 0.8)',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#f4c430',
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'white',
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                  autoComplete="current-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: 'rgba(244, 196, 48, 0.7)' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      '& fieldset': {
                        borderColor: 'rgba(244, 196, 48, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(244, 196, 48, 0.6)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#f4c430',
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(244, 196, 48, 0.8)',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#f4c430',
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'white',
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    mt: 4,
                    mb: 2,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #f4c430 0%, #f39c12 100%)',
                    color: '#000',
                    boxShadow: '0 4px 20px rgba(244, 196, 48, 0.3)',
                    border: '1px solid rgba(244, 196, 48, 0.5)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
                      boxShadow: '0 6px 25px rgba(244, 196, 48, 0.4)',
                    },
                    '&:disabled': {
                      background: 'rgba(244, 196, 48, 0.3)',
                      color: 'rgba(0, 0, 0, 0.5)',
                    },
                  }}
                >
                  {loading ? (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          border: '2px solid rgba(0,0,0,0.3)',
                          borderTop: '2px solid black',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' },
                          },
                        }}
                      />
                      Signing In...
                    </Box>
                  ) : (
                    <Box display="flex" alignItems="center" gap={1}>
                      <PlayCircle />
                      Enter Studio
                    </Box>
                  )}
                </Button>
              </form>


            </CardContent>
          </Card>

          {/* Footer */}
          <Box mt={4} textAlign="center">
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(244, 196, 48, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}
            >

            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
