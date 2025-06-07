require('dotenv').config();

// Debug why June 6th shows 0 views in transition
async function debugZeroViews() {
  console.log('🔍 DEBUGGING: Why June 6th shows 0 views');
  console.log('==========================================');

  try {
    const writerId = 110;
    console.log(`🔍 Debugging writer ID: ${writerId}`);

    // Step 1: Verify June 5th InfluxDB cumulative (we know this works)
    console.log('\n📊 STEP 1: Verify June 5th InfluxDB cumulative');
    
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

    let june5thCumulative = 0;
    await new Promise((resolve, reject) => {
      queryApi.queryRows(june5thQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          june5thCumulative = parseInt(o._value || 0);
        },
        error(error) {
          console.error('❌ June 5th query error:', error);
          reject(error);
        },
        complete() {
          resolve();
        }
      });
    });

    console.log(`✅ June 5th InfluxDB cumulative: ${june5thCumulative.toLocaleString()}`);

    // Step 2: Check if BigQuery has ANY data for writer 110
    console.log('\n📊 STEP 2: Check BigQuery data availability for writer 110');
    
    // Since BigQuery auth is failing, let's simulate what should happen
    console.log('⚠️ BigQuery authentication failed in previous tests');
    console.log('🔍 Let\'s check what the analytics route is actually doing...');

    // Step 3: Test the actual analytics route logic
    console.log('\n📊 STEP 3: Test analytics route transition logic');
    
    // Simulate the transition calculation with different scenarios
    const scenarios = [
      { name: 'No BigQuery data', june6thBQ: 0 },
      { name: 'BigQuery < InfluxDB', june6thBQ: 100000000 }, // 100M (less than 127M)
      { name: 'BigQuery = InfluxDB', june6thBQ: june5thCumulative },
      { name: 'BigQuery > InfluxDB (realistic)', june6thBQ: june5thCumulative + 300000 }, // +300K
      { name: 'BigQuery > InfluxDB (high)', june6thBQ: june5thCumulative + 5000000 }, // +5M
    ];

    console.log('\n🧪 TESTING DIFFERENT SCENARIOS:');
    scenarios.forEach(scenario => {
      const increase = scenario.june6thBQ - june5thCumulative;
      const finalIncrease = Math.max(0, increase);
      
      console.log(`\n   ${scenario.name}:`);
      console.log(`     June 6th BigQuery: ${scenario.june6thBQ.toLocaleString()}`);
      console.log(`     Calculation: ${scenario.june6thBQ.toLocaleString()} - ${june5thCumulative.toLocaleString()} = ${increase.toLocaleString()}`);
      console.log(`     Final (Math.max(0, increase)): ${finalIncrease.toLocaleString()}`);
      
      if (finalIncrease === 0) {
        console.log(`     ❌ RESULT: 0 views (this is your current issue!)`);
      } else {
        console.log(`     ✅ RESULT: ${finalIncrease.toLocaleString()} views`);
      }
    });

    // Step 4: Check what BigQuery data actually exists
    console.log('\n📊 STEP 4: Alternative BigQuery check');
    console.log('Since BigQuery auth failed, let\'s check the route logs...');
    
    // Step 5: Test the corrected InfluxDB service
    console.log('\n📊 STEP 5: Verify corrected InfluxDB service works');
    
    const InfluxService = require('./services/influxService');
    const influxService = new InfluxService();
    
    const recentData = await influxService.getDashboardAnalytics('10d', writerId);
    
    console.log(`✅ InfluxDB service returned ${recentData.length} days`);
    console.log('📊 Recent daily increases:');
    recentData.slice(-5).forEach(day => {
      const dateStr = day.date.toISOString().split('T')[0];
      console.log(`   ${dateStr}: ${day.views.toLocaleString()} views`);
    });

    // Step 6: Identify the most likely cause
    console.log('\n🎯 DIAGNOSIS:');
    console.log('The 0 views issue is most likely caused by:');
    console.log('1. ❌ No BigQuery data for June 6th for writer 110');
    console.log('2. ❌ BigQuery June 6th total < InfluxDB June 5th total');
    console.log('3. ❌ BigQuery authentication/query error');
    console.log('4. ❌ Writer ID mismatch between InfluxDB and BigQuery');

    console.log('\n🔧 SOLUTIONS TO TRY:');
    console.log('1. Check if BigQuery has data for writer_id=110 on 2025-06-06');
    console.log('2. Check if writer_id mapping is consistent between sources');
    console.log('3. Add fallback to InfluxDB when BigQuery returns 0/null');
    console.log('4. Add better error handling and logging in transition logic');

    console.log('\n📋 NEXT STEPS:');
    console.log('1. Fix BigQuery authentication to test actual data');
    console.log('2. Add fallback logic when BigQuery data is missing');
    console.log('3. Add detailed logging to the analytics route');
    console.log('4. Consider using InfluxDB for June 6th if BigQuery fails');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugZeroViews();
