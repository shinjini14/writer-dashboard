const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Initialize InfluxDB service
let influxService;
try {
  const InfluxService = require('../services/influxService');
  // Set credentials
  process.env.INFLUXDB_URL = 'https://us-east-1-1.aws.cloud2.influxdata.com';
  process.env.INFLUXDB_TOKEN = 'ojNizGw1U0VID3ltz1khIx2aOQAHG0gIFEbR7VqVk6Ns23fzXOcJG-JxPkGKWL6lluFBQKdagMRbHm6-2iVHSw==';
  process.env.INFLUXDB_ORG = 'engineering team';
  process.env.INFLUXDB_BUCKET = 'youtube_api';
  influxService = new InfluxService();
  console.log('✅ InfluxDB service initialized for submissions');
} catch (error) {
  console.error('❌ Failed to initialize InfluxDB for submissions:', error);
}

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

// Comprehensive dummy submissions data showcasing all status types and content varieties
let submissions = [
  // Posted submissions (Green)
  {
    id: 1,
    title: '[STL] My boy best friend thinks we\'ve been dating for a year',
    type: 'Trope',
    number: 'TLDR',
    structure: 'Classic 3-Act Structure',
    googleDocLink: 'https://docs.google.com/document/d/example1',
    status: 'Posted',
    submittedOn: '3/16/2025',
    userId: 1
  },
  {
    id: 2,
    title: '[Original] The mystery of the missing cat',
    type: 'Original',
    number: '2',
    structure: 'Mystery structure',
    googleDocLink: 'https://docs.google.com/document/d/example2',
    status: 'Posted',
    submittedOn: '4/5/2025',
    userId: 1
  },
  {
    id: 3,
    title: '[TLDR] How I accidentally became a millionaire',
    type: 'TLDR',
    number: '5',
    structure: 'Success Story Arc',
    googleDocLink: 'https://docs.google.com/document/d/example3',
    status: 'Posted',
    submittedOn: '3/28/2025',
    userId: 1
  },

  // Rejected submissions (Red)
  {
    id: 4,
    title: '[STL] testing 123',
    type: 'Trope',
    number: 'TLDR',
    structure: 'No structure selected',
    googleDocLink: 'https://docs.google.com/document/d/example4',
    status: 'Rejected',
    submittedOn: '3/1/2025',
    userId: 1
  },
  {
    id: 5,
    title: '[Original] My boring day at work',
    type: 'Original',
    number: 'Choose',
    structure: 'Linear Narrative',
    googleDocLink: 'https://docs.google.com/document/d/example5',
    status: 'Rejected',
    submittedOn: '2/15/2025',
    userId: 1
  },
  {
    id: 6,
    title: '[TLDR] Why I hate Mondays',
    type: 'TLDR',
    number: '3',
    structure: 'Complaint Format',
    googleDocLink: 'https://docs.google.com/document/d/example6',
    status: 'Rejected',
    submittedOn: '2/28/2025',
    userId: 1
  },

  // Pending submissions (Orange)
  {
    id: 7,
    title: '[STL] test test do not edit this',
    type: 'Trope',
    number: 'TLDR',
    structure: 'No structure selected',
    googleDocLink: 'https://docs.google.com/document/d/example7',
    status: 'Pending',
    submittedOn: '4/20/2025',
    userId: 1
  },
  {
    id: 8,
    title: '[Original] The day everything changed',
    type: 'Original',
    number: '7',
    structure: 'Transformation Arc',
    googleDocLink: 'https://docs.google.com/document/d/example8',
    status: 'Pending',
    submittedOn: '4/18/2025',
    userId: 1
  },
  {
    id: 9,
    title: '[TLDR] My epic fail at cooking',
    type: 'TLDR',
    number: '1',
    structure: 'Comedy Structure',
    googleDocLink: 'https://docs.google.com/document/d/example9',
    status: 'Pending',
    submittedOn: '4/22/2025',
    userId: 1
  },

  // Under Review submissions (Blue)
  {
    id: 10,
    title: '[Original] My family has a death',
    type: 'Original',
    number: 'Choose',
    structure: 'Emotional Journey',
    googleDocLink: 'https://docs.google.com/document/d/example10',
    status: 'Under Review',
    submittedOn: '4/15/2025',
    userId: 1
  },
  {
    id: 11,
    title: '[STL] She said yes but I wasn\'t ready',
    type: 'Trope',
    number: '4',
    structure: 'Romance Arc',
    googleDocLink: 'https://docs.google.com/document/d/example11',
    status: 'Under Review',
    submittedOn: '4/12/2025',
    userId: 1
  },
  {
    id: 12,
    title: '[TLDR] How I survived a zombie apocalypse (in my dreams)',
    type: 'TLDR',
    number: '8',
    structure: 'Adventure Format',
    googleDocLink: 'https://docs.google.com/document/d/example12',
    status: 'Under Review',
    submittedOn: '4/14/2025',
    userId: 1
  },

  // Draft submissions (Gray)
  {
    id: 13,
    title: '[TLDR] Amazing story about friendship',
    type: 'TLDR',
    number: '1',
    structure: 'Classic structure',
    googleDocLink: 'https://docs.google.com/document/d/example13',
    status: 'Draft',
    submittedOn: '4/10/2025',
    userId: 1
  },
  {
    id: 14,
    title: '[Original] Untitled story idea',
    type: 'Original',
    number: 'Choose',
    structure: 'No structure selected',
    googleDocLink: 'https://docs.google.com/document/d/example14',
    status: 'Draft',
    submittedOn: '4/8/2025',
    userId: 1
  },
  {
    id: 15,
    title: '[STL] Work in progress - college drama',
    type: 'Trope',
    number: '6',
    structure: 'Coming of Age',
    googleDocLink: 'https://docs.google.com/document/d/example15',
    status: 'Draft',
    submittedOn: '4/6/2025',
    userId: 1
  },

  // Additional variety for better testing
  {
    id: 16,
    title: '[Original] The time I met a celebrity',
    type: 'Original',
    number: '9',
    structure: 'Encounter Structure',
    googleDocLink: 'https://docs.google.com/document/d/example16',
    status: 'Posted',
    submittedOn: '3/20/2025',
    userId: 1
  },
  {
    id: 17,
    title: '[STL] My roommate is secretly a superhero',
    type: 'Trope',
    number: '10',
    structure: 'Discovery Arc',
    googleDocLink: 'https://docs.google.com/document/d/example17',
    status: 'Under Review',
    submittedOn: '4/1/2025',
    userId: 1
  },
  {
    id: 18,
    title: '[TLDR] Why I quit my dream job',
    type: 'TLDR',
    number: '12',
    structure: 'Decision Journey',
    googleDocLink: 'https://docs.google.com/document/d/example18',
    status: 'Pending',
    submittedOn: '4/19/2025',
    userId: 1
  }
];

