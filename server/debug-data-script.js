const { Pool } = require('pg');
const { BigQuery } = require('@google-cloud/bigquery');
const { InfluxDB } = require('@influxdata/influxdb-client');
require('dotenv').config();

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
    // Skip PostgreSQL connection - use hardcoded writer info for testing
    const writer = {
      id: writerId,
      name: writerId === 110 ? 'Shannen Santiago' : `Writer_${writerId}`, // Common writer name
      login_id: 1
    };

    console.log(`📝 Writer: ${writer.name} (ID: ${writer.id}) - HARDCODED FOR TESTING`);

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

        // CORRECT FIX: Calculate daily increases per video, then sum
        const influxQuery = `
          from(bucket: "youtube_api")
            |> range(start: -7d)
            |> filter(fn: (r) => r._measurement == "views")
            |> filter(fn: (r) => r._field == "views")
            |> filter(fn: (r) => r.writer_name == "${writer.name}")
            |> limit(n: 50)
            |> sort(columns: ["_time"], desc: false)
        `;

        console.log(`🔍 InfluxDB Query (RAW DATA INSPECTION - last 7 days, 50 records):\n${influxQuery}`);

        const influxRawResults = [];
        await new Promise((resolve, reject) => {
          queryApi.queryRows(influxQuery, {
            next(row, tableMeta) {
              const o = tableMeta.toObject(row);
              const dateStr = new Date(o._time).toISOString().split('T')[0];

              // Collect all raw data to understand structure
              influxRawResults.push({
                date: dateStr,
                time: new Date(o._time).toTimeString().slice(0, 8),
                views: parseInt(o._value || 0),
                rawTime: o._time,
                video_id: o.video_id || 'unknown',
                writer_name: o.writer_name || 'unknown',
                measurement: o._measurement || 'unknown',
                field: o._field || 'unknown',
                fullRecord: o
              });
            },
            error(error) {
              console.error('❌ InfluxDB query error:', error);
              reject(error);
            },
            complete() {
              console.log(`✅ InfluxDB query completed: ${influxRawResults.length} records in date range`);
              resolve();
            }
          });
        });

        // Sort by date and time
        influxRawResults.sort((a, b) => new Date(a.rawTime) - new Date(b.rawTime));

        console.log(`\n📊 RAW INFLUXDB DATA STRUCTURE (first 20 records):`);
        console.log(`Total records found: ${influxRawResults.length}`);
        console.log(`Date range in data: ${influxRawResults[0]?.date} to ${influxRawResults[influxRawResults.length - 1]?.date}`);

        influxRawResults.slice(0, 20).forEach((record, index) => {
          console.log(`\n${index + 1}. ${record.date} ${record.time}:`);
          console.log(`   Video ID: ${record.video_id}`);
          console.log(`   Views: ${record.views.toLocaleString()}`);
          console.log(`   Writer: ${record.writer_name}`);
          console.log(`   Measurement: ${record.measurement}, Field: ${record.field}`);
        });

        // Show unique video IDs
        const uniqueVideos = [...new Set(influxRawResults.map(r => r.video_id))];
        console.log(`\n📊 UNIQUE VIDEO IDs (${uniqueVideos.length} total):`);
        uniqueVideos.slice(0, 10).forEach(videoId => {
          const videoRecords = influxRawResults.filter(r => r.video_id === videoId);
          console.log(`   ${videoId}: ${videoRecords.length} records`);
        });

        // Show data by date
        const dateGroups = influxRawResults.reduce((groups, record) => {
          if (!groups[record.date]) groups[record.date] = [];
          groups[record.date].push(record);
          return groups;
        }, {});

        console.log(`\n📊 RECORDS BY DATE:`);
        Object.entries(dateGroups).slice(0, 5).forEach(([date, records]) => {
          console.log(`   ${date}: ${records.length} records`);
          // Show first few records for this date
          records.slice(0, 3).forEach(record => {
            console.log(`     ${record.time} - Video ${record.video_id}: ${record.views.toLocaleString()} views`);
          });
          if (records.length > 3) {
            console.log(`     ... and ${records.length - 3} more records`);
          }
        });

        // CORRECT APPROACH: Calculate daily increases from hourly cumulative data
        console.log(`\n🔧 CALCULATING CORRECT DAILY INCREASES:`);

        // Step 1: Convert UTC to EST and group by EST date and video
        const estData = influxRawResults.map(record => {
          const utcTime = new Date(record.rawTime);
          const estTime = new Date(utcTime.getTime() - (5 * 60 * 60 * 1000)); // UTC-5 for EST
          const estDate = estTime.toISOString().split('T')[0];

          return {
            ...record,
            estDate: estDate,
            estTime: estTime,
            estTimeString: estTime.toTimeString().slice(0, 8)
          };
        });

        console.log(`📅 Sample UTC to EST conversion:`);
        estData.slice(0, 3).forEach(record => {
          console.log(`   UTC: ${record.date} ${record.time} → EST: ${record.estDate} ${record.estTimeString}`);
        });

        // Step 2: Group by video and EST date, get last record of each day
        const videosByDate = {};
        estData.forEach(record => {
          const key = `${record.video_id}_${record.estDate}`;
          if (!videosByDate[key] || record.estTime > videosByDate[key].estTime) {
            videosByDate[key] = record; // Keep the latest record for this video on this EST date
          }
        });

        const dailyVideoRecords = Object.values(videosByDate);
        console.log(`📊 Daily video records (last of each day): ${dailyVideoRecords.length}`);

        // Step 3: Group by video and calculate daily differences
        const videoGroups = dailyVideoRecords.reduce((groups, record) => {
          if (!groups[record.video_id]) groups[record.video_id] = [];
          groups[record.video_id].push(record);
          return groups;
        }, {});

        // Step 4: Calculate daily increases per video
        const dailyIncreases = [];
        Object.entries(videoGroups).forEach(([videoId, records]) => {
          // Sort by EST date
          records.sort((a, b) => new Date(a.estDate) - new Date(b.estDate));

          for (let i = 1; i < records.length; i++) {
            const today = records[i];
            const yesterday = records[i - 1];
            const increase = today.views - yesterday.views;

            if (increase > 0) { // Only positive increases
              dailyIncreases.push({
                date: today.estDate,
                videoId: videoId,
                increase: increase,
                todayViews: today.views,
                yesterdayViews: yesterday.views
              });
            }
          }
        });

        console.log(`📈 Daily increases calculated: ${dailyIncreases.length} records`);

        // Step 5: Aggregate by date
        const dailyTotals = dailyIncreases.reduce((totals, record) => {
          if (!totals[record.date]) {
            totals[record.date] = {
              date: record.date,
              totalIncrease: 0,
              videoCount: 0,
              videos: []
            };
          }
          totals[record.date].totalIncrease += record.increase;
          totals[record.date].videoCount++;
          totals[record.date].videos.push({
            videoId: record.videoId,
            increase: record.increase
          });
          return totals;
        }, {});

        const sortedDailyTotals = Object.values(dailyTotals).sort((a, b) => new Date(a.date) - new Date(b.date));

        console.log(`\n📊 CORRECTED DAILY VIEW INCREASES (EST timezone):`);
        sortedDailyTotals.forEach(day => {
          console.log(`   ${day.date}: ${day.totalIncrease.toLocaleString()} views (+${day.videoCount} videos)`);
        });

        // Show detailed breakdown for one day
        if (sortedDailyTotals.length > 0) {
          const sampleDay = sortedDailyTotals[0];
          console.log(`\n🔍 DETAILED BREAKDOWN FOR ${sampleDay.date}:`);
          console.log(`   Total increase: ${sampleDay.totalIncrease.toLocaleString()} views`);
          console.log(`   Videos with increases: ${sampleDay.videoCount}`);
          console.log(`   Top 5 video increases:`);
          sampleDay.videos
            .sort((a, b) => b.increase - a.increase)
            .slice(0, 5)
            .forEach(video => {
              console.log(`     Video ${video.videoId}: +${video.increase.toLocaleString()} views`);
            });
        }

        // Calculate correct total from daily increases
        const correctTotal = sortedDailyTotals.reduce((sum, day) => sum + day.totalIncrease, 0);
        const influxResults = sortedDailyTotals.map(day => ({
          date: day.date,
          views: day.totalIncrease
        }));

        console.log(`\n📊 FINAL CORRECTED SUMMARY:`);
        console.log(`   Total view increases (7 days): ${correctTotal.toLocaleString()}`);
        console.log(`   Average daily increase: ${Math.round(correctTotal / sortedDailyTotals.length).toLocaleString()}`);
        console.log(`   Days with data: ${sortedDailyTotals.length}`);

        const influxTotal = correctTotal;

        console.log(`\n📊 InfluxDB Final Results (CORRECTED DAILY INCREASES - first 10 days):`);
        influxResults.slice(0, 10).forEach(day => {
          console.log(`   ${day.date}: ${day.views.toLocaleString()} daily view increase`);
        });

        // Special focus on May 30th daily increase
        const may30Increase = influxResults.filter(day => day.date === '2025-05-30');
        if (may30Increase.length > 0) {
          console.log(`\n🎯 MAY 30TH FINAL RESULT (CORRECTED):`);
          may30Increase.forEach(day => {
            console.log(`   ${day.date}: ${day.views.toLocaleString()} daily view increase`);
          });
        } else {
          console.log(`\n🎯 MAY 30TH: No daily increase data found for 2025-05-30`);
        }

        // Show May 29-31 increases
        const may29to31Increases = influxResults.filter(day =>
          day.date >= '2025-05-29' && day.date <= '2025-05-31'
        );
        if (may29to31Increases.length > 0) {
          console.log(`\n🎯 MAY 29-31 FINAL RESULTS (CORRECTED):`);
          may29to31Increases.forEach(day => {
            console.log(`   ${day.date}: ${day.views.toLocaleString()} daily view increase`);
          });
        }
        
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
        if (results.influxData.firstDay) {
          console.log(`   First Day: ${results.influxData.firstDay.date} (${results.influxData.firstDay.views.toLocaleString()} views)`);
        }
        if (results.influxData.lastDay) {
          console.log(`   Last Day: ${results.influxData.lastDay.date} (${results.influxData.lastDay.views.toLocaleString()} views)`);
        }

        // Show sample daily data
        console.log(`\n📊 Sample InfluxDB Daily Data (first 10 days):`);
        influxResults.slice(0, 10).forEach(day => {
          console.log(`   ${day.date}: ${day.views.toLocaleString()} views`);
        });

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

        console.log(`📊 BigQuery Raw Data (first 10 days):`);
        bigQueryRaw.slice(0, 10).forEach(day => {
          console.log(`   ${day.date}: ${day.absoluteViews.toLocaleString()} absolute views`);
        });

        // Calculate daily increases (showing the problem)
        const bigQueryIncreases = [];
        for (let i = 0; i < bigQueryRaw.length; i++) {
          const currentDay = bigQueryRaw[i];
          let dailyIncrease = 0;
          
          if (i === 0) {
            // THIS IS THE PROBLEM - using absolute count as increase
            dailyIncrease = currentDay.absoluteViews;
            console.log(`🚨 FIRST DAY PROBLEM: Using ${currentDay.absoluteViews.toLocaleString()} as daily increase!`);
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

        console.log(`\n📊 BigQuery Daily Increases (first 10 days):`);
        bigQueryIncreases.slice(0, 10).forEach(day => {
          const marker = day.isFirstDay ? ' 🚨 PROBLEM!' : '';
          console.log(`   ${day.date}: ${day.dailyIncrease.toLocaleString()} increase${marker}`);
        });

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

        console.log(`\n📊 BigQuery Summary:`);
        console.log(`   Total Records: ${bigQueryRows.length}`);
        console.log(`   Total from Increases: ${totalFromIncreases.toLocaleString()}`);
        console.log(`   🚨 First Day Problem: ${results.bigQueryData.firstDayProblem.toLocaleString()} (should be much smaller)`);

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
      console.log(`🚨 Difference: ${Math.abs(results.influxData.totalViews - results.bigQueryData.totalFromIncreases).toLocaleString()}`);
      console.log(`🚨 BigQuery First Day Issue: ${results.bigQueryData.firstDayProblem.toLocaleString()} (likely the problem)`);
      
      const ratio = results.bigQueryData.totalFromIncreases / results.influxData.totalViews;
      console.log(`📊 BigQuery/InfluxDB Ratio: ${ratio.toFixed(2)}x`);
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
    // Skip pool.end() since we're not using PostgreSQL
    process.exit(0);
  }
}

main();
