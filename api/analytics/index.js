// Vercel serverless function for analytics
module.exports = function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Mock analytics data
  const analyticsData = {
    totalSubmissions: 45,
    acceptedSubmissions: 32,
    rejectedSubmissions: 8,
    pendingSubmissions: 5,
    acceptanceRate: 71,
    monthlySubmissions: [
      { month: 'January', submissions: 12, accepted: 9 },
      { month: 'February', submissions: 15, accepted: 11 },
      { month: 'March', submissions: 18, accepted: 12 }
    ],
    submissionsByType: [
      { type: 'Original', count: 20 },
      { type: 'Trope', count: 15 },
      { type: 'TLDR', count: 10 }
    ],
    recentActivity: [
      {
        date: '2024-01-15',
        action: 'Submission Accepted',
        title: 'The Hero\'s Journey in Modern Cinema'
      },
      {
        date: '2024-01-14',
        action: 'New Submission',
        title: 'Comedy Tropes That Never Get Old'
      },
      {
        date: '2024-01-13',
        action: 'Submission Rejected',
        title: 'Outdated Romance Clichés'
      }
    ]
  };

  res.status(200).json(analyticsData);
};
