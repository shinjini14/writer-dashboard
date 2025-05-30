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
  const [email, setEmail] = useState('writer@example.com');
  const [password, setPassword] = useState('password');
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
      await login(email, password);
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
          background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          animation: 'float 6s ease-in-out infinite',
        },
        '@keyframes float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        '@keyframes slideInUp': {
          '0%': { transform: 'translateY(100px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        '@keyframes fadeInScale': {
          '0%': { transform: 'scale(0.8)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        '@keyframes pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      }}
    >
      {/* Animated Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'rgba(244, 196, 48, 0.1)',
          animation: 'float 4s ease-in-out infinite',
          animationDelay: '0s',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '70%',
          right: '15%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'rgba(79, 195, 247, 0.1)',
          animation: 'float 5s ease-in-out infinite',
          animationDelay: '2s',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '30%',
          right: '5%',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          animation: 'float 3s ease-in-out infinite',
          animationDelay: '1s',
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in={mounted} timeout={1000}>
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh"
          >
            {/* Header Section with Animations */}
            <Slide direction="down" in={mounted} timeout={800}>
              <Box textAlign="center" mb={4}>
                <Zoom in={mounted} timeout={1200}>
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 80,
                      height: 80,
                      mb: 3,
                      mx: 'auto',
                      boxShadow: '0 8px 32px rgba(244, 196, 48, 0.3)',
                      animation: 'pulse 2s ease-in-out infinite',
                      background: 'linear-gradient(135deg, #f4c430 0%, #f39c12 100%)',
                    }}
                  >
                    <EditIcon sx={{ fontSize: 40 }} />
                  </Avatar>
                </Zoom>

                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f4c430 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
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

                {/* Feature Chips */}
                <Box display="flex" justifyContent="center" gap={1} flexWrap="wrap" mt={2}>
                  <Slide direction="up" in={mounted} timeout={1000}>
                    <Chip
                      icon={<Analytics />}
                      label="Analytics"
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        backdropFilter: 'blur(10px)',
                      }}
                    />
                  </Slide>
                  <Slide direction="up" in={mounted} timeout={1200}>
                    <Chip
                      icon={<VideoLibrary />}
                      label="Content"
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        backdropFilter: 'blur(10px)',
                      }}
                    />
                  </Slide>
                  <Slide direction="up" in={mounted} timeout={1400}>
                    <Chip
                      icon={<TrendingUp />}
                      label="Growth"
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        backdropFilter: 'blur(10px)',
                      }}
                    />
                  </Slide>
                </Box>
              </Box>
            </Slide>

            {/* Login Card with Glass Effect */}
            <Slide direction="up" in={mounted} timeout={1000}>
              <Card
                sx={{
                  width: '100%',
                  maxWidth: 450,
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 4,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  animation: 'fadeInScale 1s ease-out',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                  },
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  {error && (
                    <Fade in={!!error}>
                      <Alert
                        severity="error"
                        sx={{
                          mb: 3,
                          bgcolor: 'rgba(244, 67, 54, 0.1)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(244, 67, 54, 0.3)',
                          color: 'white',
                        }}
                      >
                        {error}
                      </Alert>
                    </Fade>
                  )}

                  <form onSubmit={handleSubmit}>
                    <Slide direction="right" in={mounted} timeout={1200}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        margin="normal"
                        required
                        autoComplete="email"
                        autoFocus
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(244, 196, 48, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#f4c430',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                          },
                          '& .MuiOutlinedInput-input': {
                            color: 'white',
                          },
                        }}
                      />
                    </Slide>

                    <Slide direction="left" in={mounted} timeout={1400}>
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
                                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(244, 196, 48, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#f4c430',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                          },
                          '& .MuiOutlinedInput-input': {
                            color: 'white',
                          },
                        }}
                      />
                    </Slide>

                    <Zoom in={mounted} timeout={1600}>
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
                          boxShadow: '0 4px 20px rgba(244, 196, 48, 0.3)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
                            boxShadow: '0 6px 25px rgba(244, 196, 48, 0.4)',
                            transform: 'translateY(-2px)',
                          },
                          '&:disabled': {
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.5)',
                          },
                        }}
                      >
                        {loading ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTop: '2px solid white',
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
                    </Zoom>
                  </form>

                  {/* Demo Credentials */}
                  <Fade in={mounted} timeout={2000}>
                    <Box
                      mt={3}
                      p={2}
                      sx={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 2,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.8)',
                          textAlign: 'center',
                          mb: 1,
                          fontWeight: 500,
                        }}
                      >
                        🚀 Demo Access
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>
                        Email: writer@example.com
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>
                        Password: password
                      </Typography>
                    </Box>
                  </Fade>
                </CardContent>
              </Card>
            </Slide>

            {/* Footer */}
            <Fade in={mounted} timeout={2500}>
              <Box mt={4} textAlign="center">
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                  }}
                >
                  <Star sx={{ fontSize: 16 }} />
                  Powered by Modern React & Material-UI
                  <Star sx={{ fontSize: 16 }} />
                </Typography>
              </Box>
            </Fade>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default Login;
