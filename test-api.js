const http = require('http');

function testAPI(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runTests() {
  console.log('🔍 Testing API endpoints...');

  try {
    console.log('\n1. Testing health endpoint...');
    const health = await testAPI('/api/health');
    console.log('✅ Health:', health);
  } catch (error) {
    console.log('❌ Health error:', error.message);
  }

  try {
    console.log('\n2. Testing InfluxDB connection...');
    const influxTest = await testAPI('/api/influx/test');
    console.log('✅ InfluxDB test:', influxTest);
  } catch (error) {
    console.log('❌ InfluxDB test error:', error.message);
  }

  try {
    console.log('\n3. Testing InfluxDB sample data...');
    const sampleData = await testAPI('/api/influx/sample?limit=5');
    console.log('✅ Sample data:', sampleData);
  } catch (error) {
    console.log('❌ Sample data error:', error.message);
  }

  try {
    console.log('\n4. Testing InfluxDB explore...');
    const explore = await testAPI('/api/influx/explore');
    console.log('✅ Explore:', explore);
  } catch (error) {
    console.log('❌ Explore error:', error.message);
  }

  try {
    console.log('\n5. Testing comprehensive data exploration...');
    const comprehensive = await testAPI('/api/data-explorer/comprehensive');
    console.log('✅ Comprehensive exploration:', JSON.stringify(comprehensive, null, 2));
  } catch (error) {
    console.log('❌ Comprehensive exploration error:', error.message);
  }

  try {
    console.log('\n6. Testing data structure recommendations...');
    const recommendations = await testAPI('/api/data-explorer/recommendations');
    console.log('✅ Recommendations:', JSON.stringify(recommendations, null, 2));
  } catch (error) {
    console.log('❌ Recommendations error:', error.message);
  }

  // Test with a dummy JWT token for protected endpoints
  const dummyToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImlhdCI6MTYzMDAwMDAwMH0.test';

  try {
    console.log('\n7. Testing analytics with real data...');
    const analytics = await testAPIWithAuth('/api/analytics?range=30d', dummyToken);
    console.log('✅ Analytics:', analytics);
  } catch (error) {
    console.log('❌ Analytics error:', error.message);
  }

  try {
    console.log('\n8. Testing channel analytics with real data...');
    const channelAnalytics = await testAPIWithAuth('/api/analytics/channel?range=last28days', dummyToken);
    console.log('✅ Channel Analytics:', channelAnalytics);
  } catch (error) {
    console.log('❌ Channel Analytics error:', error.message);
  }

  try {
    console.log('\n9. Testing submissions with real data...');
    const submissions = await testAPIWithAuth('/api/submissions?range=30d', dummyToken);
    console.log('✅ Submissions:', submissions);
  } catch (error) {
    console.log('❌ Submissions error:', error.message);
  }
}

function testAPIWithAuth(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

runTests().then(() => {
  console.log('\n🏁 API tests completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
