// Test script to check if analytics routes can be loaded
console.log('🧪 Testing analytics routes loading...');

try {
  const analyticsRoutes = require('./routes/analytics');
  console.log('✅ Analytics routes loaded successfully');
  console.log('📊 Analytics routes type:', typeof analyticsRoutes);
  console.log('📊 Analytics routes keys:', Object.keys(analyticsRoutes));
} catch (error) {
  console.error('❌ Error loading analytics routes:', error);
  console.error('❌ Error stack:', error.stack);
}

console.log('🧪 Test completed');
