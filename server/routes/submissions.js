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

// Dummy submissions data
let submissions = [
  {
    id: 1,
    title: '[STL] My boy best friend thinks we\'ve been dating for a year',
    type: 'Trope',
    number: 'TLDR',
    structure: 'No structure selected',
    googleDocLink: 'https://docs.google.com/document/d/example1',
    status: 'Posted',
    submittedOn: '3/16/2025',
    userId: 1
  },
  {
    id: 2,
    title: '[STL] testing 123',
    type: 'Trope',
    number: 'TLDR',
    structure: 'No structure selected',
    googleDocLink: 'https://docs.google.com/document/d/example2',
    status: 'Rejected',
    submittedOn: '3/1/2025',
    userId: 1
  },
  {
    id: 3,
    title: '[STL] test test do not edit this',
    type: 'Trope',
    number: 'TLDR',
    structure: 'No structure selected',
    googleDocLink: 'https://docs.google.com/document/d/example3',
    status: 'Pending',
    submittedOn: '4/20/2025',
    userId: 1
  },
  {
    id: 4,
    title: '[Original] My family has a death',
    type: 'Original',
    number: 'Choose',
    structure: 'No structure selected',
    googleDocLink: 'https://docs.google.com/document/d/example4',
    status: 'Pending',
    submittedOn: '4/15/2025',
    userId: 1
  }
];

// Get all submissions for authenticated user
router.get('/', authenticateToken, (req, res) => {
  try {
    const userSubmissions = submissions.filter(s => s.userId === req.user.userId);
    res.json(userSubmissions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get submission by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const submission = submissions.find(s => 
      s.id === parseInt(req.params.id) && s.userId === req.user.userId
    );
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new submission
router.post('/', authenticateToken, (req, res) => {
  try {
    const { title, type, number, structure, googleDocLink } = req.body;
    
    const newSubmission = {
      id: submissions.length + 1,
      title,
      type,
      number,
      structure: structure || 'No structure selected',
      googleDocLink,
      status: 'Pending',
      submittedOn: new Date().toLocaleDateString(),
      userId: req.user.userId
    };
    
    submissions.push(newSubmission);
    res.status(201).json(newSubmission);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update submission
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const submissionIndex = submissions.findIndex(s => 
      s.id === parseInt(req.params.id) && s.userId === req.user.userId
    );
    
    if (submissionIndex === -1) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    const { title, type, number, structure, googleDocLink, status } = req.body;
    
    submissions[submissionIndex] = {
      ...submissions[submissionIndex],
      title: title || submissions[submissionIndex].title,
      type: type || submissions[submissionIndex].type,
      number: number || submissions[submissionIndex].number,
      structure: structure || submissions[submissionIndex].structure,
      googleDocLink: googleDocLink || submissions[submissionIndex].googleDocLink,
      status: status || submissions[submissionIndex].status
    };
    
    res.json(submissions[submissionIndex]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete submission
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const submissionIndex = submissions.findIndex(s => 
      s.id === parseInt(req.params.id) && s.userId === req.user.userId
    );
    
    if (submissionIndex === -1) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    submissions.splice(submissionIndex, 1);
    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
