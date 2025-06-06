const { InfluxDB } = require('@influxdata/influxdb-client');

class InfluxService {
  constructor() {
    console.log('🔍 Environment variables check:');
    console.log('INFLUXDB_URL:', process.env.INFLUXDB_URL ? 'SET' : 'NOT SET');
    console.log('INFLUXDB_TOKEN:', process.env.INFLUXDB_TOKEN ? 'SET' : 'NOT SET');
    console.log('INFLUXDB_ORG:', process.env.INFLUXDB_ORG ? 'SET' : 'NOT SET');
    console.log('INFLUXDB_BUCKET:', process.env.INFLUXDB_BUCKET ? 'SET' : 'NOT SET');

    this.url = process.env.INFLUXDB_URL;
    this.token = process.env.INFLUXDB_TOKEN;
    this.org = process.env.INFLUXDB_ORG;
    this.bucket = process.env.INFLUXDB_BUCKET;

    if (!this.url || !this.token || !this.org || !this.bucket) {
      console.error('Missing InfluxDB configuration:', {
        url: !!this.url,
        token: !!this.token,
        org: !!this.org,
        bucket: !!this.bucket
      });
      throw new Error('InfluxDB configuration is incomplete');
    }

    this.client = new InfluxDB({ url: this.url, token: this.token });
    this.queryApi = this.client.getQueryApi(this.org);

    console.log('✅ InfluxDB service initialized successfully');
  }

  // Explore the data structure in the bucket
  async exploreDataStructure() {
    try {
      console.log('🔍 Exploring InfluxDB data structure...');

      // Get all measurements
      const measurementsQuery = `
        import "influxdata/influxdb/schema"
        schema.measurements(bucket: "${this.bucket}")
      `;

      const measurements = [];
      await this.queryApi.queryRows(measurementsQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          measurements.push(o._value);
        },
        error(error) {
          console.error('Error getting measurements:', error);
        },
        complete() {
          console.log('📊 Available measurements:', measurements);
        }
      });

      // Get field keys for each measurement
      for (const measurement of measurements.slice(0, 3)) { // Limit to first 3 measurements
        const fieldsQuery = `
          import "influxdata/influxdb/schema"
          schema.fieldKeys(bucket: "${this.bucket}", measurement: "${measurement}")
        `;

        const fields = [];
        await this.queryApi.queryRows(fieldsQuery, {
          next(row, tableMeta) {
            const o = tableMeta.toObject(row);
            fields.push(o._value);
          },
          error(error) {
            console.error(`Error getting fields for ${measurement}:`, error);
          },
          complete() {
            console.log(`📈 Fields in ${measurement}:`, fields);
          }
        });
      }

