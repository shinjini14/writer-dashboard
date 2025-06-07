// Run this from the server directory: cd server && node ../debug-data-script.js
require('dotenv').config();

const { Pool } = require('pg');
const { BigQuery } = require('@google-cloud/bigquery');
const { InfluxDB } = require('@influxdata/influxdb-client');

// Database connections
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// BigQuery setup
let bigquery = null;
try {
  if (process.env.BIGQUERY_CREDENTIALS) {
    const credentials = JSON.parse(process.env.BIGQUERY_CREDENTIALS);
    bigquery = new BigQuery({
      projectId: credentials.project_id,
      credentials: credentials,
    });
    console.log('✅ BigQuery client initialized');
  }
} catch (error) {
  console.error('❌ BigQuery setup failed:', error.message);
}

// InfluxDB setup
let influxDB = null;
let queryApi = null;
try {
  if (process.env.INFLUXDB_URL && process.env.INFLUXDB_TOKEN) {
    influxDB = new InfluxDB({
      url: process.env.INFLUXDB_URL,
      token: process.env.INFLUXDB_TOKEN,
    });
    queryApi = influxDB.getQueryApi(process.env.INFLUXDB_ORG);
    console.log('✅ InfluxDB client initialized');
  }
} catch (error) {
  console.error('❌ InfluxDB setup failed:', error.message);
}

