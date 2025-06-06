const { InfluxDB } = require('@influxdata/influxdb-client');

async function diagnoseInflux() {
  console.log('🔍 Diagnosing InfluxDB youtube_api bucket...');
  
  require('dotenv').config();
  
  const influxDB = new InfluxDB({
    url: process.env.INFLUXDB_URL,
    token: process.env.INFLUXDB_TOKEN,
  });
  
  const queryApi = influxDB.getQueryApi(process.env.INFLUXDB_ORG);
  
  // Check what writer names exist
  console.log('\n1. Checking available writer names...');
  
  const writerNamesQuery = `
    from(bucket: "youtube_api")
      |> range(start: -30d)
      |> filter(fn: (r) => exists r.writer_name)
      |> group(columns: ["writer_name"])
      |> distinct(column: "writer_name")
      |> limit(n: 20)
  `;
  
  console.log('Query:', writerNamesQuery);
  
  try {
    const writers = [];
    await queryApi.queryRows(writerNamesQuery, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        writers.push(o.writer_name);
      },
      error(error) {
        console.error('❌ Error:', error.message);
      },
      complete() {
        console.log('✅ Available writers:', writers);
      },
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

diagnoseInflux();