// Get all submissions for authenticated user with real InfluxDB data
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const userId = req.user.id;

    console.log('📝 Getting submissions for user ID:', userId, 'Range:', range);

    // Get writer information from PostgreSQL
    let writerId = null;
    try {
      const pool = require('../config/database');
      const writerQuery = `
        SELECT w.id as writer_id
        FROM writer w
        WHERE w.login_id = $1
      `;
      const writerResult = await pool.query(writerQuery, [userId]);
      if (writerResult.rows.length > 0) {
        writerId = writerResult.rows[0].writer_id;
        console.log('✅ Found writer ID:', writerId, 'for submissions');
      } else {
        console.log('⚠️ No writer found for user:', userId);
      }
    } catch (dbError) {
      console.error('❌ Error getting writer ID for submissions:', dbError);
    }

    if (influxService) {
      try {
        // Get real submissions from InfluxDB filtered by writer
        const realSubmissions = await influxService.getWriterSubmissions(writerId, range);

        // Transform InfluxDB data to match frontend expectations
        const transformedSubmissions = realSubmissions.map((submission, index) => ({
          id: parseInt(submission.id) || index + 1,
          title: submission.title,
          type: 'YouTube Short', // Based on your data structure
          number: submission.video_id,
          structure: 'Video Content',
          googleDocLink: submission.url,
          status: submission.status, // 'Posted' for published videos
          submittedOn: new Date(submission.submittedOn).toLocaleDateString(),
          userId: req.user.userId,
          views: submission.views,
          writer_name: submission.writer_name,
          video_id: submission.video_id
        }));

        console.log('📝 Real submissions data sent:', {
          count: transformedSubmissions.length,
          range
        });

        res.json(transformedSubmissions);
        return;
      } catch (influxError) {
        console.error('❌ InfluxDB error in submissions, falling back to dummy data:', influxError);
      }
    }

    // Fallback to dummy data if InfluxDB fails
    const userSubmissions = submissions.filter(s => s.userId === req.user.userId);
    res.json(userSubmissions);
  } catch (error) {
    console.error('❌ Submissions endpoint error:', error);
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
