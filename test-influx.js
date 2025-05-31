const { InfluxDB } = require('@influxdata/influxdb-client');

// Your InfluxDB credentials
const url = 'https://us-east-1-1.aws.cloud2.influxdata.com';
const token = 'ojNizGw1U0VID3ltz1khIx2aOQAHG0gIFEbR7VqVk6Ns23fzXOcJG-JxPkGKWL6lluFBQKdagMRbHm6-2iVHSw==';
const org = 'engineering team';
const bucket = 'youtube_api';

console.log('🔍 Testing InfluxDB connection...');
console.log('URL:', url);
console.log('Org:', org);
console.log('Bucket:', bucket);
console.log('Token:', token ? 'SET' : 'NOT SET');

async function testConnection() {
  try {
    const client = new InfluxDB({ url, token });
    const queryApi = client.getQueryApi(org);

    console.log('✅ InfluxDB client created successfully');

    // Test with a simple query - look for data in the last 30 days
    const query = `
      from(bucket: "${bucket}")
        |> range(start: -30d)
        |> limit(n: 10)
    `;

    console.log('🔍 Testing query...');

    let hasData = false;
    await queryApi.queryRows(query, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        console.log('📊 Sample data point:', o);
        hasData = true;
      },
      error(error) {
        console.error('❌ Query error:', error);
      },
      complete() {
        console.log('✅ Query completed. Has data:', hasData);
      }
    });

    // Get measurements
    console.log('🔍 Getting measurements...');
    const measurementsQuery = `
      import "influxdata/influxdb/schema"
      schema.measurements(bucket: "${bucket}")
    `;

    const measurements = [];
    await queryApi.queryRows(measurementsQuery, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        measurements.push(o._value);
      },
      error(error) {
        console.error('❌ Measurements error:', error);
      },
      complete() {
        console.log('📊 Available measurements:', measurements);
      }
    });

    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error);
    return false;
  }
}

testConnection().then(success => {
  console.log('🏁 Test completed. Success:', success);
  process.exit(success ? 0 : 1);
});
