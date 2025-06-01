// Simple test endpoint for Vercel
export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({
      status: 'success',
      message: 'Vercel API is working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
