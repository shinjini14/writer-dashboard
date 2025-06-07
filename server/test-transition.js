const { Pool } = require('pg');
const { BigQuery } = require('@google-cloud/bigquery');
require('dotenv').config();

// Test the June 5th to June 6th transition specifically
async function testTransition() {
  console.log('🧪 Testing June 5th → June 6th Transition');
  console.log('==========================================');

  try {
    const writerId = 110;

    // Get writer name
    const pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });

    const writerQuery = `SELECT name FROM writer WHERE id = $1`;
    const { rows: writerRows } = await pool.query(writerQuery, [writerId]);
    const writerName = writerRows[0]?.name || 'Unknown Writer';
    
    console.log(`✅ Testing with writer: ${writerName} (ID: ${writerId})`);

    // Step 1: Get June 5th cumulative total from InfluxDB
    console.log('\n📊 STEP 1: Get June 5th cumulative total from InfluxDB');
    
    const { InfluxDB } = require('@influxdata/influxdb-client');
    const influxDB = new InfluxDB({
      url: process.env.INFLUXDB_URL,
      token: process.env.INFLUXDB_TOKEN,
    });
    const queryApi = influxDB.getQueryApi(process.env.INFLUXDB_ORG);

    const june5thQuery = `
      from(bucket: "youtube_api")
        |> range(start: 2025-06-05T00:00:00Z, stop: 2025-06-06T00:00:00Z)
        |> filter(fn: (r) => r._measurement == "views")
        |> filter(fn: (r) => r._field == "views")
        |> filter(fn: (r) => r.writer_id == "${writerId}" or r.writer_id == ${writerId})
        |> group(columns: ["video_id"])
        |> last()
        |> group()
        |> sum()
    `;

    console.log(`🔍 June 5th cumulative query:\n${june5thQuery}`);

    let june5thCumulative = 0;
    await new Promise((resolve, reject) => {
      queryApi.queryRows(june5thQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          june5thCumulative = parseInt(o._value || 0);
          console.log(`📊 June 5th cumulative total: ${june5thCumulative.toLocaleString()}`);
        },
        error(error) {
          console.error('❌ June 5th cumulative query error:', error);
          reject(error);
        },
        complete() {
          console.log(`✅ June 5th cumulative query completed`);
          resolve();
        }
      });
    });

    // Step 2: Get June 6th cumulative total from BigQuery
    console.log('\n📊 STEP 2: Get June 6th cumulative total from BigQuery');
    
    const bigquery = new BigQuery({
      projectId: process.env.BIGQUERY_PROJECT_ID,
      keyFilename: process.env.BIGQUERY_KEY_FILE
    });

    const projectId = process.env.BIGQUERY_PROJECT_ID || "speedy-web-461014-g3";
    const analyticsDataset = process.env.BIGQUERY_ANALYTICS_DATASET || "dbt_youtube_analytics";
    const analyticsTable = process.env.BIGQUERY_ANALYTICS_TABLE || "youtube_metadata_historical";

    const june6thQuery = `
      SELECT
        snapshot_date AS time,
        SUM(CAST(statistics_view_count AS INT64)) AS views
      FROM \`${projectId}.${analyticsDataset}.${analyticsTable}\`
      WHERE writer_id = @writer_id
        AND snapshot_date = '2025-06-06'
        AND writer_id IS NOT NULL
        AND statistics_view_count IS NOT NULL
      GROUP BY snapshot_date
      ORDER BY snapshot_date ASC;
    `;

    console.log(`🔍 June 6th BigQuery query:\n${june6thQuery}`);

    const [june6thRows] = await bigquery.query({
      query: june6thQuery,
      params: {
        writer_id: parseInt(writerId)
      }
    });

    let june6thCumulative = 0;
    if (june6thRows.length > 0) {
      june6thCumulative = parseInt(june6thRows[0].views || 0);
      console.log(`📊 June 6th cumulative total: ${june6thCumulative.toLocaleString()}`);
    } else {
      console.log(`⚠️ No June 6th data found in BigQuery`);
    }

    // Step 3: Calculate the transition
    console.log('\n📊 STEP 3: Calculate June 6th transition');
    
    const june6thIncrease = june6thCumulative - june5thCumulative;
    
    console.log(`📈 TRANSITION CALCULATION:`);
    console.log(`   June 5th (InfluxDB): ${june5thCumulative.toLocaleString()} cumulative views`);
    console.log(`   June 6th (BigQuery): ${june6thCumulative.toLocaleString()} cumulative views`);
    console.log(`   June 6th increase: ${june6thCumulative.toLocaleString()} - ${june5thCumulative.toLocaleString()} = ${june6thIncrease.toLocaleString()}`);

    // Step 4: Validate the result
    console.log('\n📊 STEP 4: Validate transition result');
    
    if (june6thIncrease < 0) {
      console.log(`❌ PROBLEM: Negative increase (${june6thIncrease.toLocaleString()}) - BigQuery total is less than InfluxDB total`);
    } else if (june6thIncrease > 10000000) {
      console.log(`❌ PROBLEM: Unrealistic increase (${june6thIncrease.toLocaleString()}) - too high for one day`);
    } else if (june6thIncrease > 1000000) {
      console.log(`⚠️ WARNING: High increase (${june6thIncrease.toLocaleString()}) - verify this is realistic`);
    } else {
      console.log(`✅ GOOD: Realistic daily increase (${june6thIncrease.toLocaleString()})`);
    }

    // Step 5: Compare with our corrected InfluxDB daily increases
    console.log('\n📊 STEP 5: Compare with InfluxDB daily increases');
    
    const InfluxService = require('./services/influxService');
    const influxService = new InfluxService();
    
    const influxResults = await influxService.getDashboardAnalytics('7d', writerId);
    const june5thInfluxIncrease = influxResults.find(day => 
      day.date.toISOString().split('T')[0] === '2025-06-05'
    );
    
    if (june5thInfluxIncrease) {
      console.log(`📊 June 5th InfluxDB daily increase: ${june5thInfluxIncrease.views.toLocaleString()}`);
      console.log(`📊 June 6th transition increase: ${june6thIncrease.toLocaleString()}`);
      
      const ratio = june6thIncrease / june5thInfluxIncrease.views;
      console.log(`📊 Ratio (June 6th / June 5th): ${ratio.toFixed(2)}x`);
      
      if (ratio > 10) {
        console.log(`⚠️ WARNING: June 6th is ${ratio.toFixed(1)}x higher than June 5th - may indicate transition issue`);
      } else {
        console.log(`✅ GOOD: Reasonable ratio between consecutive days`);
      }
    }

    await pool.end();

    console.log('\n🎉 TRANSITION TEST COMPLETED');
    console.log('============================');
    console.log(`✅ June 5th InfluxDB cumulative: ${june5thCumulative.toLocaleString()}`);
    console.log(`✅ June 6th BigQuery cumulative: ${june6thCumulative.toLocaleString()}`);
    console.log(`✅ June 6th calculated increase: ${june6thIncrease.toLocaleString()}`);

  } catch (error) {
    console.error('❌ Transition test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testTransition();
