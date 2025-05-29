const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
  try {
    // In a real app, fetch from database
    const userProfile = {
      id: req.user.userId,
      email: req.user.email,
      name: 'Steven Abreu',
      writerId: 74,
      avatar: 'L',
      joinedDate: '2024-01-15',
      totalSubmissions: 15,
      acceptedSubmissions: 8,
      bio: 'Passionate writer with a love for storytelling and creative expression.',
      preferences: {
        emailNotifications: true,
        submissionReminders: true,
        theme: 'dark'
      }
    };
    
    res.json(userProfile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { name, bio, preferences } = req.body;
    
    // In a real app, update in database
    const updatedProfile = {
      id: req.user.userId,
      email: req.user.email,
      name: name || 'Steven Abreu',
      writerId: 74,
      avatar: 'L',
      joinedDate: '2024-01-15',
      totalSubmissions: 15,
      acceptedSubmissions: 8,
      bio: bio || 'Passionate writer with a love for storytelling and creative expression.',
      preferences: preferences || {
        emailNotifications: true,
        submissionReminders: true,
        theme: 'dark'
      }
    };
    
    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