async function analyzeWriterData(writerId = 110) {
  console.log(`\n🔍 ANALYZING DATA FOR WRITER ID: ${writerId}`);
  console.log('=' .repeat(60));

  try {
    // Get writer info
    const writerQuery = `SELECT id, name, login_id FROM writer WHERE id = $1`;
    const { rows: writerRows } = await pool.query(writerQuery, [writerId]);
    
    if (writerRows.length === 0) {
      console.log(`❌ Writer ${writerId} not found`);
      return;
    }
    
    const writer = writerRows[0];
    console.log(`📝 Writer: ${writer.name} (ID: ${writer.id}, Login: ${writer.login_id})`);

    // Date range: 30 days including June 5th
    const endDate = '2025-06-05'; // June 5th
    const startDate = '2025-05-06'; // 30 days before June 5th
    console.log(`📅 Date Range: ${startDate} to ${endDate} (30 days including June 5th)`);

    const results = {
      writer: writer,
      dateRange: { start: startDate, end: endDate },
      influxData: null,
      bigQueryData: null,
      errors: []
    };

    // 1. INFLUXDB DATA
    console.log('\n📊 CHECKING INFLUXDB DATA...');
    if (queryApi) {
      try {
        // Calculate days for InfluxDB range
        const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
        const timeRange = `${daysDiff + 5}d`; // Add buffer
        
        console.log(`🔍 InfluxDB time range: ${timeRange}`);

        // Query for daily analytics
        const influxQuery = `
          from(bucket: "youtube_api")
  |> range(start: -30d)     // adjust window as needed
  |> limit(n: 10)           // show first 10 points
  |> yield(name: "sample rows")

        `;

        console.log(`🔍 InfluxDB Query:\n${influxQuery}`);

        const influxResults = [];
        await new Promise((resolve, reject) => {
          queryApi.queryRows(influxQuery, {
            next(row, tableMeta) {
              const o = tableMeta.toObject(row);
              const dateStr = new Date(o._time).toISOString().split('T')[0];
              
              // Only include dates in our range
              if (dateStr >= startDate && dateStr <= endDate) {
                influxResults.push({
                  date: dateStr,
                  views: parseInt(o._value || 0),
                  rawTime: o._time
                });
              }
            },
            error(error) {
              console.error('❌ InfluxDB query error:', error);
              reject(error);
            },
            complete() {
              console.log(`✅ InfluxDB query completed: ${influxResults.length} records in date range`);
              resolve();
            }
          });
        });

        // Sort by date
        influxResults.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const influxTotal = influxResults.reduce((sum, day) => sum + day.views, 0);
        
        results.influxData = {
          totalRecords: influxResults.length,
          totalViews: influxTotal,
          dailyData: influxResults,
          firstDay: influxResults[0] || null,
          lastDay: influxResults[influxResults.length - 1] || null,
          avgDaily: influxResults.length > 0 ? Math.round(influxTotal / influxResults.length) : 0
        };

        console.log(`📊 InfluxDB Summary:`);
        console.log(`   Total Records: ${influxResults.length}`);
        console.log(`   Total Views: ${influxTotal.toLocaleString()}`);
        console.log(`   Avg Daily: ${results.influxData.avgDaily.toLocaleString()}`);
        console.log(`   First Day: ${results.influxData.firstDay?.date} (${results.influxData.firstDay?.views.toLocaleString()} views)`);
        console.log(`   Last Day: ${results.influxData.lastDay?.date} (${results.influxData.lastDay?.views.toLocaleString()} views)`);

      } catch (influxError) {
        console.error('❌ InfluxDB error:', influxError.message);
        results.errors.push(`InfluxDB: ${influxError.message}`);
      }
    } else {
      console.log('⚠️ InfluxDB not available');
      results.errors.push('InfluxDB: Not available');
    }

    // 2. BIGQUERY DATA
    console.log('\n📊 CHECKING BIGQUERY DATA...');
    if (bigquery) {
      try {
        const projectId = process.env.BIGQUERY_PROJECT_ID || "speedy-web-461014-g3";
        const dataset = "dbt_youtube_analytics";
        const table = "youtube_metadata_historical";

        const bigQueryQuery = `
          SELECT
            snapshot_date AS time,
            SUM(CAST(statistics_view_count AS INT64)) AS views
          FROM \`${projectId}.${dataset}.${table}\`
          WHERE writer_id = @writer_id
            AND snapshot_date BETWEEN @start_date AND @end_date
            AND writer_id IS NOT NULL
            AND statistics_view_count IS NOT NULL
          GROUP BY snapshot_date
          ORDER BY snapshot_date ASC;
        `;

        console.log(`🔍 BigQuery Query:\n${bigQueryQuery}`);
        console.log(`🔍 BigQuery Params: writer_id=${writerId}, start_date=${startDate}, end_date=${endDate}`);

        const [bigQueryRows] = await bigquery.query({
          query: bigQueryQuery,
          params: {
            writer_id: parseInt(writerId),
            start_date: startDate,
            end_date: endDate
          }
        });

        const bigQueryRaw = bigQueryRows.map(row => ({
          date: row.time.value,
          absoluteViews: parseInt(row.views || 0)
        }));

        // Calculate daily increases (showing the problem)
        const bigQueryIncreases = [];
        for (let i = 0; i < bigQueryRaw.length; i++) {
          const currentDay = bigQueryRaw[i];
          let dailyIncrease = 0;
          
          if (i === 0) {
            // THIS IS THE PROBLEM - using absolute count as increase
            dailyIncrease = currentDay.absoluteViews;
          } else {
            const previousDay = bigQueryRaw[i - 1];
            dailyIncrease = currentDay.absoluteViews - previousDay.absoluteViews;
          }
          
          bigQueryIncreases.push({
            date: currentDay.date,
            absoluteViews: currentDay.absoluteViews,
            dailyIncrease: Math.max(0, dailyIncrease),
            isFirstDay: i === 0
          });
        }

        const totalFromIncreases = bigQueryIncreases.reduce((sum, day) => sum + day.dailyIncrease, 0);

        results.bigQueryData = {
          totalRecords: bigQueryRows.length,
          rawData: bigQueryRaw,
          increasesData: bigQueryIncreases,
          totalFromIncreases: totalFromIncreases,
          firstDayProblem: bigQueryIncreases.length > 0 ? bigQueryIncreases[0].dailyIncrease : 0,
          firstDay: bigQueryIncreases[0] || null,
          lastDay: bigQueryIncreases[bigQueryIncreases.length - 1] || null
        };

        console.log(`📊 BigQuery Summary:`);
        console.log(`   Total Records: ${bigQueryRows.length}`);
        console.log(`   Total from Increases: ${totalFromIncreases.toLocaleString()}`);
        console.log(`   First Day Problem: ${results.bigQueryData.firstDayProblem.toLocaleString()} (should be much smaller)`);
        console.log(`   First Day: ${results.bigQueryData.firstDay?.date} (${results.bigQueryData.firstDay?.absoluteViews.toLocaleString()} absolute, ${results.bigQueryData.firstDay?.dailyIncrease.toLocaleString()} increase)`);
        console.log(`   Last Day: ${results.bigQueryData.lastDay?.date} (${results.bigQueryData.lastDay?.absoluteViews.toLocaleString()} absolute, ${results.bigQueryData.lastDay?.dailyIncrease.toLocaleString()} increase)`);

      } catch (bigQueryError) {
        console.error('❌ BigQuery error:', bigQueryError.message);
        results.errors.push(`BigQuery: ${bigQueryError.message}`);
      }
    } else {
      console.log('⚠️ BigQuery not available');
      results.errors.push('BigQuery: Not available');
    }

    // 3. COMPARISON
    console.log('\n🔍 DATA COMPARISON:');
    console.log('=' .repeat(40));
    
    if (results.influxData && results.bigQueryData) {
      console.log(`InfluxDB Total Views: ${results.influxData.totalViews.toLocaleString()}`);
      console.log(`BigQuery Total Views: ${results.bigQueryData.totalFromIncreases.toLocaleString()}`);
      console.log(`Difference: ${Math.abs(results.influxData.totalViews - results.bigQueryData.totalFromIncreases).toLocaleString()}`);
      console.log(`BigQuery First Day Issue: ${results.bigQueryData.firstDayProblem.toLocaleString()} (likely the problem)`);
    }

    if (results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      results.errors.forEach(error => console.log(`   ${error}`));
    }

    return results;

  } catch (error) {
    console.error('❌ Script error:', error);
    throw error;
  }
}

// Run the analysis
async function main() {
  try {
    const writerId = process.argv[2] ? parseInt(process.argv[2]) : 110;
    await analyzeWriterData(writerId);
  } catch (error) {
    console.error('❌ Main error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
