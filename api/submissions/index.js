// Vercel serverless function for submissions
let submissions = [
  {
    id: 1,
    title: "The Hero's Journey in Modern Cinema",
    type: "Original",
    number: "1",
    structure: "Three Act Structure",
    googleDocLink: "https://docs.google.com/document/d/example1",
    status: "pending",
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "Comedy Tropes That Never Get Old",
    type: "Trope",
    number: "2",
    structure: "Save the Cat",
    googleDocLink: "https://docs.google.com/document/d/example2",
    status: "accepted",
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

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

  if (req.method === 'GET') {
    // Return all submissions
    res.status(200).json(submissions);
  } else if (req.method === 'POST') {
    // Create new submission
    const { title, type, number, structure, googleDocLink } = req.body;

    if (!title || !type || !number || !structure || !googleDocLink) {
      return res.status(400).json({
        message: 'All fields are required'
      });
    }

    const newSubmission = {
      id: submissions.length + 1,
      title,
      type,
      number,
      structure,
      googleDocLink,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    submissions.unshift(newSubmission);

    res.status(201).json(newSubmission);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};
