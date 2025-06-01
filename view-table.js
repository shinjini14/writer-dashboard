// Simple BigQuery Table Viewer
// Just run: node view-table.js

const { BigQuery } = require('./server/node_modules/@google-cloud/bigquery');
require('dotenv').config();

console.log('🔍 Viewing writer_daily_breakdown...\n');

// Setup BigQuery using .env credentials only
const setupBigQuery = () => {
  try {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON not found in .env file');
    }

    console.log('📁 Using credentials from .env file...');
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

    const bigquery = new BigQuery({
      credentials: credentials,
      projectId: "speedy-web-461014-g3",
      location: "US",
    });

    console.log('✅ BigQuery client initialized');
    return bigquery;
  } catch (error) {
    console.error("❌ BigQuery setup failed:", error.message);
    process.exit(1);
  }
};

const viewTable = async () => {
  const bigquery = setupBigQuery();

  try {
    console.log('📊 Checking for writer_daily_breakdown...');

    // Check if it exists as table or view
    const checkQuery = `
      SELECT table_name, table_type
      FROM \`speedy-web-461014-g3.dashboard_prod.INFORMATION_SCHEMA.TABLES\`
      WHERE table_name = 'writer_daily_breakdown'
    `;

    const [result] = await bigquery.query({ query: checkQuery });

    if (result.length === 0) {
      console.log('❌ writer_daily_breakdown not found');
      return;
    }

    console.log(`✅ Found: ${result[0].table_name} (${result[0].table_type})`);

    // Get sample data
    console.log('\n📋 Sample Data:');
    const dataQuery = `
      SELECT *
      FROM \`speedy-web-461014-g3.dashboard_prod.writer_daily_breakdown\`
      ORDER BY date DESC
      LIMIT 10
    `;
    const [data] = await bigquery.query({ query: dataQuery });
    console.table(data);

    // Test analytics query for a specific writer
    console.log('\n📊 Testing Analytics Query (last 30 days):');
    const analyticsQuery = `
      SELECT
        date,
        SUM(views) as total_views
      FROM \`speedy-web-461014-g3.dashboard_prod.writer_daily_breakdown\`
      WHERE writer_name = 'Antonio Samson'
        AND writer_name IS NOT NULL
        AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
      GROUP BY date
      ORDER BY date DESC
      LIMIT 10
    `;
    const [analyticsData] = await bigquery.query({ query: analyticsQuery });
    console.table(analyticsData);

    // Test exact graph data for May 30th - what the analytics endpoint should return
    console.log('\n🎯 GRAPH DATA TEST - May 30th Analytics Query:');
    const graphTestQuery = `
      SELECT
        date AS time,
        SUM(views) AS views
      FROM \`speedy-web-461014-g3.dashboard_prod.writer_daily_breakdown\`
      WHERE writer_name = 'Shannen Santiago'
        AND date = '2025-05-30'
        AND writer_name IS NOT NULL
      GROUP BY date
      ORDER BY date DESC;
    `;
    const [graphTest] = await bigquery.query({ query: graphTestQuery });
    console.table(graphTest);

    // Show individual records for May 30th
    console.log('\n📋 Individual Records for May 30th:');
    const shannenMay30Query = `
      SELECT
        date,
        writer_name,
        views,
        video_type
      FROM \`speedy-web-461014-g3.dashboard_prod.writer_daily_breakdown\`
      WHERE writer_name = 'Shannen Santiago'
        AND date = '2025-05-30'
    `;
    const [shannenMay30] = await bigquery.query({ query: shannenMay30Query });
    console.table(shannenMay30);

    // Test the exact analytics overview query (last 28 days)
    console.log('\n📊 ANALYTICS OVERVIEW TEST - Last 28 Days (like frontend):');
    const analyticsOverviewQuery = `
      SELECT
        date,
        SUM(views) as total_views
      FROM \`speedy-web-461014-g3.dashboard_prod.writer_daily_breakdown\`
      WHERE writer_name = 'Shannen Santiago'
        AND writer_name IS NOT NULL
        AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 28 DAY)
      GROUP BY date
      ORDER BY date DESC
      LIMIT 10
    `;
    const [analyticsOverview] = await bigquery.query({ query: analyticsOverviewQuery });
    console.table(analyticsOverview);

    // Calculate total views for last 28 days
    const totalViews28Days = analyticsOverview.reduce((sum, row) => sum + parseInt(row.total_views || 0), 0);
    console.log(`\n📈 Total Views (Last 28 Days): ${totalViews28Days.toLocaleString()}`);
    console.log(`📊 Progress to 100M: ${((totalViews28Days / 100000000) * 100).toFixed(2)}%`);

    // Test what the frontend channel endpoint gets (this might be different!)
    console.log('\n🔍 FRONTEND CHANNEL ENDPOINT TEST - What graph actually shows:');
    const channelQuery = `
      SELECT date AS time, SUM(views) AS views
      FROM \`speedy-web-461014-g3.dashboard_prod.writer_daily_breakdown\`
      WHERE writer_name = 'Shannen Santiago'
        AND date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY) AND CURRENT_DATE()
        AND writer_name IS NOT NULL
      GROUP BY date
      ORDER BY date DESC
      LIMIT 30
    `;
    const [channelData] = await bigquery.query({ query: channelQuery });
    console.table(channelData);

    // Check if there are multiple writers with similar names
    console.log('\n🔍 CHECKING FOR SIMILAR WRITER NAMES:');
    const writerNamesQuery = `
      SELECT DISTINCT writer_name, COUNT(*) as record_count, SUM(views) as total_views
      FROM \`speedy-web-461014-g3.dashboard_prod.writer_daily_breakdown\`
      WHERE writer_name LIKE '%Shannen%' OR writer_name LIKE '%Santiago%'
      GROUP BY writer_name
      ORDER BY total_views DESC
    `;
    const [writerNames] = await bigquery.query({ query: writerNamesQuery });
    console.table(writerNames);

    // Check what the exact May 30th data looks like with proper formatting
    console.log('\n📊 MAY 30TH DATA FORMATTING TEST:');
    const may30Data = channelData.find(row => row.time.value === '2025-05-30');
    if (may30Data) {
      console.log(`Raw views: ${may30Data.views}`);
      console.log(`Formatted: ${parseInt(may30Data.views).toLocaleString()}`);
      console.log(`In millions: ${(parseInt(may30Data.views) / 1000000).toFixed(1)}M`);
      console.log(`Chart format: ${Math.round(parseInt(may30Data.views))}`);
    }

    // Show Shannen Santiago's total views and progress to 1B
    console.log('\n📊 Shannen Santiago Progress to 1 Billion Views:');
    const shannenTotalQuery = `
      SELECT
        writer_name,
        SUM(views) as total_views,
        COUNT(DISTINCT date) as days_active,
        MIN(date) as first_date,
        MAX(date) as last_date,
        ROUND((SUM(views) / 1000000000.0) * 100, 4) as progress_to_1b_percent
      FROM \`speedy-web-461014-g3.dashboard_prod.writer_daily_breakdown\`
      WHERE writer_name = 'Shannen Santiago'
        AND writer_name IS NOT NULL
      GROUP BY writer_name
    `;
    const [shannenTotal] = await bigquery.query({ query: shannenTotalQuery });
    console.table(shannenTotal);

    if (shannenTotal.length > 0) {
      const totalViews = parseInt(shannenTotal[0].total_views);
      const progressPercent = parseFloat(shannenTotal[0].progress_to_1b_percent);
      const remainingViews = 1000000000 - totalViews;

      console.log('\n🚀 Shannen Santiago 1B Views Analysis:');
      console.log(`📈 Total Views: ${totalViews.toLocaleString()}`);
      console.log(`🎯 Progress to 1B: ${progressPercent}%`);
      console.log(`📊 Remaining Views: ${remainingViews.toLocaleString()}`);
      console.log(`📅 Days Active: ${shannenTotal[0].days_active}`);
      console.log(`⚡ Average Views/Day: ${Math.round(totalViews / shannenTotal[0].days_active).toLocaleString()}`);

      if (shannenTotal[0].days_active > 0) {
        const avgViewsPerDay = totalViews / shannenTotal[0].days_active;
        const daysTo1B = Math.ceil(remainingViews / avgViewsPerDay);
        console.log(`⏰ Days to reach 1B (at current pace): ${daysTo1B.toLocaleString()}`);
        console.log(`📆 Estimated 1B date: ${new Date(Date.now() + (daysTo1B * 24 * 60 * 60 * 1000)).toDateString()}`);
      }
    }

    // Show top writers for comparison
    console.log('\n📈 Top Writers Progress to 1B Views:');
    const topWritersQuery = `
      SELECT
        writer_name,
        SUM(views) as total_views,
        ROUND((SUM(views) / 1000000000.0) * 100, 2) as progress_to_1b_percent,
        COUNT(DISTINCT date) as days_active
      FROM \`speedy-web-461014-g3.dashboard_prod.writer_daily_breakdown\`
      WHERE writer_name IS NOT NULL
      GROUP BY writer_name
      ORDER BY total_views DESC
      LIMIT 10
    `;
    const [topWriters] = await bigquery.query({ query: topWritersQuery });
    console.table(topWriters);

    console.log('\n✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

// Run it
viewTable();
