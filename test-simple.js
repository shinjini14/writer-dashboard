const { InfluxDB } = require('@influxdata/influxdb-client');

// Your InfluxDB credentials
const url = 'https://us-east-1-1.aws.cloud2.influxdata.com';
const token = 'ojNizGw1U0VID3ltz1khIx2aOQAHG0gIFEbR7VqVk6Ns23fzXOcJG-JxPkGKWL6lluFBQKdagMRbHm6-2iVHSw==';
const org = 'engineering team';
const bucket = 'youtube_api';

console.log('🔍 Testing simple InfluxDB query...');

async function testSimpleQuery() {
  try {
    const client = new InfluxDB({ url, token });
    const queryApi = client.getQueryApi(org);
    
    console.log('✅ InfluxDB client created successfully');
    
    // Very simple query - just get a few recent records
    console.log('\n📊 Getting recent data...');
    const simpleQuery = `
      from(bucket: "${bucket}")
        |> range(start: -1h)
        |> filter(fn: (r) => r._measurement == "views")
        |> limit(n: 5)
    `;
    
    const results = [];
    let rowCount = 0;
    
    await queryApi.queryRows(simpleQuery, {
      next(row, tableMeta) {
        rowCount++;
        const o = tableMeta.toObject(row);
        results.push(o);
        console.log(`📈 Row ${rowCount}:`, {
          time: o._time,
          video_id: o.video_id,
          writer_name: o.writer_name,
          views: o._value,
          url: o.url ? o.url.substring(0, 50) + '...' : 'No URL'
        });
      },
      error(error) {
        console.error('❌ Query error:', error);
      },
      complete() {
        console.log(`✅ Query completed. Found ${rowCount} records in the last hour.`);
        
        if (rowCount === 0) {
          console.log('⚠️ No data found in the last hour. Let\'s try a longer time range...');
          testLongerRange();
        } else {
          console.log('🎉 Great! Your InfluxDB has recent data. The dashboard integration should work!');
        }
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function testLongerRange() {
  try {
    const client = new InfluxDB({ url, token });
    const queryApi = client.getQueryApi(org);
    
    console.log('\n📊 Trying longer time range (24 hours)...');
    const longerQuery = `
      from(bucket: "${bucket}")
        |> range(start: -24h)
        |> filter(fn: (r) => r._measurement == "views")
        |> limit(n: 3)
    `;
    
    let rowCount = 0;
    
    await queryApi.queryRows(longerQuery, {
      next(row, tableMeta) {
        rowCount++;
        const o = tableMeta.toObject(row);
        console.log(`📈 Sample data ${rowCount}:`, {
          time: o._time,
          video_id: o.video_id,
          writer_name: o.writer_name,
          views: o._value
        });
      },
      error(error) {
        console.error('❌ Longer query error:', error);
      },
      complete() {
        console.log(`✅ Found ${rowCount} records in the last 24 hours.`);
        if (rowCount > 0) {
          console.log('🎉 Perfect! Your data is available. The dashboard will work with real data!');
        } else {
          console.log('⚠️ No recent data found. You may need to check your data ingestion.');
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Longer range test failed:', error);
  }
}

testSimpleQuery().then(() => {
  console.log('\n🏁 Simple test completed');
  setTimeout(() => process.exit(0), 2000); // Give time for async operations
});
