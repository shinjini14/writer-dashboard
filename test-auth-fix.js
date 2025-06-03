const axios = require('axios');

async function testAuthenticationFix() {
  const baseUrl = 'http://localhost:5001';
  
  console.log('🔐 Testing authentication fix...');
  
  // Test 1: Valid credentials (should work)
  console.log('\n1️⃣ Testing with valid credentials...');
  try {
    const validResponse = await axios.post(`${baseUrl}/api/auth/login`, {
      username: 'shannen',  // Replace with actual valid username
      password: 'shannen123'  // Replace with actual valid password
    });
    
    console.log('✅ Valid login successful:', {
      success: validResponse.data.success,
      username: validResponse.data.username,
      role: validResponse.data.role,
      hasToken: !!validResponse.data.token
    });
  } catch (error) {
    console.log('❌ Valid login failed:', error.response?.data || error.message);
  }
  
  // Test 2: Invalid username (should fail)
  console.log('\n2️⃣ Testing with invalid username...');
  try {
    const invalidUserResponse = await axios.post(`${baseUrl}/api/auth/login`, {
      username: 'nonexistentuser',
      password: 'anypassword'
    });
    
    console.log('❌ SECURITY ISSUE: Invalid username login succeeded!', invalidUserResponse.data);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Invalid username properly rejected:', error.response.data.message);
    } else {
      console.log('⚠️ Unexpected error:', error.response?.data || error.message);
    }
  }
  
  // Test 3: Valid username, invalid password (should fail)
  console.log('\n3️⃣ Testing with valid username but invalid password...');
  try {
    const invalidPassResponse = await axios.post(`${baseUrl}/api/auth/login`, {
      username: 'shannen',  // Replace with actual valid username
      password: 'wrongpassword'
    });
    
    console.log('❌ SECURITY ISSUE: Invalid password login succeeded!', invalidPassResponse.data);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Invalid password properly rejected:', error.response.data.message);
    } else {
      console.log('⚠️ Unexpected error:', error.response?.data || error.message);
    }
  }
  
  // Test 4: Empty credentials (should fail)
  console.log('\n4️⃣ Testing with empty credentials...');
  try {
    const emptyResponse = await axios.post(`${baseUrl}/api/auth/login`, {
      username: '',
      password: ''
    });
    
    console.log('❌ SECURITY ISSUE: Empty credentials login succeeded!', emptyResponse.data);
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Empty credentials properly rejected:', error.response.data.message);
    } else {
      console.log('⚠️ Unexpected error:', error.response?.data || error.message);
    }
  }
  
  // Test 5: Missing fields (should fail)
  console.log('\n5️⃣ Testing with missing fields...');
  try {
    const missingResponse = await axios.post(`${baseUrl}/api/auth/login`, {
      username: 'test'
      // password missing
    });
    
    console.log('❌ SECURITY ISSUE: Missing password login succeeded!', missingResponse.data);
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Missing fields properly rejected:', error.response.data.message);
    } else {
      console.log('⚠️ Unexpected error:', error.response?.data || error.message);
    }
  }
  
  console.log('\n🔐 Authentication test completed!');
}

// Run the test
testAuthenticationFix().catch(console.error);
