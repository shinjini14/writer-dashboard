const jwt = require('jsonwebtoken');

// Mock user database
const users = [
  {
    id: 1,
    email: 'writer@example.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Steven Abreu',
    writerId: 74,
    avatar: 'S'
  }
];

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

// Authentication middleware
function authenticateToken(req) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    return decoded;
  } catch (error) {
    return null;
  }
}

// Vercel serverless function for submissions
module.exports = function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Authenticate user
  const user = authenticateToken(req);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const userSubmissions = submissions.filter(s => s.userId === user.userId);
      res.json(userSubmissions);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  } else if (req.method === 'POST') {
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
        userId: user.userId
      };

      submissions.push(newSubmission);
      res.status(201).json(newSubmission);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