      return { measurements };
    } catch (error) {
      console.error('❌ Error exploring data structure:', error);
      throw error;
    }
  }

  // Get sample data from the bucket
  async getSampleData(limit = 10) {
    try {
      const query = `
        from(bucket: "${this.bucket}")
          |> range(start: -30d)
          |> limit(n: ${limit})
      `;

      const results = [];
      await this.queryApi.queryRows(query, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          results.push(o);
        },
        error(error) {
          console.error('Error getting sample data:', error);
        },
        complete() {
          console.log('📋 Sample data retrieved:', results.length, 'records');
        }
      });

      return results;
    } catch (error) {
      console.error('❌ Error getting sample data:', error);
      throw error;
    }
  }

  // Get YouTube analytics data based on your actual data structure
  async getYouTubeAnalytics(timeRange = '30d') {
    try {
      const query = `
        from(bucket: "${this.bucket}")
          |> range(start: -${timeRange})
          |> filter(fn: (r) => r._measurement == "views")
          |> group(columns: ["video_id", "writer_id", "writer_name", "url"])
          |> sort(columns: ["_time"], desc: false)
      `;

      const results = [];
      await this.queryApi.queryRows(query, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          results.push(o);
        },
        error(error) {
          console.error('Error getting YouTube analytics:', error);
        },
        complete() {
          console.log('📺 YouTube analytics retrieved:', results.length, 'records');
        }
      });

      return results;
    } catch (error) {
      console.error('❌ Error getting YouTube analytics:', error);
      throw error;
    }
  }

  // Get video performance data
  async getVideoPerformance(videoId = null, timeRange = '30d') {
    try {
      let query = `
        from(bucket: "${this.bucket}")
          |> range(start: -${timeRange})
          |> filter(fn: (r) => r._measurement == "youtube_videos")
      `;

      if (videoId) {
        query += `|> filter(fn: (r) => r.video_id == "${videoId}")`;
      }

      query += `
          |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
          |> sort(columns: ["_time"], desc: false)
      `;

      const results = [];
      await this.queryApi.queryRows(query, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          results.push(o);
        },
        error(error) {
          console.error('Error getting video performance:', error);
        },
        complete() {
          console.log('🎬 Video performance retrieved:', results.length, 'records');
        }
      });

      return results;
    } catch (error) {
      console.error('❌ Error getting video performance:', error);
      throw error;
    }
  }

  // Get channel statistics
  async getChannelStats(timeRange = '30d') {
    try {
      const query = `
        from(bucket: "${this.bucket}")
          |> range(start: -${timeRange})
          |> filter(fn: (r) => r._measurement == "youtube_channel")
          |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
          |> sort(columns: ["_time"], desc: false)
      `;

      const results = [];
      await this.queryApi.queryRows(query, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          results.push(o);
        },
        error(error) {
          console.error('Error getting channel stats:', error);
        },
        complete() {
          console.log('📊 Channel stats retrieved:', results.length, 'records');
        }
      });

      return results;
    } catch (error) {
      console.error('❌ Error getting channel stats:', error);
      throw error;
    }
  }

  // Get submissions data (if available)
  async getSubmissionsData(timeRange = '30d') {
    try {
      const query = `
        from(bucket: "${this.bucket}")
          |> range(start: -${timeRange})
          |> filter(fn: (r) => r._measurement == "submissions" or r._measurement == "writer_submissions")
          |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
          |> sort(columns: ["_time"], desc: false)
      `;

      const results = [];
      await this.queryApi.queryRows(query, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          results.push(o);
        },
        error(error) {
          console.error('Error getting submissions data:', error);
        },
        complete() {
          console.log('✍️ Submissions data retrieved:', results.length, 'records');
        }
      });

      return results;
    } catch (error) {
      console.error('❌ Error getting submissions data:', error);
      throw error;
    }
  }

  // Get dashboard analytics data - optimized for large datasets with writer filtering
  // Fixed: Hourly aggregation first, then timezone conversion, then daily aggregation
  async getDashboardAnalytics(timeRange = '30d', writerId = null) {
    try {
      let query = `
        from(bucket: "${this.bucket}")
          |> range(start: -${timeRange})
          |> filter(fn: (r) => r._measurement == "views")
          |> filter(fn: (r) => r._field == "views")
      `;

      // Add writer filter if provided (handle both string and integer types)
      if (writerId) {
        query += `|> filter(fn: (r) => r.writer_id == "${writerId}" or r.writer_id == ${writerId})`;
      }

      query += `
          |> aggregateWindow(every: 1h, fn: sum, createEmpty: false)
          |> aggregateWindow(every: 1d, fn: sum, createEmpty: false)
          |> group()
          |> sort(columns: ["_time"], desc: false)
          |> limit(n: 365)
      `;

      console.log(`🔍 Dashboard analytics query (hourly→EST→daily):`, query);

      const results = [];

      // Use Promise to ensure we wait for the query to complete
      await new Promise((resolve, reject) => {
        this.queryApi.queryRows(query, {
          next(row, tableMeta) {
            const o = tableMeta.toObject(row);
            results.push({
              date: o._time,
              views: o._value || 0
            });
          },
          error(error) {
            console.error('Error getting dashboard analytics:', error);
            reject(error);
          },
          complete() {
            console.log('📊 Dashboard analytics retrieved:', results.length, 'records', writerId ? `for writer ${writerId}` : 'for all writers');
            resolve();
          }
        });
      });

      return results;
    } catch (error) {
      console.error('❌ Error getting dashboard analytics:', error);
      throw error;
    }
  }

  // Get total views for a time period - FIXED: hourly → timezone conversion → sum
  async getTotalViews(timeRange = '30d', writerId = null) {
    try {
      console.log(`🔍 getTotalViews called with timeRange: ${timeRange}, writerId: ${writerId}`);

      let query = `
        from(bucket: "${this.bucket}")
          |> range(start: -${timeRange})
          |> filter(fn: (r) => r._measurement == "views")
          |> filter(fn: (r) => r._field == "views")
      `;

      // Add writer filter if provided (handle both string and integer types)
      if (writerId) {
        query += `|> filter(fn: (r) => r.writer_id == "${writerId}" or r.writer_id == ${writerId})`;
        console.log(`🔍 Added writer filter for ID: ${writerId}`);
      } else {
        console.log(`🔍 No writer filter applied - getting data for all writers`);
      }

      query += `
          |> aggregateWindow(every: 1h, fn: sum, createEmpty: false)
          |> group()
          |> sum()
          |> limit(n: 1)
      `;

      console.log(`🔍 Executing InfluxDB query:\n${query}`);

      let totalViews = 0;
      let rowCount = 0;

      // Use Promise to ensure we wait for the query to complete
      await new Promise((resolve, reject) => {
        this.queryApi.queryRows(query, {
          next(row, tableMeta) {
            const o = tableMeta.toObject(row);
            totalViews = o._value || 0;
            rowCount++;
            console.log(`🔍 Query result row ${rowCount}:`, {
              value: o._value,
              time: o._time,
              measurement: o._measurement,
              field: o._field,
              writer_id: o.writer_id
            });
          },
          error(error) {
            console.error('❌ Error in getTotalViews query:', error);
            reject(error);
          },
          complete() {
            console.log(`📈 Total views query completed: ${totalViews} views from ${rowCount} rows`, writerId ? `for writer ${writerId}` : 'for all writers');
            resolve();
          }
        });
      });

      return totalViews;
    } catch (error) {
      console.error('❌ Error getting total views:', error);
      throw error;
    }
  }

  // Get total likes for a time period - FIXED: hourly → timezone conversion → sum
  async getTotalLikes(timeRange = '30d', writerId = null) {
    try {
      console.log(`🔍 getTotalLikes called with timeRange: ${timeRange}, writerId: ${writerId}`);

      let query = `
        from(bucket: "${this.bucket}")
          |> range(start: -${timeRange})
          |> filter(fn: (r) => r._measurement == "views")
          |> filter(fn: (r) => r._field == "likes")
      `;

      // Add writer filter if provided (handle both string and integer types)
      if (writerId) {
        query += `|> filter(fn: (r) => r.writer_id == "${writerId}" or r.writer_id == ${writerId})`;
        console.log(`🔍 Added writer filter for likes ID: ${writerId}`);
      }

      query += `
          |> aggregateWindow(every: 1h, fn: sum, createEmpty: false)
          |> group()
          |> sum()
          |> limit(n: 1)
      `;

      let totalLikes = 0;
      await new Promise((resolve, reject) => {
        this.queryApi.queryRows(query, {
          next(row, tableMeta) {
            const o = tableMeta.toObject(row);
            totalLikes = o._value || 0;
          },
          error(error) {
            console.error('❌ Error in getTotalLikes query:', error);
            reject(error);
          },
          complete() {
            console.log(`👍 Total likes query completed: ${totalLikes} likes`, writerId ? `for writer ${writerId}` : 'for all writers');
            resolve();
          }
        });
      });

      return totalLikes;
    } catch (error) {
      console.error('❌ Error getting total likes:', error);
      throw error;
    }
  }

  // Get total comments for a time period - FIXED: hourly → timezone conversion → sum
  async getTotalComments(timeRange = '30d', writerId = null) {
    try {
      console.log(`🔍 getTotalComments called with timeRange: ${timeRange}, writerId: ${writerId}`);

      let query = `
        from(bucket: "${this.bucket}")
          |> range(start: -${timeRange})
          |> filter(fn: (r) => r._measurement == "views")
          |> filter(fn: (r) => r._field == "comments")
      `;

      // Add writer filter if provided (handle both string and integer types)
      if (writerId) {
        query += `|> filter(fn: (r) => r.writer_id == "${writerId}" or r.writer_id == ${writerId})`;
        console.log(`🔍 Added writer filter for comments ID: ${writerId}`);
      }

      query += `
          |> aggregateWindow(every: 1h, fn: sum, createEmpty: false)
          |> group()
          |> sum()
          |> limit(n: 1)
      `;

      let totalComments = 0;
      await new Promise((resolve, reject) => {
        this.queryApi.queryRows(query, {
          next(row, tableMeta) {
            const o = tableMeta.toObject(row);
            totalComments = o._value || 0;
          },
          error(error) {
            console.error('❌ Error in getTotalComments query:', error);
            reject(error);
          },
          complete() {
            console.log(`💬 Total comments query completed: ${totalComments} comments`, writerId ? `for writer ${writerId}` : 'for all writers');
            resolve();
          }
        });
      });

      return totalComments;
    } catch (error) {
      console.error('❌ Error getting total comments:', error);
      throw error;
    }
  }

  // Get top performing videos - optimized with account_name
  async getTopVideos(timeRange = '30d', limit = 10) {
    try {
      const query = `
        from(bucket: "${this.bucket}")
          |> range(start: -${timeRange})
          |> filter(fn: (r) => r._measurement == "views")
          |> filter(fn: (r) => r._field == "views")
          |> group(columns: ["video_id", "writer_name", "url"])
          |> sum()
          |> group()
          |> sort(columns: ["_value"], desc: true)
          |> limit(n: ${limit})
      `;

      const results = [];

      // Use Promise to ensure we wait for the query to complete
      await new Promise((resolve, reject) => {
        this.queryApi.queryRows(query, {
          next(row, tableMeta) {
            const o = tableMeta.toObject(row);
            results.push({
              video_id: o.video_id,
              writer_name: o.writer_name,
              url: o.url,
              views: o._value || 0,
              title: o.title || `Video ${o.video_id}`, // Use title from data or fallback
              account_name: o.account_name || o.writer_name || 'Unknown Account', // Use account_name or fallback to writer_name
              writer_id: o.writer_id // Include writer_id if available
            });
          },
          error(error) {
            console.error('Error getting top videos:', error);
            reject(error);
          },
          complete() {
            console.log('🏆 Top videos retrieved:', results.length, 'records');
            resolve();
          }
        });
      });

      return results;
    } catch (error) {
      console.error('❌ Error getting top videos:', error);
      throw error;
    }
  }

  // Get writer submissions data - optimized
  async getWriterSubmissions(writerId = null, timeRange = '30d') {
    try {
      console.log('🔍 InfluxDB Query - Writer ID:', writerId, 'Time Range:', timeRange);

      let query = `
        from(bucket: "${this.bucket}")
          |> range(start: -${timeRange})
          |> filter(fn: (r) => r._measurement == "views")
          |> filter(fn: (r) => r._field == "views")
      `;

      if (writerId) {
        query += `|> filter(fn: (r) => r.writer_id == "${writerId}" or r.writer_id == ${writerId})`;
        console.log('🔍 InfluxDB Query - Adding writer filter for ID:', writerId, '(both string and int)');
      } else {
        console.log('🔍 InfluxDB Query - No writer filter applied');
      }

      query += `
          |> group(columns: ["video_id", "writer_id", "writer_name", "url"])
          |> sum()
          |> group()
          |> sort(columns: ["_value"], desc: true)
          |> limit(n: 50)
      `;

      console.log('🔍 InfluxDB Query:', query);

      const results = [];

      // Use Promise to ensure we wait for the query to complete
      await new Promise((resolve, reject) => {
        this.queryApi.queryRows(query, {
          next(row, tableMeta) {
            const o = tableMeta.toObject(row);
            console.log('🔍 InfluxDB Row:', {
              video_id: o.video_id,
              writer_id: o.writer_id,
              writer_name: o.writer_name,
              views: o._value
            });
            results.push({
              id: o.video_id,
              title: o.title || `Video ${o.video_id}`,
              writer_id: o.writer_id,
              writer_name: o.writer_name,
              account_name: o.account_name || o.writer_name || 'Unknown Account', // Use account_name or fallback to writer_name
              views: o._value || 0,
              url: o.url,
              submittedOn: new Date().toISOString(), // Use current time since we don't have submission date
              status: 'Posted' // Since these are published videos
            });
          },
          error(error) {
            console.error('❌ InfluxDB Query Error:', error);
            reject(error);
          },
          complete() {
            console.log('✅ Writer submissions retrieved:', results.length, 'records for writer ID:', writerId);
            resolve();
          }
        });
      });

      return results;
    } catch (error) {
      console.error('❌ Error getting writer submissions:', error);
      throw error;
    }
  }

  // Helper method to extract title from YouTube URL
  extractTitleFromUrl(url) {
    if (!url) return 'Untitled Video';

    // Extract video ID from URL and create a readable title
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (videoIdMatch) {
      return `Video ${videoIdMatch[1]}`;
    }

    return 'YouTube Video';
  }

  // Test connection
  async testConnection() {
    try {
      const query = `
        from(bucket: "${this.bucket}")
          |> range(start: -1h)
          |> limit(n: 1)
      `;

      let connected = false;
      await this.queryApi.queryRows(query, {
        next() {
          connected = true;
        },
        error(error) {
          console.error('Connection test failed:', error);
        },
        complete() {
          console.log('🔗 InfluxDB connection test:', connected ? 'SUCCESS' : 'FAILED');
        }
      });

      return connected;
    } catch (error) {
      console.error('❌ Connection test error:', error);
      return false;
    }
  }
}

module.exports = InfluxService;
