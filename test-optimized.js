const { InfluxDB } = require('@influxdata/influxdb-client');

// Your InfluxDB credentials
const url = 'https://us-east-1-1.aws.cloud2.influxdata.com';
const token = 'ojNizGw1U0VID3ltz1khIx2aOQAHG0gIFEbR7VqVk6Ns23fzXOcJG-JxPkGKWL6lluFBQKdagMRbHm6-2iVHSw==';
const org = 'engineering team';
const bucket = 'youtube_api';

console.log('🔍 Testing optimized InfluxDB queries...');

async function testOptimizedQueries() {
  try {
    const client = new InfluxDB({ url, token });
    const queryApi = client.getQueryApi(org);
    
    console.log('✅ InfluxDB client created successfully');
    
    // Test 1: Get total views (optimized)
    console.log('\n1. Testing total views query...');
    const totalViewsQuery = `
      from(bucket: "${bucket}")
        |> range(start: -30d)
        |> filter(fn: (r) => r._measurement == "views")
        |> group()
        |> sum()
        |> limit(n: 1)
    `;
    
    let totalViews = 0;
    await queryApi.queryRows(totalViewsQuery, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        totalViews = o._value || 0;
      },
      error(error) {
        console.error('❌ Total views error:', error);
      },
      complete() {
        console.log('📈 Total views (last 30 days):', totalViews.toLocaleString());
      }
    });
    
    // Test 2: Get daily analytics (optimized)
    console.log('\n2. Testing daily analytics query...');
    const dailyAnalyticsQuery = `
      from(bucket: "${bucket}")
        |> range(start: -7d)
        |> filter(fn: (r) => r._measurement == "views")
        |> aggregateWindow(every: 1d, fn: sum, createEmpty: false)
        |> group(columns: ["_time"])
        |> sort(columns: ["_time"], desc: false)
        |> limit(n: 10)
    `;
    
    const dailyResults = [];
    await queryApi.queryRows(dailyAnalyticsQuery, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        dailyResults.push({
          date: o._time,
          views: o._value || 0
        });
      },
      error(error) {
        console.error('❌ Daily analytics error:', error);
      },
      complete() {
        console.log('📊 Daily analytics (last 7 days):');
        dailyResults.forEach(day => {
          console.log(`  ${new Date(day.date).toLocaleDateString()}: ${day.views.toLocaleString()} views`);
        });
      }
    });
    
    // Test 3: Get top videos (optimized)
    console.log('\n3. Testing top videos query...');
    const topVideosQuery = `
      from(bucket: "${bucket}")
        |> range(start: -30d)
        |> filter(fn: (r) => r._measurement == "views")
        |> group(columns: ["video_id", "writer_name", "url"])
        |> sum()
        |> group()
        |> sort(columns: ["_value"], desc: true)
        |> limit(n: 5)
    `;
    
    const topVideos = [];
    await queryApi.queryRows(topVideosQuery, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        topVideos.push({
          video_id: o.video_id,
          writer_name: o.writer_name,
          url: o.url,
          views: o._value || 0
        });
      },
      error(error) {
        console.error('❌ Top videos error:', error);
      },
      complete() {
        console.log('🏆 Top 5 videos (last 30 days):');
        topVideos.forEach((video, index) => {
          console.log(`  ${index + 1}. Video ${video.video_id} by ${video.writer_name}: ${video.views.toLocaleString()} views`);
        });
      }
    });
    
    // Test 4: Get writer stats
    console.log('\n4. Testing writer stats query...');
    const writerStatsQuery = `
      from(bucket: "${bucket}")
        |> range(start: -30d)
        |> filter(fn: (r) => r._measurement == "views")
        |> group(columns: ["writer_name"])
        |> sum()
        |> group()
        |> sort(columns: ["_value"], desc: true)
        |> limit(n: 5)
    `;
    
    const writerStats = [];
    await queryApi.queryRows(writerStatsQuery, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        writerStats.push({
          writer_name: o.writer_name,
          total_views: o._value || 0
        });
      },
      error(error) {
        console.error('❌ Writer stats error:', error);
      },
      complete() {
        console.log('✍️ Top 5 writers by views (last 30 days):');
        writerStats.forEach((writer, index) => {
          console.log(`  ${index + 1}. ${writer.writer_name}: ${writer.total_views.toLocaleString()} views`);
        });
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testOptimizedQueries().then(success => {
  console.log('\n🏁 Optimized query tests completed. Success:', success);
  process.exit(success ? 0 : 1);
});
