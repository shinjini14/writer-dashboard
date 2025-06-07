// QA script for analytics data - Raw Views
// Run with: node qa-analytics-data.js "Shannen Santiago" 30
require('dotenv').config();

const { BigQuery } = require('@google-cloud/bigquery');

// Parse command line arguments
const writerName = process.argv[2] || "Shannen Santiago";
const days = parseInt(process.argv[3] || "30");
const limit = parseInt(process.argv[4] || "100");

// Initialize BigQuery
let bigquery = null;
try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    bigquery = new BigQuery({
      projectId: credentials.project_id,
      credentials: credentials,
    });
    console.log('✅ BigQuery client initialized');
  } else {
    console.log('⚠️ Using application default credentials');
    bigquery = new BigQuery();
  }
} catch (error) {
  console.error('❌ BigQuery setup failed:', error.message);
  process.exit(1);
}

async function qaRawViewsData() {
  try {
    console.log(`🔍 QA Raw Views Data for writer: "${writerName}" over past ${days} days (limit: ${limit} rows)`);
    console.log('=' .repeat(80));

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const finalStartDate = startDate.toISOString().split('T')[0];
    const finalEndDate = endDate.toISOString().split('T')[0];

    console.log(`📅 Date Range: ${finalStartDate} to ${finalEndDate}`);

    // Query for raw views data
    console.log('\n📊 CHECKING RAW VIEWS DATA:');
    const rawViewsQuery = `
      SELECT
        est_date,
        video_id,
        video_title,
        views,
        account_name
      FROM \`speedy-web-461014-g3.dbt_youtube_analytics.youtube_video_report_historical\`
      WHERE writer_name = @writer_name
        AND est_date BETWEEN @start_date AND @end_date
        AND writer_name IS NOT NULL
        AND views IS NOT NULL
      ORDER BY est_date DESC, views DESC
      LIMIT @limit;
    `;

    console.log(`🔍 Query:\n${rawViewsQuery}`);
    console.log(`🔍 Params: writer_name=${writerName}, start_date=${finalStartDate}, end_date=${finalEndDate}, limit=${limit}`);

    const [rawViewsRows] = await bigquery.query({
      query: rawViewsQuery,
      params: {
        writer_name: writerName,
        start_date: finalStartDate,
        end_date: finalEndDate,
        limit: limit
      }
    });

    console.log(`\n📋 Raw Views Results (${rawViewsRows.length} rows):`);
    console.table(rawViewsRows);

    // Calculate totals
    const totalViews = rawViewsRows.reduce((sum, row) => sum + parseInt(row.views), 0);
    const uniqueVideos = new Set(rawViewsRows.map(row => row.video_id)).size;
    const uniqueDates = new Set(rawViewsRows.map(row => row.est_date)).size;

    console.log('\n📊 Summary:');
    console.log(`   Total Rows: ${rawViewsRows.length}`);
    console.log(`   Total Views (in sample): ${totalViews.toLocaleString()}`);
    console.log(`   Unique Videos: ${uniqueVideos}`);
    console.log(`   Unique Dates: ${uniqueDates}`);
    
    // Group by date to see daily totals
    console.log('\n📊 DAILY TOTALS:');
    const dailyTotalsQuery = `
      SELECT
        est_date,
        COUNT(DISTINCT video_id) AS unique_videos,
        SUM(CAST(views AS INT64)) AS total_views
      FROM \`speedy-web-461014-g3.dbt_youtube_analytics.youtube_video_report_historical\`
      WHERE writer_name = @writer_name
        AND est_date BETWEEN @start_date AND @end_date
        AND writer_name IS NOT NULL
        AND views IS NOT NULL
      GROUP BY est_date
      ORDER BY est_date DESC
      LIMIT 30;
    `;

    const [dailyTotals] = await bigquery.query({
      query: dailyTotalsQuery,
      params: {
        writer_name: writerName,
        start_date: finalStartDate,
        end_date: finalEndDate
      }
    });

    console.log(`\n📋 Daily Totals (${dailyTotals.length} days):`);
    console.table(dailyTotals);

    console.log('\n✅ QA completed!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

qaRawViewsData();