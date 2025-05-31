const express = require('express');
const router = express.Router();

// Get InfluxDB service
let influxService;
try {
  const InfluxService = require('../services/influxService');
  // Set credentials
  process.env.INFLUXDB_URL = 'https://us-east-1-1.aws.cloud2.influxdata.com';
  process.env.INFLUXDB_TOKEN = 'ojNizGw1U0VID3ltz1khIx2aOQAHG0gIFEbR7VqVk6Ns23fzXOcJG-JxPkGKWL6lluFBQKdagMRbHm6-2iVHSw==';
  process.env.INFLUXDB_ORG = 'engineering team';
  process.env.INFLUXDB_BUCKET = 'youtube_api';
  influxService = new InfluxService();
} catch (error) {
  console.error('Failed to initialize InfluxDB for data explorer:', error);
}

// Comprehensive data exploration
router.get('/comprehensive', async (req, res) => {
  try {
    if (!influxService) {
      return res.status(500).json({ 
        success: false, 
        message: 'InfluxDB service not available' 
      });
    }

    const results = {
      bucketInfo: {},
      measurements: [],
      sampleData: [],
      timeRanges: {},
      fieldAnalysis: {},
      tagAnalysis: {}
    };

    // 1. Get all measurements
    try {
      const measurementsQuery = `
        import "influxdata/influxdb/schema"
        schema.measurements(bucket: "youtube_api")
      `;
      
      await influxService.queryApi.queryRows(measurementsQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          results.measurements.push(o._value);
        },
        error(error) {
          console.error('Error getting measurements:', error);
        },
        complete() {
          console.log('📊 Found measurements:', results.measurements);
        }
      });
    } catch (error) {
      results.measurements = ['Error getting measurements: ' + error.message];
    }

    // 2. Get data from different time ranges
    const timeRanges = ['1h', '24h', '7d', '30d', '90d', '1y'];
    
    for (const range of timeRanges) {
      try {
        const query = `
          from(bucket: "youtube_api")
            |> range(start: -${range})
            |> limit(n: 1)
        `;
        
        let hasData = false;
        await influxService.queryApi.queryRows(query, {
          next(row, tableMeta) {
            hasData = true;
          },
          error(error) {
            console.error(`Error checking ${range}:`, error);
          },
          complete() {
            results.timeRanges[range] = hasData;
          }
        });
      } catch (error) {
        results.timeRanges[range] = 'Error: ' + error.message;
      }
    }

    // 3. Get sample data from the longest available range
    try {
      const sampleQuery = `
        from(bucket: "youtube_api")
          |> range(start: -1y)
          |> limit(n: 10)
      `;
      
      await influxService.queryApi.queryRows(sampleQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          results.sampleData.push(o);
        },
        error(error) {
          console.error('Error getting sample data:', error);
        },
        complete() {
          console.log('📋 Sample data count:', results.sampleData.length);
        }
      });
    } catch (error) {
      results.sampleData = ['Error getting sample data: ' + error.message];
    }

    // 4. Analyze fields and tags for each measurement
    for (const measurement of results.measurements.slice(0, 5)) {
      if (typeof measurement === 'string' && !measurement.includes('Error')) {
        try {
          // Get field keys
          const fieldsQuery = `
            import "influxdata/influxdb/schema"
            schema.fieldKeys(bucket: "youtube_api", measurement: "${measurement}")
          `;
          
          const fields = [];
          await influxService.queryApi.queryRows(fieldsQuery, {
            next(row, tableMeta) {
              const o = tableMeta.toObject(row);
              fields.push(o._value);
            },
            error(error) {
              console.error(`Error getting fields for ${measurement}:`, error);
            },
            complete() {
              results.fieldAnalysis[measurement] = fields;
            }
          });

          // Get tag keys
          const tagsQuery = `
            import "influxdata/influxdb/schema"
            schema.tagKeys(bucket: "youtube_api", measurement: "${measurement}")
          `;
          
          const tags = [];
          await influxService.queryApi.queryRows(tagsQuery, {
            next(row, tableMeta) {
              const o = tableMeta.toObject(row);
              tags.push(o._value);
            },
            error(error) {
              console.error(`Error getting tags for ${measurement}:`, error);
            },
            complete() {
              results.tagAnalysis[measurement] = tags;
            }
          });
        } catch (error) {
          results.fieldAnalysis[measurement] = ['Error: ' + error.message];
          results.tagAnalysis[measurement] = ['Error: ' + error.message];
        }
      }
    }

    // 5. Get bucket statistics
    try {
      const statsQuery = `
        from(bucket: "youtube_api")
          |> range(start: -1y)
          |> count()
          |> yield(name: "count")
      `;
      
      let totalPoints = 0;
      await influxService.queryApi.queryRows(statsQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          totalPoints += o._value || 0;
        },
        error(error) {
          console.error('Error getting bucket stats:', error);
        },
        complete() {
          results.bucketInfo.totalDataPoints = totalPoints;
        }
      });
    } catch (error) {
      results.bucketInfo.error = error.message;
    }

    res.json({ 
      success: true, 
      data: results,
      timestamp: new Date().toISOString(),
      message: 'Comprehensive data exploration completed'
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error during comprehensive exploration', 
      error: error.message 
    });
  }
});

// Get data structure recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const recommendations = {
      expectedStructure: {
        measurements: [
          'youtube_videos',
          'youtube_analytics', 
          'youtube_channel',
          'writer_submissions'
        ],
        fields: {
          youtube_videos: ['views', 'likes', 'comments', 'shares', 'duration', 'title'],
          youtube_analytics: ['daily_views', 'watch_time', 'subscribers', 'revenue'],
          youtube_channel: ['total_views', 'subscriber_count', 'video_count'],
          writer_submissions: ['status', 'submission_date', 'acceptance_rate']
        },
        tags: {
          youtube_videos: ['video_id', 'channel_id', 'category'],
          youtube_analytics: ['date', 'metric_type'],
          youtube_channel: ['channel_id'],
          writer_submissions: ['writer_id', 'submission_type', 'status']
        }
      },
      sampleQueries: [
        {
          name: 'Get video performance',
          query: `from(bucket: "youtube_api") |> range(start: -30d) |> filter(fn: (r) => r._measurement == "youtube_videos")`
        },
        {
          name: 'Get channel analytics',
          query: `from(bucket: "youtube_api") |> range(start: -30d) |> filter(fn: (r) => r._measurement == "youtube_analytics")`
        }
      ],
      dataIngestionTips: [
        'Use consistent measurement names',
        'Include video_id as a tag for videos',
        'Store timestamps in RFC3339 format',
        'Use appropriate field types (int, float, string)',
        'Include metadata as tags for better querying'
      ]
    };

    res.json({ 
      success: true, 
      data: recommendations,
      message: 'Data structure recommendations generated'
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error generating recommendations', 
      error: error.message 
    });
  }
});

module.exports = router;
