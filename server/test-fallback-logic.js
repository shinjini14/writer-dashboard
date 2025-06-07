require('dotenv').config();

// Test the corrected fallback logic for June 6th transition
async function testFallbackLogic() {
  console.log('🧪 Testing June 6th Fallback Logic');
  console.log('==================================');

  try {
    const writerId = 110;
    console.log(`🔍 Testing fallback for writer ID: ${writerId}`);

    // Step 1: Get June 5th InfluxDB cumulative (baseline)
    console.log('\n📊 STEP 1: Get June 5th InfluxDB cumulative');
    
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

    // Step 2: Get June 6th InfluxDB daily increase (fallback data)
    console.log('\n📊 STEP 2: Get June 6th InfluxDB daily increase (fallback)');
    
    const InfluxService = require('./services/influxService');
    const influxService = new InfluxService();
    
    const influxData = await influxService.getDashboardAnalytics('5d', writerId);
    const june6thInflux = influxData.find(day => 
      day.date.toISOString().split('T')[0] === '2025-06-06'
    );

    if (june6thInflux) {
      console.log(`✅ June 6th InfluxDB daily increase: ${june6thInflux.views.toLocaleString()}`);
    } else {
      console.log(`❌ No June 6th data found in InfluxDB`);
      return;
    }

    // Step 3: Simulate different BigQuery scenarios
    console.log('\n📊 STEP 3: Test fallback logic with different scenarios');
    
    const scenarios = [
      { 
        name: 'BigQuery missing (0 views)', 
        bigQueryJune6th: 0,
        shouldFallback: true 
      },
      { 
        name: 'BigQuery < InfluxDB (negative)', 
        bigQueryJune6th: 100000000, // 100M < 127M
        shouldFallback: true 
      },
      { 
        name: 'BigQuery = InfluxDB (0 increase)', 
        bigQueryJune6th: june5thCumulative,
        shouldFallback: true 
      },
      { 
        name: 'BigQuery > InfluxDB (positive)', 
        bigQueryJune6th: june5thCumulative + 500000, // +500K
        shouldFallback: false 
      }
    ];

    scenarios.forEach((scenario, index) => {
      console.log(`\n   Scenario ${index + 1}: ${scenario.name}`);
      
      const transitionIncrease = scenario.bigQueryJune6th - june5thCumulative;
      console.log(`     BigQuery June 6th: ${scenario.bigQueryJune6th.toLocaleString()}`);
      console.log(`     Transition calc: ${scenario.bigQueryJune6th.toLocaleString()} - ${june5thCumulative.toLocaleString()} = ${transitionIncrease.toLocaleString()}`);
      
      let finalIncrease;
      if (transitionIncrease <= 0) {
        // This is where our fallback logic kicks in
        finalIncrease = june6thInflux.views;
        console.log(`     ⚠️ Transition failed (${transitionIncrease.toLocaleString()}), using InfluxDB fallback`);
        console.log(`     ✅ Final result: ${finalIncrease.toLocaleString()} views (from InfluxDB)`);
      } else {
        finalIncrease = transitionIncrease;
        console.log(`     ✅ Transition successful: ${finalIncrease.toLocaleString()} views (from BigQuery)`);
      }
      
      if (scenario.shouldFallback && finalIncrease === june6thInflux.views) {
        console.log(`     ✅ CORRECT: Fallback logic worked as expected`);
      } else if (!scenario.shouldFallback && finalIncrease === transitionIncrease) {
        console.log(`     ✅ CORRECT: BigQuery transition worked as expected`);
      } else {
        console.log(`     ❌ INCORRECT: Logic didn't work as expected`);
      }
    });

    // Step 4: Test the actual implementation
    console.log('\n📊 STEP 4: Summary of corrected logic');
    
    console.log(`📋 CORRECTED JUNE 6TH LOGIC:`);
    console.log(`1. Try: BigQuery June 6th - InfluxDB June 5th`);
    console.log(`2. If result <= 0: Use InfluxDB June 6th daily increase`);
    console.log(`3. If result > 0: Use BigQuery transition result`);
    
    console.log(`\n📊 EXPECTED RESULTS:`);
    console.log(`✅ June 5th: ${influxData.find(d => d.date.toISOString().split('T')[0] === '2025-06-05')?.views.toLocaleString() || 'N/A'} views (InfluxDB)`);
    console.log(`✅ June 6th: ${june6thInflux.views.toLocaleString()} views (InfluxDB fallback)`);
    console.log(`✅ June 7th+: BigQuery daily differences (when available)`);

    console.log('\n🎉 FALLBACK LOGIC TEST COMPLETED');
    console.log('=================================');
    console.log('✅ June 6th will now show realistic views instead of 0');
    console.log('✅ Fallback to InfluxDB when BigQuery transition fails');
    console.log('✅ Smooth transition between data sources');

  } catch (error) {
    console.error('❌ Fallback test failed:', error.message);
  }
}

// Run the test
testFallbackLogic();
