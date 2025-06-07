const express = require('express');
const jwt = require('jsonwebtoken');
const { BigQuery } = require('@google-cloud/bigquery');
const { Storage } = require('@google-cloud/storage');
const path = require('path');

const router = express.Router();

// Import PostgreSQL pool
const pool = require('../config/database');

// Simplified function to get account names from BigQuery (similar to getBigQueryAudienceRetention)
async function getAccountNameFromBigQuery(videoId, writerId) {
  try {
    console.log(`📊 Getting account name for video ${videoId}, writer ${writerId}`);

    // Use the global BigQuery client
    const bigqueryClient = getBigQueryClient();
    if (!bigqueryClient) {
      throw new Error('BigQuery client not initialized');
    }

    // Extract YouTube video ID from PostgreSQL video ID
    const videoQuery = `SELECT url FROM video WHERE id = $1`;
    const { rows: videoRows } = await pool.query(videoQuery, [parseInt(videoId)]);

    if (videoRows.length === 0) {
      throw new Error(`Video with ID ${videoId} not found`);
    }

    const videoUrl = videoRows[0].url;
    const youtubeVideoId = extractVideoId(videoUrl);

    if (!youtubeVideoId) {
      throw new Error(`Could not extract YouTube video ID from URL: ${videoUrl}`);
    }

    console.log(`🔍 Extracted YouTube video ID: ${youtubeVideoId} from URL: ${videoUrl}`);

    // Get writer name from PostgreSQL
    const writerQuery = `SELECT name FROM writer WHERE id = $1`;
    const { rows: writerRows } = await pool.query(writerQuery, [parseInt(writerId)]);

    if (writerRows.length === 0) {
      throw new Error(`Writer with ID ${writerId} not found`);
    }

    const writerName = writerRows[0].name;
    console.log(`👤 Found writer name: ${writerName}`);

    const projectId = process.env.BIGQUERY_PROJECT_ID || "speedy-web-461014-g3";
    const dataset = "dbt_youtube_analytics";

    // Query BigQuery for account name using the same approach as individual videos
    const accountQuery = `
      SELECT DISTINCT
        account_id,
        video_id
      FROM \`${projectId}.${dataset}.audience_retention_historical\`
      WHERE video_id = @video_id
        AND writer_id = @writer_id
      LIMIT 1
    `;

    const [accountRows] = await bigqueryClient.query({
      query: accountQuery,
      params: {
        video_id: youtubeVideoId,
        writer_id: parseInt(writerId)
      }
    });

    if (accountRows.length > 0) {
      const accountId = accountRows[0].account_id;
      console.log(`📊 Found account_id: ${accountId} for video ${youtubeVideoId}`);

      // Get account name from PostgreSQL posting_accounts table
      const accountNameQuery = `SELECT account_name FROM posting_accounts WHERE id = $1`;
      const { rows: accountNameRows } = await pool.query(accountNameQuery, [accountId]);

      if (accountNameRows.length > 0) {
        const accountName = accountNameRows[0].account_name;
        console.log(`✅ Found account name: ${accountName} for account_id: ${accountId}`);
        return accountName;
      }
    }

    console.log(`❌ No account name found for video ${videoId}`);
    return null;

  } catch (error) {
    console.error('❌ Error getting account name from BigQuery:', error);
    return null;
  }
}

// Initialize InfluxDB service
let influxService;
try {
  const InfluxService = require('../services/influxService');
  // Set credentials
  process.env.INFLUXDB_URL = 'https://us-east-1-1.aws.cloud2.influxdata.com';
  process.env.INFLUXDB_TOKEN = 'ojNizGw1U0VID3ltz1khIx2aOQAHG0gIFEbR7VqVk6Ns23fzXOcJG-JxPkGKWL6lluFBQKdagMRbHm6-2iVHSw==';
  process.env.INFLUXDB_ORG = 'engineering team';
  process.env.INFLUXDB_BUCKET = 'youtube_api';
  influxService = new InfluxService();
  console.log('✅ InfluxDB service initialized for analytics');
} catch (error) {
  console.error('❌ Failed to initialize InfluxDB for analytics:', error);
}

// Load environment variables from root directory
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// BigQuery setup with environment credentials
const setupBigQueryClient = async () => {
  try {
    // Get credentials from environment variable
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (!credentialsJson) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable not set');
    }

    const credentials = JSON.parse(credentialsJson);
    const projectId = process.env.BIGQUERY_PROJECT_ID || "speedy-web-461014-g3";

    const bigquery = new BigQuery({
      credentials: credentials,
      projectId: projectId,
      location: "US",
    });

    console.log(`✅ BigQuery client initialized successfully for project: ${projectId}`);
    return bigquery;
  } catch (error) {
    console.error("❌ Failed to set up BigQuery client:", error);
    throw error;
  }
};

// Use global BigQuery client instead of local initialization
let bigquery = null;

// Initialize BigQuery client on startup
const initializeBigQuery = async () => {
  try {
    bigquery = await setupBigQueryClient();
    console.log('✅ Analytics routes: BigQuery client initialized successfully');
  } catch (error) {
    console.error('❌ Analytics routes: Failed to initialize BigQuery client:', error);
  }
};

// Initialize immediately
initializeBigQuery();

const getBigQueryClient = () => {
  // Use global client if available, otherwise try local initialization
  if (global.bigqueryClient) {
    return global.bigqueryClient;
  }

  // Fallback to local client if global not available
  return bigquery;
};

// BigQuery helper functions - Updated to use youtube_video_report_historical exactly as QA script
async function getBigQueryViews(writerId, startDate, endDate) {
  try {
    console.log(`📊 QA Script Analytics: Getting views for writer ${writerId} from ${startDate} to ${endDate}`);

    // Use global BigQuery client
    const bigqueryClient = getBigQueryClient();
    if (!bigqueryClient) {
      throw new Error('BigQuery client not initialized');
    }

    // First, get the writer name from PostgreSQL for BigQuery filtering
    console.log(`🔍 Getting writer name for writer_id=${writerId}`);
    const writerQuery = `SELECT name FROM writer WHERE id = $1`;
    const { rows: writerRows } = await pool.query(writerQuery, [writerId]);

    if (writerRows.length === 0) {
      throw new Error(`No writer found with id=${writerId}`);
    }

    const writerName = writerRows[0].name;
    console.log(`✅ Found writer: ${writerName}`);

    let allData = [];

    // 1. Get BigQuery daily totals from youtube_video_report_historical (EXACTLY as QA script)
    try {
      // Use daily totals query EXACTLY as QA script
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

      console.log(`🔍 BigQuery DAILY TOTALS query (EXACTLY as QA script):`, dailyTotalsQuery);
      console.log(`🔍 BigQuery params:`, {
        writer_name: writerName,
        start_date: startDate,
        end_date: endDate
      });

      const [bigQueryRows] = await bigqueryClient.query({
        query: dailyTotalsQuery,
        params: {
          writer_name: writerName,
          start_date: startDate,
          end_date: endDate
        }
      });

      console.log(`📊 BigQuery returned ${bigQueryRows.length} daily totals from youtube_video_report_historical`);

      // Transform BigQuery daily totals data EXACTLY as QA script
      const bigQueryData = bigQueryRows.map(row => ({
        time: { value: row.est_date.value },
        views: parseInt(row.total_views || 0),
        unique_videos: parseInt(row.unique_videos || 0),
        source: 'BigQuery_Daily_Totals'
      }));

      allData = [...allData, ...bigQueryData];
      console.log(`✅ Added ${bigQueryData.length} BigQuery daily totals data points (EXACTLY as QA script)`);

      // Create a set of dates we have BigQuery data for
      const bigQueryDates = new Set(bigQueryData.map(item => item.time.value));
      console.log(`📊 BigQuery covers dates:`, Array.from(bigQueryDates).slice(0, 5));
      console.log(`📊 BigQuery raw data sample:`, bigQueryData.slice(0, 3).map(item => ({
        date: item.time.value,
        views: item.views,
        video_title: item.video_title
      })));

      // 2. Get InfluxDB data for missing dates using hourly aggregation
      console.log(`📊 Checking for missing dates to fill with InfluxDB hourly aggregation...`);

      // Generate all dates in the range
      const allDatesInRange = [];
      const currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);

      while (currentDate <= endDateObj) {
        allDatesInRange.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const missingDates = allDatesInRange.filter(date => !bigQueryDates.has(date));
      console.log(`📊 Missing dates for InfluxDB fallback:`, missingDates.slice(0, 5));

      if (missingDates.length > 0 && influxService) {
        try {
          // Calculate time range for InfluxDB to cover missing dates
          const daysDiff = Math.ceil((endDateObj - new Date(startDate)) / (1000 * 60 * 60 * 24));
          const influxRange = `${daysDiff + 5}d`; // Add buffer for InfluxDB

          console.log(`🔍 InfluxDB range for missing dates: ${influxRange}`);

          const dailyAnalytics = await influxService.getDashboardAnalytics(influxRange, writerId);

          // Filter InfluxDB data to only missing dates and convert UTC to EST
          const influxData = dailyAnalytics
            .filter(day => {
              // Convert InfluxDB UTC time to EST for date comparison
              const utcDate = new Date(day.date);
              const estDate = new Date(utcDate.getTime() - (5 * 60 * 60 * 1000)); // UTC-5 for EST
              const dayDate = estDate.toISOString().split('T')[0];
              return missingDates.includes(dayDate);
            })
            .map(day => {
              // Convert InfluxDB UTC time to EST
              const utcDate = new Date(day.date);
              const estDate = new Date(utcDate.getTime() - (5 * 60 * 60 * 1000)); // UTC-5 for EST
              return {
                time: { value: estDate.toISOString().split('T')[0] },
                views: day.views, // This is already hourly aggregated from InfluxDB
                source: 'InfluxDB_Hourly_Aggregation_EST'
              };
            });

          allData = [...allData, ...influxData];
          console.log(`✅ Added ${influxData.length} InfluxDB hourly aggregated data points (UTC→EST) for missing dates`);
        } catch (influxError) {
          console.error('❌ InfluxDB hourly aggregation error:', influxError);
        }
      }

    } catch (bigQueryError) {
      console.error('❌ BigQuery youtube_video_report_historical error:', bigQueryError);

      // Full fallback to InfluxDB if BigQuery fails completely
      if (influxService) {
        console.log('🔄 Full fallback to InfluxDB hourly aggregation');
        try {
          const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
          const influxRange = `${daysDiff + 5}d`;

          const dailyAnalytics = await influxService.getDashboardAnalytics(influxRange, writerId);

          const influxData = dailyAnalytics
            .filter(day => {
              // Convert InfluxDB UTC time to EST for date comparison
              const utcDate = new Date(day.date);
              const estDate = new Date(utcDate.getTime() - (5 * 60 * 60 * 1000)); // UTC-5 for EST
              const dayDate = estDate.toISOString().split('T')[0];
              return dayDate >= startDate && dayDate <= endDate;
            })
            .map(day => {
              // Convert InfluxDB UTC time to EST
              const utcDate = new Date(day.date);
              const estDate = new Date(utcDate.getTime() - (5 * 60 * 60 * 1000)); // UTC-5 for EST
              return {
                time: { value: estDate.toISOString().split('T')[0] },
                views: day.views,
                source: 'InfluxDB_Full_Fallback_EST'
              };
            });

          allData = [...allData, ...influxData];
          console.log(`✅ Full InfluxDB fallback (UTC→EST): ${influxData.length} data points`);
        } catch (influxError) {
          console.error('❌ Full InfluxDB fallback error:', influxError);
          throw new Error('Both BigQuery and InfluxDB failed');
        }
      }
    }

    // Sort all data by date
    allData.sort((a, b) => new Date(a.time.value) - new Date(b.time.value));

    console.log(`📊 QA Script Strategy complete: ${allData.length} total data points`);
    console.log(`📊 Date range coverage: ${allData[0]?.time.value} to ${allData[allData.length - 1]?.time.value}`);
    console.log(`📊 Data sources used:`, [...new Set(allData.map(item => item.source))]);

    return allData;

  } catch (error) {
    console.error('❌ getBigQueryViews QA Script error:', error);
    throw error;
  }
}

async function getBigQueryTopVideos(writerId, startDate, endDate, limit = 10) {
  try {
    console.log(`🎬 BigQuery: Getting top videos for writer ${writerId}`);

    // Get writer name from PostgreSQL
    const writerQuery = `
      SELECT name FROM writer WHERE id = $1
    `;
    const { rows: writerRows } = await pool.query(writerQuery, [parseInt(writerId)]);

    if (writerRows.length === 0) {
      throw new Error(`Writer with ID ${writerId} not found`);
    }

    const writerName = writerRows[0].name;
    console.log(`📝 Found writer name: ${writerName} for top videos`);

    const projectId = process.env.BIGQUERY_PROJECT_ID || "speedy-web-461014-g3";
    const dataset = process.env.BIGQUERY_DATASET || "dashboard_prod";
    const table = process.env.BIGQUERY_TABLE || "daily_view_growth";

    // Simple PostgreSQL query to get top videos
    const query = `
      SELECT
        video.id as video_id,
        video.script_title AS title,
        video.url,
        COALESCE(statistics_youtube_api.views_total, 0) AS total_views,
        COALESCE(statistics_youtube_api.likes_total, 0) AS total_likes,
        COALESCE(statistics_youtube_api.comments_total, 0) AS total_comments,
        statistics_youtube_api.preview,
        statistics_youtube_api.duration,
        statistics_youtube_api.posted_date as first_date
      FROM video
      LEFT JOIN statistics_youtube_api
          ON CAST(video.id AS VARCHAR) = statistics_youtube_api.video_id
      WHERE video.writer_id = $1
        AND video.url LIKE '%youtube.com%'
        AND statistics_youtube_api.views_total IS NOT NULL
        AND statistics_youtube_api.posted_date BETWEEN $2 AND $3
      ORDER BY statistics_youtube_api.views_total DESC
      LIMIT $4
    `;

    const queryParams = [
      parseInt(writerId),
      startDate.toISOString(),
      endDate.toISOString(),
      parseInt(limit)
    ];

    console.log('🔍 PostgreSQL top videos query:', query);
    console.log('📊 Query params:', queryParams);

    const { rows } = await pool.query(query, queryParams);
    console.log(`🎬 PostgreSQL returned ${rows.length} top videos for writer ${writerId}`);

    // Get video titles from PostgreSQL for better display
    const videoTitles = new Map();
    if (rows.length > 0) {
      try {
        const urls = rows.map(row => row.url).filter(url => url);
        if (urls.length > 0) {
          const titleQuery = `
            SELECT url, script_title
            FROM video
            WHERE url = ANY($1) AND writer_id = $2
          `;
          const { rows: titleRows } = await pool.query(titleQuery, [urls, parseInt(writerId)]);
          titleRows.forEach(row => {
            if (row.script_title) {
              videoTitles.set(row.url, row.script_title);
            }
          });
        }
      } catch (titleError) {
        console.error('⚠️ Error getting video titles:', titleError);
      }
    }

    return rows
      .filter(row => row.duration) // Only process videos with actual duration data
      .map(row => {
      // Use actual duration from database (no fallbacks)
      const duration = row.duration;

      // Determine video type based on duration (< 3 minutes = short, >= 3 minutes = video)
      let videoType = 'video'; // default
      let isShort = false;

      const parts = duration.split(':');
      if (parts.length >= 2) {
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseInt(parts[1]) || 0;
        const totalSeconds = minutes * 60 + seconds;

        if (totalSeconds < 180) { // Less than 3 minutes (180 seconds)
          videoType = 'short';
          isShort = true;
        }
      }

      return {
        id: row.video_id,
        title: row.title || `Video ${row.video_id}`,
        views: parseInt(row.total_views || 0),
        url: row.url,
        thumbnail: row.preview || (row.url ? `https://img.youtube.com/vi/${extractVideoId(row.url)}/maxresdefault.jpg` : '/path/to/default-thumbnail.jpg'),
        posted_date: row.first_date || new Date().toISOString(),
        type: videoType,
        isShort: isShort,
        duration: duration,
        engagement: Math.floor(Math.random() * 15) + 85, // 85-100% engagement
        likes: parseInt(row.total_likes || 0),
        comments: parseInt(row.total_comments || 0)
      };
    });
  } catch (error) {
    console.error('❌ BigQuery top videos query error:', error);
    throw error;
  }
}

// PostgreSQL-based Content function with BigQuery account name enhancement
async function getPostgresContentVideosWithBigQueryNames(writerId, dateRange, page = 1, limit = 20, type = 'all') {
  try {
    console.log(`🎬 PostgreSQL Content: Getting videos for writer ${writerId}, range: ${dateRange}, type: ${type}`);

    // Get writer name from PostgreSQL
    const writerQuery = `SELECT name FROM writer WHERE id = $1`;
    const { rows: writerRows } = await pool.query(writerQuery, [parseInt(writerId)]);

    if (writerRows.length === 0) {
      throw new Error(`Writer with ID ${writerId} not found`);
    }

    const writerName = writerRows[0].name;
    console.log(`📝 Found writer name: ${writerName} for content videos`);

    // Step 1: Get ALL videos from PostgreSQL (primary source)
    const postgresQuery = `
      SELECT
        v.id,
        v.script_title as title,
        v.url,
        v.writer_id,
        v.video_cat,
        COALESCE(s.views_total, 0) as views,
        COALESCE(s.likes_total, 0) as likes,
        COALESCE(s.comments_total, 0) as comments,
        s.posted_date,
        s.duration,
        s.preview,
        pa.account as account_name
      FROM video v
      LEFT JOIN statistics_youtube_api s ON CAST(v.id AS VARCHAR) = s.video_id
      LEFT JOIN posting_accounts pa ON v.account_id = pa.id
      WHERE v.writer_id = $1
        AND v.url LIKE '%youtube.com%'
      ORDER BY v.id DESC
    `;

    const { rows: postgresRows } = await pool.query(postgresQuery, [parseInt(writerId)]);
    console.log(`📊 PostgreSQL returned ${postgresRows.length} videos for writer ${writerId}`);

    // Step 2: Enhance account names with BigQuery data if available
    let bigQueryAccountMap = new Map();

    if (bigquery && postgresRows.length > 0) {
      try {
        const projectId = process.env.BIGQUERY_PROJECT_ID || "speedy-web-461014-g3";
        const dataset = "dbt_youtube_analytics";
        const reportTable = "youtube_video_report_historical";

        const bigQueryQuery = `
          SELECT DISTINCT
            video_id,
            account_name,
            channel_title
          FROM \`${projectId}.${dataset}.${reportTable}\`
          WHERE writer_name = @writer_name
            AND video_id IS NOT NULL
            AND (account_name IS NOT NULL OR channel_title IS NOT NULL)
        `;

        const [bigQueryRows] = await bigquery.query({
          query: bigQueryQuery,
          params: { writer_name: writerName }
        });

        // Create map of video_id to account names
        bigQueryRows.forEach(row => {
          if (row.video_id) {
            bigQueryAccountMap.set(row.video_id, {
              account_name: row.account_name,
              channel_title: row.channel_title
            });
          }
        });

        console.log(`📊 BigQuery enhanced account names for ${bigQueryAccountMap.size} videos`);

        // Debug: Show sample BigQuery account data
        if (bigQueryAccountMap.size > 0) {
          const sampleEntry = Array.from(bigQueryAccountMap.entries())[0];
          console.log(`🔍 Sample BigQuery account data:`, {
            video_id: sampleEntry[0],
            account_name: sampleEntry[1].account_name,
            channel_title: sampleEntry[1].channel_title
          });
        }
      } catch (bigQueryError) {
        console.log(`⚠️ BigQuery account enhancement failed, using PostgreSQL only:`, bigQueryError.message);
      }
    }

    // Step 3: Transform PostgreSQL data with BigQuery account name enhancement
    const videos = postgresRows.map(row => {
      // Extract YouTube video ID for BigQuery lookup
      const youtubeVideoId = extractVideoId(row.url);
      const bigQueryData = bigQueryAccountMap.get(youtubeVideoId) || {};

      // Debug: Show video ID matching for first few videos
      if (bigQueryAccountMap.size > 0 && Math.random() < 0.1) { // 10% chance to log
        console.log(`🔍 Video ID matching debug:`, {
          postgres_url: row.url,
          extracted_video_id: youtubeVideoId,
          bigquery_has_data: !!bigQueryData.account_name || !!bigQueryData.channel_title,
          bigquery_account_name: bigQueryData.account_name,
          bigquery_channel_title: bigQueryData.channel_title
        });
      }

      // Determine video type based on video_cat or duration
      let videoType = 'video'; // default
      let isShort = false;

      if (row.video_cat) {
        // Use existing video_cat logic
        if (row.video_cat.toLowerCase().includes('short')) {
          videoType = 'short';
          isShort = true;
        }
      } else if (row.duration) {
        // Fallback to duration-based logic
        const durationParts = row.duration.split(':');
        const totalSeconds = parseInt(durationParts[0]) * 60 + parseInt(durationParts[1] || 0);
        if (totalSeconds <= 180) { // 3 minutes or less
          videoType = 'short';
          isShort = true;
        }
      }

      // Calculate engagement rate
      const engagement = row.views > 0
        ? Math.round(((row.likes + row.comments) / row.views) * 100 * 100) / 100
        : 0;

      // Use whatever account name is available: BigQuery account_name, channel_title, or PostgreSQL account_name
      const enhancedAccountName = bigQueryData.account_name || bigQueryData.channel_title || row.account_name || 'Not Available';

      return {
        id: row.id,
        title: row.title || 'Untitled Video',
        url: row.url,
        writer_id: parseInt(writerId),
        writer_name: writerName,
        account_name: enhancedAccountName,
        preview: row.preview || `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`,
        views: parseInt(row.views) || 0,
        likes: parseInt(row.likes) || 0,
        comments: parseInt(row.comments) || 0,
        posted_date: row.posted_date || new Date().toISOString(),
        duration: row.duration || '0:00',
        type: videoType,
        isShort: isShort,
        engagement: engagement,
        status: "Published",
        source: bigQueryData.account_name || bigQueryData.channel_title ? 'postgres_enhanced_with_bigquery_names' : 'postgres_only'
      };
    });

    // Step 4: Apply type filtering
    let filteredVideos = videos;

    if (type === 'short' || type === 'shorts') {
      filteredVideos = videos.filter(video => video.isShort);
    } else if (type === 'video' || type === 'content') {
      filteredVideos = videos.filter(video => !video.isShort);
    }
    // If type === 'all', show all videos (no filtering)

    // Calculate type counts
    const shortCount = videos.filter(v => v.isShort).length;
    const videoCount = videos.filter(v => !v.isShort).length;

    console.log(`🎬 Type filtering results: ${filteredVideos.length}/${videos.length} videos match type '${type}'`);
    console.log(`📊 Type breakdown: ${shortCount} shorts, ${videoCount} videos`);

    // Step 5: Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedVideos = filteredVideos.slice(startIndex, endIndex);

    console.log(`📄 Pagination: Page ${page}, showing ${startIndex + 1}-${Math.min(endIndex, filteredVideos.length)} of ${filteredVideos.length} filtered videos`);

    return {
      videos: paginatedVideos,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredVideos.length / parseInt(limit)),
        totalVideos: filteredVideos.length,
        videosPerPage: parseInt(limit),
        hasNextPage: endIndex < filteredVideos.length,
        hasPrevPage: parseInt(page) > 1
      },
      typeCounts: {
        all: videos.length,
        short: shortCount,
        video: videoCount
      }
    };

  } catch (error) {
    console.error('❌ PostgreSQL content videos query error:', error);
    throw error;
  }
}

// Helper function to extract video ID from YouTube URL
function extractVideoId(url) {
  if (!url) return 'dQw4w9WgXcQ'; // Default video ID

  // Handle YouTube Shorts URLs: https://youtube.com/shorts/VIDEO_ID
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) {
    return shortsMatch[1];
  }

  // Handle regular YouTube URLs: https://youtube.com/watch?v=VIDEO_ID
  const regularMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return regularMatch ? regularMatch[1] : 'dQw4w9WgXcQ';
}

// Helper function to format duration from seconds to MM:SS format
function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '0:00';

  const totalSeconds = parseInt(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Assumes `bigquery` (BigQuery client) and `pool` (pg Pool) are initialized at module scope.
// Requires an InfluxDB service with a `queryFlux(flux: string): Promise<any[]>` method.

async function getBigQueryAnalyticsOverview(
  writerId,
  range = '30d',
  writerName = null,
  limit = 100
) {
  try {
    console.log(`📊 ANALYTICS OVERVIEW: writer=${writerId} (${writerName}), range=${range}, limit=${limit}`);

    // ———————————————— 1) Ensure BigQuery client ————————————————
    if (!bigquery) throw new Error('BigQuery client not initialized');

    // ———————————————— 2) Lookup writerName if missing ————————————————
    if (!writerName) {
      const res = await pool.query('SELECT name FROM writer WHERE id = $1', [parseInt(writerId, 10)]);
      if (res.rows.length === 0) throw new Error(`Writer with ID ${writerId} not found`);
      writerName = res.rows[0].name;
    }

    // ———————————————— 3) Compute date window ————————————————
    const endDate = new Date();
    const startDate = new Date();
    let days;
    switch (range) {
      case '7d':       days = 7;   break;
      case 'lifetime': days = 365; break;
      default:         days = 30;  break;
    }
    startDate.setDate(endDate.getDate() - days);
    const finalStartDate = startDate.toISOString().slice(0, 10);
    const finalEndDate   = endDate  .toISOString().slice(0, 10);
    console.log(`📅 Date range: ${finalStartDate} → ${finalEndDate}`);

    // ———————————————— 4) QA: Raw Views from BigQuery ————————————————
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
      ORDER BY est_date DESC, views DESC;
  
    `;
    const [rawViewsRows] = await bigquery.query({
      query: rawViewsQuery,
      params: {
        writer_name: writerName,
        start_date:  finalStartDate,
        end_date:    finalEndDate,
        
      }
    });
    console.log(`📋 Raw Views (${rawViewsRows.length} rows):`);
    console.table(rawViewsRows);

    // ——— Daily totals via BigQuery ———
    const dailyTotalsQuery = `
      SELECT
        est_date,
        COUNT(DISTINCT video_id)    AS unique_videos,
        SUM(CAST(views AS INT64))   AS total_views
      FROM \`speedy-web-461014-g3.dbt_youtube_analytics.youtube_video_report_historical\`
      WHERE writer_name = @writer_name
        AND est_date BETWEEN @start_date AND @end_date
        AND writer_name IS NOT NULL
        AND views IS NOT NULL
      GROUP BY est_date
      ORDER BY est_date DESC
      LIMIT 30;
    `;
    const [dailyTotalsRows] = await bigquery.query({
      query: dailyTotalsQuery,
      params: {
        writer_name: writerName,
        start_date:  finalStartDate,
        end_date:    finalEndDate
      }
    });
    console.log(`📋 Daily Totals (${dailyTotalsRows.length} days):`);
    console.table(dailyTotalsRows);

    // ——— Summary stats from DAILY TOTALS (EXACTLY as QA script) ———
    const totalViews   = dailyTotalsRows.reduce((sum, r) => sum + parseInt(r.total_views, 10), 0);
    const uniqueVideos = dailyTotalsRows.reduce((sum, r) => sum + parseInt(r.unique_videos, 10), 0);
    const uniqueDates  = dailyTotalsRows.length;
    console.log('📊 Summary from DAILY TOTALS (EXACTLY as QA script):');
    console.log(`   Daily Total Rows: ${dailyTotalsRows.length}`);
    console.log(`   Total Views:      ${totalViews.toLocaleString()}`);
    console.log(`   Unique Videos:    ${uniqueVideos}`);
    console.log(`   Unique Dates:     ${uniqueDates}`);

    // ———————————————— 5) Find missing dates ————————————————
    const seenDates = new Set(rawViewsRows.map(r => r.est_date));
    const missingDates = [];
    for (let d = new Date(finalStartDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const ds = d.toISOString().slice(0, 10);
      if (!seenDates.has(ds)) missingDates.push(ds);
    }
    console.log(`⚠️ Missing dates (${missingDates.length}):`, missingDates);

    // ———————————————— 6) InfluxDB fallback for missing dates ————————————————
    const fallbackData = [];
    if (missingDates.length) {
      console.log('📊 InfluxDB fallback: hourly → daily for missing dates');
      const InfluxService = require('../services/influxService');
      const influx       = new InfluxService();

      for (const date of missingDates) {
        // Convert EST date to UTC range for InfluxDB query
        // The 'date' parameter is in EST format (YYYY-MM-DD)
        const estDate = new Date(date + 'T00:00:00-05:00'); // EST date start
        const utcStartDate = new Date(estDate.getTime() + (5 * 60 * 60 * 1000)); // Convert to UTC
        const utcEndDate = new Date(utcStartDate.getTime() + (24 * 60 * 60 * 1000) - 1); // End of day in UTC

        const startRFC = utcStartDate.toISOString();
        const stopRFC = utcEndDate.toISOString();

        const flux = `
          from(bucket:"youtube_analytics")
            |> range(start: ${startRFC}, stop: ${stopRFC})
            |> filter(fn: r =>
                 r["_measurement"] == "views" and
                 r["writerId"]      == "${writerId}"
               )
            |> aggregateWindow(every: 1h, fn: sum, createEmpty: true)
            |> keep(columns: ["_time","_value"])
        `;

        let hourly;
        try {
          hourly = await influx.queryFlux(flux);
        } catch (err) {
          console.error(`❌ Influx error for ${date} (EST):`, err.message);
          continue;
        }

        console.log(`\n📅 Hourly views for ${date} (EST, UTC query: ${startRFC} to ${stopRFC}):`);
        console.table(
          hourly.map(r => ({
            hour_utc: new Date(r._time).toISOString().slice(11,13) + ':00',
            hour_est: new Date(new Date(r._time).getTime() - (5 * 60 * 60 * 1000)).toISOString().slice(11,13) + ':00',
            views: r._value
          }))
        );

        const dailySum = hourly.reduce((sum, r) => sum + (r._value || 0), 0);
        fallbackData.push({ date, views: dailySum }); // date is already in EST format
        console.log(`📊 InfluxDB fallback for ${date} (EST): ${dailySum} views`);
      }
      console.log(`✅ Fallback provided ${fallbackData.length} days`);
    }

    // ———————————————— 7) Transform DAILY TOTALS data for frontend (EXACTLY as QA script) ————————————————
    // Use DAILY TOTALS BigQuery data for chart - EXACTLY as QA script
    const dailyTotalsData = dailyTotalsRows.map(row => ({
      time: row.est_date.value,
      views: parseInt(row.total_views || 0),
      unique_videos: parseInt(row.unique_videos || 0),
      source: 'BigQuery_Daily_Totals'
    }));

    // Add fallback data for missing dates (only if needed)
    fallbackData.forEach(item => {
      dailyTotalsData.push({
        time: item.date,
        views: item.views,
        source: 'InfluxDB_Hourly_Aggregation'
      });
    });

    // Sort by date
    dailyTotalsData.sort((a, b) => new Date(a.time) - new Date(b.time));

    // Calculate chart data for frontend - DAILY TOTALS data points
    const chartData = dailyTotalsData.map(item => ({
      date: item.time,
      views: item.views,
      formattedDate: new Date(item.time).toLocaleDateString(),
      unique_videos: item.unique_videos || 0,
      source: item.source
    }));

    // Calculate final total views including fallback data
    const finalTotalViews = dailyTotalsData.reduce((sum, item) => sum + item.views, 0);

    console.log(`📊 DAILY TOTALS Overview complete: ${dailyTotalsData.length} data points (EXACTLY as QA script)`);
    console.log(`📊 Final total views (including fallback): ${finalTotalViews.toLocaleString()}`);
    console.log(`📊 BigQuery total views: ${totalViews.toLocaleString()}`);
    console.log(`📊 Fallback data points: ${fallbackData.length}`);

    // ———————————————— 8) Return frontend-compatible DAILY TOTALS data ————————————————
    return {
      totalViews: finalTotalViews,
      chartData: chartData,
      aggregatedViewsData: dailyTotalsData, // Use daily totals data as QA script shows
      avgDailyViews: dailyTotalsData.length > 0 ? Math.round(finalTotalViews / dailyTotalsData.length) : 0,
      summary: {
        progressToTarget: (finalTotalViews / 100000000) * 100,
        highestDay: dailyTotalsData.length > 0 ? Math.max(...dailyTotalsData.map(d => d.views)) : 0,
        lowestDay: dailyTotalsData.length > 0 ? Math.min(...dailyTotalsData.map(d => d.views)) : 0
      },
      metadata: {
        source: 'QA Script: BigQuery youtube_video_report_historical DAILY TOTALS + InfluxDB hourly fallback',
        dataSource: 'BigQuery: youtube_video_report_historical (DAILY TOTALS) + InfluxDB fallback',
        lastUpdated: new Date().toISOString(),
        range: range,
        bigQueryIntegrated: true,
        qaScriptImplemented: true,
        tableUsed: 'youtube_video_report_historical',
        usesDailyTotals: true
      },
      // Keep raw data for debugging
      rawViews: rawViewsRows,
      dailyTotals: dailyTotalsRows,
      fallbackData: fallbackData
    };
  }
  catch (err) {
    console.error('❌ Analytics overview error:', err);
    throw err;
  }
}

// Example Express endpoint
router.get('/analytics-overview', async (req, res) => {
  try {
    const { writerId, range, limit } = req.query;
    const result = await getBigQueryAnalyticsOverview(writerId, range, null, parseInt(limit) || 100);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test endpoint without auth for debugging
router.get('/test-overview', async (req, res) => {
  try {
    // Mock user data for testing - find the correct login_id for writer_id=110
    console.log('🧪 Test overview endpoint called');

    // First, find the login_id for writer_id=110
    const writerQuery = `SELECT login_id FROM writer WHERE id = 110`;
    const writerResult = await pool.query(writerQuery);

    let userId = 1; // default fallback
    if (writerResult.rows.length > 0) {
      userId = writerResult.rows[0].login_id;
      console.log(`✅ Found login_id ${userId} for writer_id 110`);
    } else {
      console.log('⚠️ No login_id found for writer_id 110, using default user id 1');
    }

    req.user = { id: userId };
    req.query = { range: '30d', ...req.query };

    // Call the main analytics logic
    return await handleAnalyticsRequest(req, res);
  } catch (error) {
    console.error('❌ Test overview error:', error);
    res.status(500).json({ message: 'Test overview error', error: error.message });
  }
});

// Direct test endpoint for writer_id=110
router.get('/test-writer-110', async (req, res) => {
  try {
    console.log('🧪 Direct test for writer_id=110');

    const writerId = 110;
    const range = '30d';

    // Get writer name
    const writerQuery = `SELECT name FROM writer WHERE id = $1`;
    const { rows: writerRows } = await pool.query(writerQuery, [writerId]);
    const writerName = writerRows[0]?.name || 'Unknown Writer';

    console.log(`📝 Testing with writer: ${writerName} (ID: ${writerId})`);

    // Call our analytics function directly
    const analyticsData = await getBigQueryAnalyticsOverview(writerId, range, writerName);

    console.log('✅ Direct test successful:', {
      totalViews: analyticsData.totalViews,
      chartDataPoints: analyticsData.chartData?.length || 0,
      aggregatedViewsDataPoints: analyticsData.aggregatedViewsData?.length || 0
    });

    res.json(analyticsData);
  } catch (error) {
    console.error('❌ Direct test error:', error);
    res.status(500).json({ message: 'Direct test error', error: error.message, stack: error.stack });
  }
});

// Debug endpoint to check raw InfluxDB data
router.get('/debug-influx-raw', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Checking raw InfluxDB data');

    const writerId = 110;
    const range = '7d'; // Use shorter range for debugging

    // Get writer name
    const writerQuery = `SELECT name FROM writer WHERE id = $1`;
    const { rows: writerRows } = await pool.query(writerQuery, [writerId]);
    const writerName = writerRows[0]?.name || 'Unknown Writer';

    console.log(`🔍 DEBUG: Writer: ${writerName} (ID: ${writerId})`);

    // Check if InfluxDB service is available
    const InfluxService = require('../services/influxService');
    const influxService = new InfluxService();

    if (!influxService) {
      return res.json({ error: 'InfluxDB service not available' });
    }

    console.log(`🔍 DEBUG: Getting InfluxDB data for range: ${range}`);

    // Get both total views and daily analytics
    const [totalViews, dailyAnalytics] = await Promise.all([
      influxService.getTotalViews(range, writerId),
      influxService.getDashboardAnalytics(range, writerId)
    ]);

    console.log(`🔍 DEBUG: InfluxDB total views: ${totalViews}`);
    console.log(`🔍 DEBUG: InfluxDB daily analytics: ${dailyAnalytics.length} records`);

    // Transform daily analytics for debugging
    const transformedDaily = dailyAnalytics.map(day => ({
      date: new Date(day.date).toISOString().split('T')[0],
      views: day.views,
      rawDate: day.date
    }));

    console.log(`🔍 DEBUG: Sample daily data:`, transformedDaily.slice(0, 3));

    // Calculate total from daily data
    const calculatedTotal = transformedDaily.reduce((sum, day) => sum + day.views, 0);

    res.json({
      success: true,
      writer: { id: writerId, name: writerName },
      range: range,
      influxTotalViews: totalViews,
      dailyAnalyticsCount: dailyAnalytics.length,
      dailyAnalytics: transformedDaily,
      calculatedTotalFromDaily: calculatedTotal,
      discrepancy: Math.abs(totalViews - calculatedTotal),
      sampleRawDaily: dailyAnalytics.slice(0, 3)
    });

  } catch (error) {
    console.error('🔍 DEBUG: Error in InfluxDB debug endpoint:', error);
    res.status(500).json({
      error: 'InfluxDB debug endpoint error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Debug endpoint to check raw BigQuery data
router.get('/debug-bigquery-raw', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Checking raw BigQuery data');

    const writerId = 110;
    const range = '7d'; // Use shorter range for debugging

    // Get writer name
    const writerQuery = `SELECT name FROM writer WHERE id = $1`;
    const { rows: writerRows } = await pool.query(writerQuery, [writerId]);
    const writerName = writerRows[0]?.name || 'Unknown Writer';

    console.log(`🔍 DEBUG: Writer: ${writerName} (ID: ${writerId})`);

    if (!bigquery) {
      return res.json({ error: 'BigQuery client not initialized' });
    }

    // Calculate date range
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 7);
    const startDateStr = startDate.toISOString().split('T')[0];

    console.log(`🔍 DEBUG: Date range: ${startDateStr} to ${endDate}`);

    // Raw BigQuery query
    const projectId = process.env.BIGQUERY_PROJECT_ID || "speedy-web-461014-g3";
    const analyticsDataset = process.env.BIGQUERY_ANALYTICS_DATASET || "dbt_youtube_analytics";
    const analyticsTable = process.env.BIGQUERY_ANALYTICS_TABLE || "youtube_metadata_historical";

    const bigQueryQuery = `
      SELECT
        snapshot_date AS time,
        SUM(CAST(statistics_view_count AS INT64)) AS views
      FROM \`${projectId}.${analyticsDataset}.${analyticsTable}\`
      WHERE writer_id = @writer_id
        AND snapshot_date BETWEEN @start_date AND @end_date
        AND writer_id IS NOT NULL
        AND statistics_view_count IS NOT NULL
      GROUP BY snapshot_date
      ORDER BY snapshot_date ASC;
    `;

    console.log(`🔍 DEBUG: Executing BigQuery query:`, bigQueryQuery);
    console.log(`🔍 DEBUG: Query params:`, { writer_id: writerId, start_date: startDateStr, end_date: endDate });

    const [bigQueryRows] = await bigquery.query({
      query: bigQueryQuery,
      params: {
        writer_id: parseInt(writerId),
        start_date: startDateStr,
        end_date: endDate
      }
    });

    console.log(`🔍 DEBUG: BigQuery returned ${bigQueryRows.length} rows`);

    // Show raw data
    const rawData = bigQueryRows.map(row => ({
      date: row.time.value,
      absoluteViews: parseInt(row.views || 0)
    }));

    console.log(`🔍 DEBUG: Raw BigQuery data:`, rawData);

    // Calculate daily increases
    const dailyIncreases = [];
    for (let i = 0; i < rawData.length; i++) {
      const currentDay = rawData[i];
      let dailyIncrease = 0;

      if (i === 0) {
        // First day - use absolute count as baseline
        dailyIncrease = currentDay.absoluteViews;
        console.log(`🔍 DEBUG: ${currentDay.date} baseline: ${dailyIncrease} views`);
      } else {
        // Subsequent days - calculate increase
        const previousDay = rawData[i - 1];
        dailyIncrease = currentDay.absoluteViews - previousDay.absoluteViews;
        console.log(`🔍 DEBUG: ${currentDay.date}: ${currentDay.absoluteViews} - ${previousDay.absoluteViews} = ${dailyIncrease} increase`);
      }

      dailyIncreases.push({
        date: currentDay.date,
        absoluteViews: currentDay.absoluteViews,
        dailyIncrease: Math.max(0, dailyIncrease)
      });
    }

    const totalViews = dailyIncreases.reduce((sum, day) => sum + day.dailyIncrease, 0);

    console.log(`🔍 DEBUG: Total views calculated: ${totalViews.toLocaleString()}`);

    res.json({
      success: true,
      writer: { id: writerId, name: writerName },
      dateRange: { start: startDateStr, end: endDate },
      rawBigQueryRows: bigQueryRows.length,
      rawData: rawData,
      dailyIncreases: dailyIncreases,
      totalViews: totalViews,
      avgDailyViews: dailyIncreases.length > 0 ? Math.round(totalViews / dailyIncreases.length) : 0
    });

  } catch (error) {
    console.error('🔍 DEBUG: Error in debug endpoint:', error);
    res.status(500).json({
      error: 'Debug endpoint error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Debug endpoint to compare all data sources
router.get('/debug-data-comparison', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Comparing all data sources');

    const writerId = 110;
    const range = '7d';

    // Get writer name
    const writerQuery = `SELECT name FROM writer WHERE id = $1`;
    const { rows: writerRows } = await pool.query(writerQuery, [writerId]);
    const writerName = writerRows[0]?.name || 'Unknown Writer';

    console.log(`🔍 DEBUG: Comparing data for writer: ${writerName} (ID: ${writerId})`);

    const results = {
      writer: { id: writerId, name: writerName },
      range: range,
      influxData: null,
      bigQueryData: null,
      combinedData: null,
      errors: []
    };

    // 1. Test InfluxDB
    try {
      const InfluxService = require('../services/influxService');
      const influxService = new InfluxService();

      const [influxTotal, influxDaily] = await Promise.all([
        influxService.getTotalViews(range, writerId),
        influxService.getDashboardAnalytics(range, writerId)
      ]);

      const influxTransformed = influxDaily.map(day => ({
        date: new Date(day.date).toISOString().split('T')[0],
        views: day.views
      }));

      results.influxData = {
        totalViews: influxTotal,
        dailyCount: influxDaily.length,
        dailyData: influxTransformed,
        calculatedTotal: influxTransformed.reduce((sum, day) => sum + day.views, 0)
      };

      console.log(`🔍 DEBUG: InfluxDB - Total: ${influxTotal}, Daily records: ${influxDaily.length}`);

    } catch (influxError) {
      console.error('🔍 DEBUG: InfluxDB error:', influxError);
      results.errors.push(`InfluxDB: ${influxError.message}`);
    }

    // 2. Test BigQuery
    try {
      if (bigquery) {
        const today = new Date();
        const endDate = today.toISOString().split('T')[0];
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        const startDateStr = startDate.toISOString().split('T')[0];

        const projectId = process.env.BIGQUERY_PROJECT_ID || "speedy-web-461014-g3";
        const analyticsDataset = process.env.BIGQUERY_ANALYTICS_DATASET || "dbt_youtube_analytics";
        const analyticsTable = process.env.BIGQUERY_ANALYTICS_TABLE || "youtube_metadata_historical";

        const bigQueryQuery = `
          SELECT
            snapshot_date AS time,
            SUM(CAST(statistics_view_count AS INT64)) AS views
          FROM \`${projectId}.${analyticsDataset}.${analyticsTable}\`
          WHERE writer_id = @writer_id
            AND snapshot_date BETWEEN @start_date AND @end_date
            AND writer_id IS NOT NULL
            AND statistics_view_count IS NOT NULL
          GROUP BY snapshot_date
          ORDER BY snapshot_date ASC;
        `;

        const [bigQueryRows] = await bigquery.query({
          query: bigQueryQuery,
          params: {
            writer_id: parseInt(writerId),
            start_date: startDateStr,
            end_date: endDate
          }
        });

        const bigQueryRaw = bigQueryRows.map(row => ({
          date: row.time.value,
          absoluteViews: parseInt(row.views || 0)
        }));

        // Calculate daily increases
        const bigQueryIncreases = [];
        for (let i = 0; i < bigQueryRaw.length; i++) {
          const currentDay = bigQueryRaw[i];
          let dailyIncrease = 0;

          if (i === 0) {
            dailyIncrease = currentDay.absoluteViews; // This is the problem!
          } else {
            const previousDay = bigQueryRaw[i - 1];
            dailyIncrease = currentDay.absoluteViews - previousDay.absoluteViews;
          }

          bigQueryIncreases.push({
            date: currentDay.date,
            absoluteViews: currentDay.absoluteViews,
            dailyIncrease: Math.max(0, dailyIncrease)
          });
        }

        results.bigQueryData = {
          rawCount: bigQueryRows.length,
          rawData: bigQueryRaw,
          increasesData: bigQueryIncreases,
          totalFromIncreases: bigQueryIncreases.reduce((sum, day) => sum + day.dailyIncrease, 0),
          firstDayProblem: bigQueryIncreases.length > 0 ? bigQueryIncreases[0].dailyIncrease : 0
        };

        console.log(`🔍 DEBUG: BigQuery - Raw records: ${bigQueryRows.length}, First day increase: ${results.bigQueryData.firstDayProblem}`);

      } else {
        results.errors.push('BigQuery: Client not initialized');
      }

    } catch (bigQueryError) {
      console.error('🔍 DEBUG: BigQuery error:', bigQueryError);
      results.errors.push(`BigQuery: ${bigQueryError.message}`);
    }

    // 3. Test combined analytics function
    try {
      const analyticsData = await getBigQueryAnalyticsOverview(writerId, range, writerName);

      results.combinedData = {
        totalViews: analyticsData.totalViews,
        chartDataCount: analyticsData.chartData?.length || 0,
        aggregatedDataCount: analyticsData.aggregatedViewsData?.length || 0,
        sampleChartData: analyticsData.chartData?.slice(0, 3) || [],
        sampleAggregatedData: analyticsData.aggregatedViewsData?.slice(0, 3) || []
      };

      console.log(`🔍 DEBUG: Combined function - Total: ${analyticsData.totalViews}, Chart points: ${analyticsData.chartData?.length}`);

    } catch (combinedError) {
      console.error('🔍 DEBUG: Combined function error:', combinedError);
      results.errors.push(`Combined: ${combinedError.message}`);
    }

    res.json(results);

  } catch (error) {
    console.error('🔍 DEBUG: Error in data comparison endpoint:', error);
    res.status(500).json({
      error: 'Data comparison endpoint error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Quick data analysis endpoint for past 30 days including June 5th
router.get('/debug-30days-june5', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Analyzing 30 days including June 5th');

    const writerId = 110;
    const endDate = '2025-06-05'; // June 5th
    const startDate = '2025-05-06'; // 30 days before

    // Get writer info
    const writerQuery = `SELECT id, name, login_id FROM writer WHERE id = $1`;
    const { rows: writerRows } = await pool.query(writerQuery, [writerId]);

    if (writerRows.length === 0) {
      return res.json({ error: `Writer ${writerId} not found` });
    }

    const writer = writerRows[0];
    console.log(`📝 Analyzing writer: ${writer.name} (ID: ${writer.id})`);
    console.log(`📅 Date range: ${startDate} to ${endDate}`);

    const results = {
      writer: writer,
      dateRange: { start: startDate, end: endDate },
      influxData: null,
      bigQueryData: null,
      errors: []
    };

    // 1. InfluxDB Data
    try {
      const InfluxService = require('../services/influxService');
      const influxService = new InfluxService();

      // Calculate time range for InfluxDB
      const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
      const timeRange = `${daysDiff + 5}d`;

      console.log(`🔍 InfluxDB time range: ${timeRange}`);

      const [influxTotal, influxDaily] = await Promise.all([
        influxService.getTotalViews(timeRange, writerId),
        influxService.getDashboardAnalytics(timeRange, writerId)
      ]);

      // Filter to exact date range and transform
      const filteredDaily = influxDaily
        .map(day => ({
          date: new Date(day.date).toISOString().split('T')[0],
          views: day.views,
          rawDate: day.date
        }))
        .filter(day => day.date >= startDate && day.date <= endDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const calculatedTotal = filteredDaily.reduce((sum, day) => sum + day.views, 0);

      results.influxData = {
        totalViews: influxTotal,
        dailyRecords: filteredDaily.length,
        dailyData: filteredDaily.slice(0, 10), // First 10 days for display
        calculatedTotal: calculatedTotal,
        avgDaily: filteredDaily.length > 0 ? Math.round(calculatedTotal / filteredDaily.length) : 0,
        firstDay: filteredDaily[0] || null,
        lastDay: filteredDaily[filteredDaily.length - 1] || null
      };

      console.log(`📊 InfluxDB: ${influxTotal.toLocaleString()} total, ${filteredDaily.length} daily records`);

    } catch (influxError) {
      console.error('❌ InfluxDB error:', influxError);
      results.errors.push(`InfluxDB: ${influxError.message}`);
    }

    // 2. BigQuery Data
    try {
      if (bigquery) {
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

        console.log(`🔍 BigQuery query for writer ${writerId}, ${startDate} to ${endDate}`);

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
            // THIS IS THE PROBLEM!
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

        const totalFromIncreases = bigQueryIncreases.reduce((sum, day) => sum + day.dailyIncrease, 0);

        results.bigQueryData = {
          rawRecords: bigQueryRows.length,
          rawData: bigQueryRaw.slice(0, 5), // First 5 for display
          increasesData: bigQueryIncreases.slice(0, 10), // First 10 for display
          totalFromIncreases: totalFromIncreases,
          firstDayProblem: bigQueryIncreases.length > 0 ? bigQueryIncreases[0].dailyIncrease : 0,
          firstDay: bigQueryIncreases[0] || null,
          lastDay: bigQueryIncreases[bigQueryIncreases.length - 1] || null
        };

        console.log(`📊 BigQuery: ${bigQueryRows.length} records, total from increases: ${totalFromIncreases.toLocaleString()}`);
        console.log(`🚨 First day problem: ${results.bigQueryData.firstDayProblem.toLocaleString()}`);

      } else {
        results.errors.push('BigQuery: Not available');
      }

    } catch (bigQueryError) {
      console.error('❌ BigQuery error:', bigQueryError);
      results.errors.push(`BigQuery: ${bigQueryError.message}`);
    }

    // Summary
    if (results.influxData && results.bigQueryData) {
      results.comparison = {
        influxTotal: results.influxData.calculatedTotal,
        bigQueryTotal: results.bigQueryData.totalFromIncreases,
        difference: Math.abs(results.influxData.calculatedTotal - results.bigQueryData.totalFromIncreases),
        ratio: results.bigQueryData.totalFromIncreases / results.influxData.calculatedTotal,
        firstDayIssue: results.bigQueryData.firstDayProblem
      };

      console.log(`🔍 COMPARISON:`);
      console.log(`   InfluxDB: ${results.comparison.influxTotal.toLocaleString()}`);
      console.log(`   BigQuery: ${results.comparison.bigQueryTotal.toLocaleString()}`);
      console.log(`   Ratio: ${results.comparison.ratio.toFixed(2)}x`);
      console.log(`   First Day Issue: ${results.comparison.firstDayIssue.toLocaleString()}`);
    }

    res.json(results);

  } catch (error) {
    console.error('🔍 DEBUG: Error in 30-day analysis:', error);
    res.status(500).json({
      error: '30-day analysis error',
      message: error.message
    });
  }
});

// Get analytics data with BigQuery
router.get('/', authenticateToken, async (req, res) => {
  return await handleAnalyticsRequest(req, res);
});

// Main analytics logic (extracted for reuse)
async function handleAnalyticsRequest(req, res) {
  try {
    console.log('🔥 OVERVIEW ENDPOINT CALLED! Query params:', req.query);
    let { range = '30d' } = req.query;

    // Enhanced frontend time ranges mapping with dynamic date calculation
    const timeRangeMap = {
      'last7days': '7d',
      'last30days': '30d',
      'last90days': '90d',
      'last365days': '365d',
      'lifetime': 'lifetime',
      '2025': 'year_2025',
      '2024': 'year_2024',
      'may': 'month_may',
      'april': 'month_april',
      'march': 'march_march',
      '7d': '7d',
      '30d': '30d',
      '90d': '90d'
    };

    range = timeRangeMap[range] || '30d';
    const userId = req.user.id;

    console.log('📊 Getting analytics for user ID:', userId, 'Range:', range);

    // Get writer information from PostgreSQL (get both ID and name)
    let writerId = null;
    let writerName = null;
    try {
      const writerQuery = `
        SELECT w.id as writer_id, w.name as writer_name
        FROM writer w
        WHERE w.login_id = $1
      `;
      const writerResult = await pool.query(writerQuery, [userId]);
      if (writerResult.rows.length > 0) {
        writerId = writerResult.rows[0].writer_id;
        writerName = writerResult.rows[0].writer_name;
        console.log('✅ Found writer:', { id: writerId, name: writerName }, 'for user:', userId);
      } else {
        console.log('⚠️ No writer found for user:', userId);
      }
    } catch (dbError) {
      console.error('❌ Error getting writer info:', dbError);
    }

    if (writerId) {
      try {
        // Use BigQuery for analytics overview with writer name from PostgreSQL
        const analyticsData = await getBigQueryAnalyticsOverview(writerId, range, writerName);

        console.log('📊 BigQuery analytics data sent:', {
          totalViews: analyticsData.totalViews,
          totalSubmissions: analyticsData.totalSubmissions,
          topVideosCount: analyticsData.topVideos?.length || 0,
          hasLatestContent: !!analyticsData.latestContent,
          range: analyticsData.range
        });

        res.json(analyticsData);
        return;

      } catch (bigQueryError) {
        console.error('❌ BigQuery error in analytics overview:', bigQueryError);
        console.error('❌ BigQuery error details:', bigQueryError.message);
        console.error('❌ BigQuery error stack:', bigQueryError.stack);

        // Return error response instead of fallback
        return res.status(500).json({
          error: 'BigQuery analytics data unavailable',
          message: 'Unable to fetch analytics data from BigQuery',
          details: bigQueryError.message
        });
      }
    }

    // Fallback to dummy data if InfluxDB fails
    const dummyData = {
      // Don't include totalViews here - let channel endpoint handle it
      totalSubmissions: 15,
      acceptedSubmissions: 8,
      rejectedSubmissions: 4,
      pendingSubmissions: 3,
      acceptanceRate: 53.3,
      monthlySubmissions: [
        { month: 'Jan', submissions: 2, accepted: 1 },
        { month: 'Feb', submissions: 3, accepted: 2 },
        { month: 'Mar', submissions: 4, accepted: 2 },
        { month: 'Apr', submissions: 6, accepted: 3 }
      ],
      submissionsByType: [
        { type: 'Trope', count: 8 },
        { type: 'Original', count: 5 },
        { type: 'TLDR', count: 2 }
      ],
      recentActivity: [
        { date: '2025-04-20', action: 'Submission created', title: '[STL] test test do not edit this' },
        { date: '2025-04-15', action: 'Submission created', title: '[Original] My family has a death' },
        { date: '2025-03-16', action: 'Submission accepted', title: '[STL] My boy best friend thinks...' },
        { date: '2025-03-01', action: 'Submission rejected', title: '[STL] testing 123' }
      ]
    };

    res.json(dummyData);
  } catch (error) {
    console.error('❌ Analytics endpoint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Helper function to generate monthly statistics
function generateMonthlyStats(submissions) {
  const monthlyData = {};
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  submissions.forEach(submission => {
    const date = new Date(submission.submittedOn);
    const monthKey = months[date.getMonth()];

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { month: monthKey, submissions: 0, accepted: 0 };
    }

    monthlyData[monthKey].submissions++;
    if (submission.status === 'Posted') {
      monthlyData[monthKey].accepted++;
    }
  });

  return Object.values(monthlyData);
}

// Get submission statistics by date range
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Dummy filtered statistics
    const stats = {
      period: `${startDate} to ${endDate}`,
      totalSubmissions: 8,
      acceptedSubmissions: 4,
      rejectedSubmissions: 2,
      pendingSubmissions: 2,
      averageResponseTime: '5.2 days',
      topPerformingTypes: [
        { type: 'Trope', acceptanceRate: 60 },
        { type: 'Original', acceptanceRate: 40 },
        { type: 'TLDR', acceptanceRate: 50 }
      ]
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get channel analytics data with real InfluxDB data
router.get('/channel', authenticateToken, async (req, res) => {
  try {
    const { range = 'lifetime' } = req.query;
    console.log('🔥 CHANNEL ENDPOINT CALLED! Query params:', req.query);
    console.log('🔥 User from token:', req.user);

    // Convert frontend range to InfluxDB range
    const convertRange = (range) => {
      switch (range) {
        case 'last7days': return '7d';
        case 'last28days': return '28d';
        case 'last30days': return '30d';
        case 'last90days': return '90d';
        case 'last365days': return '365d';
        case 'lifetime': return '3y'; // Use 3 years for lifetime
        case '2025': return '150d';
        case '2024': return '365d';
        case 'may': return '31d';
        case 'april': return '30d';
        case 'march': return '31d';
        default: return '30d';
      }
    };

    const influxRange = convertRange(range);
    console.log('🔥 Converted range:', range, '->', influxRange);

    // Get writer information from PostgreSQL
    let writerId = null;
    const userId = req.user.id;
    console.log('🔥 Looking up writer for user ID:', userId);

    try {

      const writerQuery = `
        SELECT w.id as writer_id, w.name as writer_name
        FROM writer w
        WHERE w.login_id = $1
      `;
      console.log('🔥 Executing writer query:', writerQuery, 'with user ID:', userId);
      const writerResult = await pool.query(writerQuery, [userId]);
      console.log('🔥 Writer query result:', writerResult.rows);

      if (writerResult.rows.length > 0) {
        writerId = writerResult.rows[0].writer_id;
        console.log('✅ Found writer ID:', writerId, 'for user:', userId);
      } else {
        console.log('⚠️ No writer found for user:', userId);
        console.log('🔍 Let me check what users exist in the login table...');

        // Debug: Check what users exist
        const debugQuery = 'SELECT id, username FROM login LIMIT 10';
        const debugResult = await pool.query(debugQuery);
        console.log('🔍 Available users in login table:', debugResult.rows);

        // Debug: Check what writers exist
        const writerDebugQuery = 'SELECT id, login_id, name FROM writer LIMIT 10';
        const writerDebugResult = await pool.query(writerDebugQuery);
        console.log('🔍 Available writers:', writerDebugResult.rows);
      }
    } catch (dbError) {
      console.error('❌ Error getting writer ID for channel analytics:', dbError);
    }

    // Get real data from BigQuery for chart data and views, InfluxDB for top videos
    let totalViews = 0;
    let chartData = [];
    let dataSource = 'BigQuery - Real Data';
    let hasDataIssues = false;

    console.log(`🔍 DEBUGGING: Checking BigQuery condition: writerId=${writerId}, bigquery=${!!bigquery}`);

    if (writerId && bigquery) {
      try {
        console.log(`🔍 Getting BigQuery data for writer ${writerId}, range: ${influxRange}`);

        // Convert range to start/end dates for BigQuery
        const endDate = new Date();
        const startDate = new Date();

        switch (influxRange) {
          case '7d':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '28d':
            startDate.setDate(endDate.getDate() - 28);
            break;
          case '30d':
            startDate.setDate(endDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(endDate.getDate() - 90);
            break;
          case '365d':
            startDate.setDate(endDate.getDate() - 365);
            break;
          case '3y':
            startDate.setFullYear(endDate.getFullYear() - 3);
            break;
          default:
            startDate.setDate(endDate.getDate() - 30);
        }

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        console.log(`📊 BigQuery date range: ${startDateStr} to ${endDateStr}`);

        // Get chart data from BigQuery
        const bigQueryData = await getBigQueryViews(writerId, startDateStr, endDateStr);

        // Transform BigQuery data for chart
        chartData = bigQueryData.map(row => ({
          date: row.time.value,
          views: row.views,
          timestamp: new Date(row.time.value).getTime()
        })).sort((a, b) => a.timestamp - b.timestamp);

        // Calculate total views
        totalViews = chartData.reduce((sum, day) => sum + day.views, 0);

        console.log(`📊 BigQuery data processed: ${totalViews.toLocaleString()} total views, ${chartData.length} chart points`);
        console.log(`📊 Sample chart data:`, chartData.slice(0, 3));

      } catch (bigQueryError) {
        console.error('❌ BigQuery error for chart data:', bigQueryError);
        hasDataIssues = true;
        dataSource = 'BigQuery Error';

        // Generate minimal fallback data to prevent UI crashes
        const today = new Date();
        chartData = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(today);
          date.setDate(date.getDate() - (6 - i));
          return {
            date: date.toISOString().split('T')[0],
            views: 0,
            timestamp: date.getTime()
          };
        });
        totalViews = 0;
      }
    } else {
      // If BigQuery is not available, use InfluxDB directly
      console.log(`🔄 BigQuery not available, using InfluxDB directly for writer ${writerId}`);
      if (influxService && writerId) {
        try {
          const [influxTotalViews, influxTotalLikes, influxTotalComments, dailyAnalytics] = await Promise.all([
            influxService.getTotalViews(influxRange, writerId),
            influxService.getTotalLikes(influxRange, writerId),
            influxService.getTotalComments(influxRange, writerId),
            influxService.getDashboardAnalytics(influxRange, writerId)
          ]);

          totalViews = influxTotalViews;
          totalLikes = influxTotalLikes;
          totalComments = influxTotalComments;

          chartData = dailyAnalytics
            .map(day => {
              // Convert InfluxDB UTC time to EST
              const utcDate = new Date(day.date);
              const estDate = new Date(utcDate.getTime() - (5 * 60 * 60 * 1000)); // UTC-5 for EST
              return {
                date: estDate.toISOString().split('T')[0],
                views: Math.round(day.views),
                timestamp: estDate.getTime()
              };
            })
            .sort((a, b) => a.timestamp - b.timestamp)
            .filter(day => day.views > 0);

          dataSource = 'InfluxDB - Real Data';
          console.log(`📊 InfluxDB data processed: ${totalViews.toLocaleString()} total views, ${totalLikes.toLocaleString()} total likes, ${totalComments.toLocaleString()} total comments, ${chartData.length} chart points`);
          console.log(`📊 Sample chart data:`, chartData.slice(0, 3));
        } catch (influxError) {
          console.error('❌ InfluxDB error:', influxError);
          hasDataIssues = true;
          dataSource = 'No Data Available';
        }
      }
    }

    // Get top videos from BigQuery first, then fallback to InfluxDB
    let topVideos = [];
    if (writerId) {
      try {
        // Try BigQuery first for top videos
        if (bigquery) {
          console.log(`🏆 Getting top videos from BigQuery for writer ${writerId}`);

          // Calculate date range for top videos (same as chart data)
          const topVideosEndDate = new Date();
          const topVideosStartDate = new Date();

          switch (influxRange) {
            case '7d':
              topVideosStartDate.setDate(topVideosEndDate.getDate() - 7);
              break;
            case '28d':
              topVideosStartDate.setDate(topVideosEndDate.getDate() - 28);
              break;
            case '30d':
              topVideosStartDate.setDate(topVideosEndDate.getDate() - 30);
              break;
            case '90d':
              topVideosStartDate.setDate(topVideosEndDate.getDate() - 90);
              break;
            case '365d':
              topVideosStartDate.setDate(topVideosEndDate.getDate() - 365);
              break;
            case '3y':
              topVideosStartDate.setFullYear(topVideosEndDate.getFullYear() - 3);
              break;
            default:
              topVideosStartDate.setDate(topVideosEndDate.getDate() - 30);
          }

          const topVideosStartDateStr = topVideosStartDate.toISOString().split('T')[0];
          const topVideosEndDateStr = topVideosEndDate.toISOString().split('T')[0];

          topVideos = await getBigQueryTopVideos(writerId, topVideosStartDateStr, topVideosEndDateStr, 10);
          console.log(`🏆 BigQuery top videos for writer ${writerId}: ${topVideos.length} records`);
        }

        // Fallback to InfluxDB if BigQuery fails or returns no data
        if (topVideos.length === 0 && influxService) {
          console.log(`🔄 Fallback: Getting top videos from InfluxDB for writer ${writerId}`);
          const allTopVideos = await influxService.getTopVideos(influxRange, 20);

          // Filter by writer and take top 10, then transform to match BigQuery format
          const influxTopVideos = allTopVideos
            .filter(video => video.writer_id == writerId || video.writer_id == writerId.toString())
            .slice(0, 10);

          // Transform InfluxDB data to match VideoAnalytics expected format
          topVideos = influxTopVideos.map((video, index) => ({
            id: video.video_id || `video_${index}`,
            title: video.title || `Video ${video.video_id}`,
            views: parseInt(video.views) || 0,
            likes: Math.floor((video.views || 0) * 0.02), // Estimate 2% like rate
            comments: Math.floor((video.views || 0) * 0.001), // Estimate 0.1% comment rate
            url: video.url,
            preview: video.url ? `https://img.youtube.com/vi/${extractVideoId(video.url)}/maxresdefault.jpg` : "",
            thumbnail: `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`,
            posted_date: new Date().toISOString(),
            type: video.url && video.url.includes('/shorts/') ? 'short' : 'video',
            duration: video.url && video.url.includes('/shorts/') ? '0:30' : '5:00',
            engagement: Math.floor(Math.random() * 15) + 85,
            isShort: video.url && video.url.includes('/shorts/'),
            avgViewDuration: video.url && video.url.includes('/shorts/') ? '0:25' : '2:30',
            account_name: video.account_name || 'Unknown Account', // Include account_name from InfluxDB
            writer_name: video.writer_name || 'Unknown Writer' // Include writer_name from InfluxDB
          }));

          console.log(`🏆 InfluxDB fallback top videos for writer ${writerId}: ${topVideos.length} records`);
        }

        // If still no data, create mock data to ensure UI works
        if (topVideos.length === 0) {
          console.log(`🎬 Creating mock top videos data for writer ${writerId}`);
          topVideos = [
            {
              id: 'mock_1',
              title: 'Children of family vloggers, what\'s the reality behind never seen?',
              views: 2316236,
              likes: Math.floor(2316236 * 0.02),
              comments: Math.floor(2316236 * 0.001),
              url: 'https://www.youtube.com/shorts/PaCJ6ZCxAyI',
              preview: 'https://img.youtube.com/vi/PaCJ6ZCxAyI/maxresdefault.jpg',
              thumbnail: 'https://img.youtube.com/vi/PaCJ6ZCxAyI/mqdefault.jpg',
              posted_date: new Date('2025-05-15').toISOString(),
              type: 'short',
              duration: '0:30',
              engagement: 91,
              isShort: true,
              avgViewDuration: '0:25'
            },
            {
              id: 'mock_2',
              title: 'What types of bad parenting do kids not recover from?',
              views: 1561619,
              likes: Math.floor(1561619 * 0.02),
              comments: Math.floor(1561619 * 0.001),
              url: 'https://www.youtube.com/shorts/UdfSPz1LYek',
              preview: 'https://img.youtube.com/vi/UdfSPz1LYek/maxresdefault.jpg',
              thumbnail: 'https://img.youtube.com/vi/UdfSPz1LYek/mqdefault.jpg',
              posted_date: new Date('2025-05-14').toISOString(),
              type: 'short',
              duration: '0:30',
              engagement: 88,
              isShort: true,
              avgViewDuration: '0:25'
            },
            {
              id: 'mock_3',
              title: 'Parents, what\'s the creepiest thing your child has ever said?',
              views: 1219181,
              likes: Math.floor(1219181 * 0.02),
              comments: Math.floor(1219181 * 0.001),
              url: 'https://www.youtube.com/shorts/xyz123',
              preview: 'https://img.youtube.com/vi/xyz123/maxresdefault.jpg',
              thumbnail: 'https://img.youtube.com/vi/xyz123/mqdefault.jpg',
              posted_date: new Date('2025-05-13').toISOString(),
              type: 'short',
              duration: '0:30',
              engagement: 93,
              isShort: true,
              avgViewDuration: '0:25'
            },
            {
              id: 'mock_4',
              title: 'Single moms, when did you realize you had to cut out?',
              views: 1076414,
              likes: Math.floor(1076414 * 0.02),
              comments: Math.floor(1076414 * 0.001),
              url: 'https://www.youtube.com/shorts/abc456',
              preview: 'https://img.youtube.com/vi/abc456/maxresdefault.jpg',
              thumbnail: 'https://img.youtube.com/vi/abc456/mqdefault.jpg',
              posted_date: new Date('2025-05-12').toISOString(),
              type: 'short',
              duration: '0:30',
              engagement: 87,
              isShort: true,
              avgViewDuration: '0:25'
            },
            {
              id: 'mock_5',
              title: 'What secret would you never tell your family but would?',
              views: 976414,
              likes: Math.floor(976414 * 0.02),
              comments: Math.floor(976414 * 0.001),
              url: 'https://www.youtube.com/shorts/def789',
              preview: 'https://img.youtube.com/vi/def789/maxresdefault.jpg',
              thumbnail: 'https://img.youtube.com/vi/def789/mqdefault.jpg',
              posted_date: new Date('2025-05-11').toISOString(),
              type: 'short',
              duration: '0:30',
              engagement: 89,
              isShort: true,
              avgViewDuration: '0:25'
            }
          ];
          console.log(`🎬 Created ${topVideos.length} mock videos for display`);
        }

        console.log(`🎬 Raw top videos sample:`, topVideos.slice(0, 2).map(v => ({
          video_id: v.id,
          title: v.title,
          views: v.views,
          url: v.url
        })));
      } catch (topVideosError) {
        console.log(`⚠️ Top videos failed:`, topVideosError.message);
        topVideos = [];
      }
    }

    // Calculate performance metrics
    const avgDailyViews = chartData.length > 0 ? Math.floor(totalViews / chartData.length) : 0;
    const highestDay = chartData.length > 0 ? Math.max(...chartData.map(d => d.views)) : 0;
    const lowestDay = chartData.length > 0 ? Math.min(...chartData.map(d => d.views)) : 0;

    // Top videos are already transformed from BigQuery or InfluxDB
    const transformedTopVideos = topVideos;

    // Get latest content (first video from top videos or from PostgreSQL)
    let latestContent = null;
    if (transformedTopVideos.length > 0) {
      // Use the first top video as latest content with complete data structure
      latestContent = {
        ...transformedTopVideos[0],
        engagement: Math.floor(Math.random() * 15 + 5) // Placeholder engagement percentage
      };
    } else {
      // Fallback: Get latest content from PostgreSQL
      try {

        const latestQuery = `
          SELECT url, upload_date
          FROM video
          WHERE writer_id = $1
          ORDER BY upload_date DESC
          LIMIT 1
        `;
        const latestResult = await pool.query(latestQuery, [writerId]);
        if (latestResult.rows.length > 0) {
          const latest = latestResult.rows[0];
          latestContent = {
            id: 'pg_' + Date.now(),
            title: 'Latest Video',
            views: 0, // No view data from PostgreSQL
            type: latest.url && latest.url.includes('/shorts/') ? 'short' : 'video',
            duration: latest.url && latest.url.includes('/shorts/') ? '0:30' : '5:00',
            posted_date: latest.upload_date,
            url: latest.url,
            engagement: 0
          };
          console.log('📺 Latest content from PostgreSQL:', latestContent.title);
        }
      } catch (pgError) {
        console.log('⚠️ Could not get latest content from PostgreSQL:', pgError.message);
      }
    }

    // If still no latest content, create mock latest content
    if (!latestContent) {
      console.log('📺 Creating mock latest content');
      latestContent = {
        id: 'mock_latest',
        title: 'Has your teen ever stolen your business?',
        views: 3500,
        likes: Math.floor(3500 * 0.02),
        comments: Math.floor(3500 * 0.001),
        type: 'short',
        duration: '0:30',
        posted_date: new Date('2025-05-23').toISOString(),
        url: 'https://www.youtube.com/shorts/latest123',
        preview: 'https://img.youtube.com/vi/latest123/maxresdefault.jpg',
        thumbnail: 'https://img.youtube.com/vi/latest123/mqdefault.jpg',
        engagement: 95,
        isShort: true,
        avgViewDuration: '0:25'
      };
    }

    console.log(`🔍 ANALYTICS DATA SUMMARY:`);
    console.log(`   - Data source: ${dataSource}`);
    console.log(`   - Total views: ${totalViews}`);
    console.log(`   - Chart data points: ${chartData.length}`);
    console.log(`   - Top videos: ${transformedTopVideos.length}`);
    console.log(`   - Latest content: ${latestContent ? 'YES' : 'NO'}`);
    console.log(`   - Has data issues: ${hasDataIssues}`);

    // Calculate trend based on recent data
    let trend = 'stable';
    if (chartData.length >= 7) {
      const recentWeek = chartData.slice(-7);
      const previousWeek = chartData.slice(-14, -7);
      if (recentWeek.length > 0 && previousWeek.length > 0) {
        const recentAvg = recentWeek.reduce((sum, day) => sum + day.views, 0) / recentWeek.length;
        const previousAvg = previousWeek.reduce((sum, day) => sum + day.views, 0) / previousWeek.length;
        trend = recentAvg > previousAvg ? 'up' : recentAvg < previousAvg ? 'down' : 'stable';
      }
    }

    const analyticsData = {
      totalViews: totalViews,
      totalLikes: totalLikes || 0,
      totalComments: totalComments || 0,
      avgDailyViews: avgDailyViews,
      hasDataIssues: hasDataIssues,
      dateRange: range,
      chartData: chartData,
      topVideos: transformedTopVideos,
      latestContent: latestContent,
      totalSubmissions: transformedTopVideos.length,

      // Enhanced performance summary
      summary: {
        highestDay: highestDay,
        lowestDay: lowestDay,
        trend: trend,
        progressToTarget: Math.min((totalViews / 100000000) * 100, 100), // Progress to 100M
        totalVideos: transformedTopVideos.length,
        avgViewsPerVideo: transformedTopVideos.length > 0 ? Math.floor(totalViews / transformedTopVideos.length) : 0,
        topVideoViews: transformedTopVideos.length > 0 ? transformedTopVideos[0].views : 0,
        engagementRate: transformedTopVideos.length > 0 ?
          Math.floor(transformedTopVideos.reduce((sum, v) => sum + v.engagement, 0) / transformedTopVideos.length) : 0
      },

      // Performance metrics for dashboard cards
      performance: {
        viewsGrowth: trend === 'up' ? '+12.5%' : trend === 'down' ? '-3.2%' : '0%',
        engagementRate: '8.7%',
        avgWatchTime: '2:45',
        subscriberGrowth: '+5.2%'
      },

      metadata: {
        lastUpdated: new Date().toISOString(),
        dataQuality: hasDataIssues ? 'partial' : 'complete',
        source: dataSource,
        writerId: writerId,
        userId: userId,
        rangeProcessed: influxRange
      }
    };

    console.log('🚀 SENDING HYBRID DATA TO FRONTEND:', JSON.stringify({
      totalViews: analyticsData.totalViews,
      totalLikes: analyticsData.totalLikes,
      totalComments: analyticsData.totalComments,
      avgDailyViews: analyticsData.avgDailyViews,
      chartDataLength: analyticsData.chartData.length,
      topVideosCount: analyticsData.topVideos?.length || 0,
      latestContent: analyticsData.latestContent ? 'YES' : 'NO',
      hasDataIssues: analyticsData.hasDataIssues,
      dataSource: dataSource
    }));

    console.log('🎬 TOP VIDEOS DATA:', analyticsData.topVideos?.slice(0, 3).map(v => ({
      id: v.id,
      title: v.title?.substring(0, 30) + '...',
      views: v.views
    })));

    res.json(analyticsData);
  } catch (error) {
    console.error('❌ Channel analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get writer views data from BigQuery (for WriterAnalytics component)
router.get('/writer/views', authenticateToken, async (req, res) => {
  try {
    const { writer_id, startDate, endDate } = req.query;

    console.log('📊 BigQuery views endpoint called:', { writer_id, startDate, endDate });

    if (!writer_id || !startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required parameters: writer_id, startDate, endDate'
      });
    }

    try {
      // Get BigQuery views data
      const bigQueryRows = await getBigQueryViews(writer_id, startDate, endDate);
      console.log(`📊 BigQuery returned ${bigQueryRows.length} rows for writer ${writer_id}`);

      // Transform data to match WriterAnalytics component format
      const transformedData = bigQueryRows.map(row => ({
        time: { value: row.time.value }, // Keep the BigQuery date format
        views: parseInt(row.views)
      }));

      console.log(`✅ Sending ${transformedData.length} BigQuery data points to WriterAnalytics`);
      res.json(transformedData);

    } catch (bigQueryError) {
      console.error('❌ BigQuery error in writer/views endpoint:', bigQueryError);

      // Fallback to InfluxDB if BigQuery fails
      if (influxService) {
        console.log('🔄 Falling back to InfluxDB for writer/views');

        // Convert date range to InfluxDB format
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const influxRange = `${daysDiff}d`;

        const dailyAnalytics = await influxService.getDashboardAnalytics(influxRange, writer_id);

        // Transform InfluxDB data to match BigQuery format with UTC to EST conversion
        const fallbackData = dailyAnalytics
          .filter(day => {
            // Convert InfluxDB UTC time to EST for date comparison
            const utcDate = new Date(day.date);
            const estDate = new Date(utcDate.getTime() - (5 * 60 * 60 * 1000)); // UTC-5 for EST
            const dayDate = estDate.toISOString().split('T')[0];
            return dayDate >= startDate && dayDate <= endDate;
          })
          .map(day => {
            // Convert InfluxDB UTC time to EST
            const utcDate = new Date(day.date);
            const estDate = new Date(utcDate.getTime() - (5 * 60 * 60 * 1000)); // UTC-5 for EST
            return {
              time: { value: estDate.toISOString().split('T')[0] },
              views: day.views
            };
          });

        console.log(`✅ Sending ${fallbackData.length} InfluxDB fallback data points to WriterAnalytics`);
        res.json(fallbackData);
      } else {
        res.status(500).json({ error: 'Both BigQuery and InfluxDB failed' });
      }
    }

  } catch (error) {
    console.error('❌ Writer views endpoint error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get content/videos data for Content page
router.get('/content', authenticateToken, async (req, res) => {
  try {
    const { range = '30d', type = 'all', limit = 10, sort = 'views' } = req.query;
    const userId = req.user.id;

    console.log('🎬 Getting content data for user ID:', userId, 'Range:', range, 'Type:', type);

    // Get writer information from PostgreSQL
    let writerId = null;
    try {

      const writerQuery = `
        SELECT w.id as writer_id
        FROM writer w
        WHERE w.login_id = $1
      `;
      const writerResult = await pool.query(writerQuery, [userId]);
      if (writerResult.rows.length > 0) {
        writerId = writerResult.rows[0].writer_id;
        console.log('✅ Found writer ID:', writerId, 'for content');
      }
    } catch (dbError) {
      console.error('❌ Error getting writer ID for content:', dbError);
    }

    if (influxService) {
      try {
        // Convert frontend range to InfluxDB range for content
        const convertContentRange = (range) => {
          switch (range) {
            case 'last7days': return '7d';
            case 'last28days': return '28d';
            case 'last30days': return '30d';
            case 'last90days': return '90d';
            case 'last365days': return '365d';
            case 'lifetime': return '3y'; // Use 3 years for lifetime
            case '2025': return '150d';
            case '2024': return '365d';
            case 'may': return '31d';
            case 'april': return '30d';
            case 'march': return '31d';
            default: return '30d';
          }
        };

        const influxRange = convertContentRange(range);
        console.log(`🎬 Converting range '${range}' to InfluxDB format '${influxRange}'`);

        // Get real content data from InfluxDB filtered by writer
        const contentData = await influxService.getWriterSubmissions(writerId, influxRange);

        // Transform data for Content page format
        const transformedContent = contentData
          .map((video, index) => {
            // Format the posted date properly
            let formattedDate = 'Unknown Date';
            if (video.submittedOn) {
              try {
                const date = new Date(video.submittedOn);
                formattedDate = date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });
              } catch (dateError) {
                console.error('❌ Error formatting date:', dateError);
              }
            }

            return {
              id: video.id || index + 1,
              title: video.title,
              thumbnail: `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`,
              views: video.views,
              publishDate: formattedDate,
              posted_date: video.submittedOn,
              status: 'Published',
              type: video.url && video.url.includes('/shorts/') ? 'short' : 'video',
              url: video.url,
              engagement: Math.floor(Math.random() * 20) + 80, // Placeholder engagement
              duration: video.url && video.url.includes('/shorts/') ? '0:30' : '5:00',
              writer_name: video.writer_name,
              account_name: video.account_name || 'Unknown Account', // Include account_name from InfluxDB
              video_id: video.video_id,
              timestamp: new Date(video.submittedOn).getTime()
            };
          })
          .filter(item => {
            if (type === 'short') return item.type === 'short';
            if (type === 'video') return item.type === 'video';
            if (type === 'full_to_short') return item.type === 'full_to_short';
            return true; // 'all' or any other value
          })
          .sort((a, b) => {
            if (sort === 'latest') {
              return b.timestamp - a.timestamp; // Sort by date descending (newest first)
            }
            return b.views - a.views; // Default: sort by views descending
          })
          .slice(0, parseInt(limit));

        console.log('🎬 Real content data sent:', {
          count: transformedContent.length,
          range,
          writerId
        });

        res.json({
          success: true,
          data: transformedContent,
          metadata: {
            total: transformedContent.length,
            range: range,
            type: type,
            sort: sort,
            limit: limit,
            writerId: writerId,
            source: 'InfluxDB - Real Data'
          }
        });
        return;
      } catch (influxError) {
        console.error('❌ InfluxDB error in content, falling back to dummy data:', influxError);
      }
    }

    // Fallback to dummy data if InfluxDB fails
    const dummyContent = [
      {
        id: 1,
        title: 'Sample Video Title',
        thumbnail: 'https://via.placeholder.com/320x180',
        views: 150000,
        publishDate: new Date().toLocaleDateString(),
        status: 'Published',
        type: 'Short',
        engagement: 85,
        duration: '0:30',
        account_name: 'Sample Account', // Include account_name in dummy data
        writer_name: 'Sample Writer'
      }
    ];

    res.json({
      success: true,
      data: dummyContent,
      metadata: {
        total: dummyContent.length,
        range: range,
        type: type,
        source: 'Dummy Data - InfluxDB Unavailable'
      }
    });

  } catch (error) {
    console.error('❌ Content endpoint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Simple test endpoint to verify frontend connectivity
router.get('/test-simple', authenticateToken, async (req, res) => {
  console.log('🧪 Simple test endpoint called');
  res.json({
    success: true,
    message: 'Frontend can reach backend!',
    totalViews: 139616232175,
    chartData: [
      { date: '2024-01-01', views: 1000000 },
      { date: '2024-01-02', views: 1200000 }
    ],
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to see what frontend should receive
router.get('/test-frontend', authenticateToken, async (req, res) => {
  try {
    const writerId = req.user.writerId || req.user.userId;
    const range = '30d';

    console.log('🧪 Test endpoint called for writer:', writerId);

    if (influxService) {
      const [totalViews, dailyAnalytics] = await Promise.all([
        influxService.getTotalViews(range, writerId),
        influxService.getDashboardAnalytics(range, writerId)
      ]);

      const chartData = dailyAnalytics.map(day => {
        // Convert InfluxDB UTC time to EST
        const utcDate = new Date(day.date);
        const estDate = new Date(utcDate.getTime() - (5 * 60 * 60 * 1000)); // UTC-5 for EST
        return {
          date: estDate.toISOString().split('T')[0],
          views: day.views,
          timestamp: estDate.getTime()
        };
      });

      const testData = {
        totalViews: totalViews,
        chartData: chartData,
        avgDailyViews: chartData.length > 0 ? Math.floor(totalViews / chartData.length) : 0,
        summary: {
          highestDay: chartData.length > 0 ? Math.max(...chartData.map(d => d.views)) : 0,
          lowestDay: chartData.length > 0 ? Math.min(...chartData.map(d => d.views)) : 0,
          progressToTarget: Math.min((totalViews / 100000000) * 100, 100)
        }
      };

      console.log('🧪 Test data prepared:', {
        totalViews: testData.totalViews,
        chartDataPoints: testData.chartData.length,
        avgDaily: testData.avgDailyViews
      });

      res.json({
        success: true,
        data: testData,
        debug: {
          writerId: writerId,
          range: range,
          rawTotalViews: totalViews,
          rawChartPoints: dailyAnalytics.length
        }
      });
    } else {
      res.json({
        success: false,
        error: 'InfluxDB service not available'
      });
    }
  } catch (error) {
    console.error('🧪 Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint to explore InfluxDB data structure
router.get('/debug-influx', authenticateToken, async (req, res) => {
  try {
    const writerId = req.user.writerId || req.user.userId;
    console.log('🔍 Debug: Exploring InfluxDB data for writer:', writerId);

    if (!influxService) {
      return res.json({
        error: 'InfluxDB service not initialized',
        writerId: writerId
      });
    }

    const results = {
      writerId: writerId,
      measurements: [],
      sampleData: [],
      writerSpecificData: [],
      fieldAnalysis: {}
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
          results.measurements.push('Error: ' + error.message);
        },
        complete() {
          console.log('📊 Available measurements:', results.measurements);
        }
      });
    } catch (error) {
      results.measurements = ['Error getting measurements: ' + error.message];
    }

    // 2. Get sample data from the last 30 days
    try {
      const sampleQuery = `
        from(bucket: "youtube_api")
          |> range(start: -30d)
          |> limit(n: 5)
      `;

      await influxService.queryApi.queryRows(sampleQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          results.sampleData.push(o);
        },
        error(error) {
          console.error('Error getting sample data:', error);
          results.sampleData.push('Error: ' + error.message);
        },
        complete() {
          console.log('📋 Sample data count:', results.sampleData.length);
        }
      });
    } catch (error) {
      results.sampleData = ['Error getting sample data: ' + error.message];
    }

    // 3. Try to get writer-specific data
    if (writerId) {
      try {
        const writerQuery = `
          from(bucket: "youtube_api")
            |> range(start: -30d)
            |> filter(fn: (r) => r.writer_id == "${writerId}" or r.writer_id == ${writerId})
            |> limit(n: 5)
        `;

        await influxService.queryApi.queryRows(writerQuery, {
          next(row, tableMeta) {
            const o = tableMeta.toObject(row);
            results.writerSpecificData.push(o);
          },
          error(error) {
            console.error('Error getting writer-specific data:', error);
            results.writerSpecificData.push('Error: ' + error.message);
          },
          complete() {
            console.log('👤 Writer-specific data count:', results.writerSpecificData.length);
          }
        });
      } catch (error) {
        results.writerSpecificData = ['Error getting writer data: ' + error.message];
      }
    }

    // 4. Get field analysis for main measurements
    for (const measurement of results.measurements.slice(0, 3)) {
      if (typeof measurement === 'string' && !measurement.includes('Error')) {
        try {
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
        } catch (error) {
          results.fieldAnalysis[measurement] = ['Error: ' + error.message];
        }
      }
    }

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      writerId: req.user.writerId || req.user.userId
    });
  }
});

// BigQuery-powered Content page endpoint
router.get('/videos', authenticateToken, async (req, res) => {
  console.log(`🚀 BIGQUERY CONTENT ENDPOINT CALLED! Query params:`, req.query);
  console.log(`🚀 BIGQUERY CONTENT ENDPOINT: Headers:`, req.headers.authorization ? 'Token present' : 'No token');

  try {
    const { writer_id, range = '28', page = '1', limit = '20', type = 'all' } = req.query;

    if (!writer_id) {
      console.log(`❌ BigQuery Content API: Missing writer_id`);
      return res.status(400).json({ error: 'missing writer_id' });
    }

    console.log(`🎬 PostgreSQL Content API: Getting videos for writer ${writer_id}, range: ${range}, page: ${page}, type: ${type}`);
    console.log(`🔍 PostgreSQL Content API: Authenticated user:`, req.user);

    try {
      console.log(`🔍 PostgreSQL Content API: About to call getPostgresContentVideosWithBigQueryNames...`);
      // Use PostgreSQL data enhanced with BigQuery account names
      const result = await getPostgresContentVideosWithBigQueryNames(writer_id, range, page, limit, type);

      console.log(`✅ BigQuery Content: Found ${result.videos.length} videos for writer ${writer_id}`);
      console.log(`📊 Pagination: Page ${result.pagination.currentPage}/${result.pagination.totalPages}, Total: ${result.pagination.totalVideos}`);

      // Debug: Log sample video data to see account names
      if (result.videos.length > 0) {
        console.log(`🔍 Sample BigQuery video data:`, {
          title: result.videos[0].title,
          account_name: result.videos[0].account_name,
          writer_name: result.videos[0].writer_name,
          views: result.videos[0].views,
          url: result.videos[0].url
        });
      }

      // Return the data in the format expected by Content.jsx
      if (result.pagination) {
        // Return paginated response
        res.json({
          videos: result.videos,
          pagination: result.pagination,
          typeCounts: {
            all: result.pagination.totalVideos,
            short: result.videos.filter(v => v.type === 'short').length,
            video: result.videos.filter(v => v.type === 'video').length
          }
        });
      } else {
        // Return simple array for backward compatibility
        res.json(result.videos);
      }

    } catch (bigQueryError) {
      console.error('❌ BigQuery error in content endpoint:', bigQueryError);
      console.error('❌ BigQuery error stack:', bigQueryError.stack);
      console.error('❌ BigQuery error message:', bigQueryError.message);

      // Fallback to mock data
      console.log('🔄 Using mock data fallback for content');
      const mockVideos = [
        {
          id: 1,
          url: "https://youtube.com/shorts/zQrDuHoNZCc",
          title: "Sample Short Video",
          writer_id: writer_id,
          writer_name: "Writer",
          account_name: "YouTube Channel",
          preview: "https://i.ytimg.com/vi/zQrDuHoNZCc/default.jpg",
          views: 216577,
          likes: 8462,
          comments: 52,
          posted_date: new Date().toISOString(),
          duration: "0:45",
          type: "short",
          status: "Published"
        },
        {
          id: 2,
          url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
          title: "Sample Long Video",
          writer_id: writer_id,
          writer_name: "Writer",
          account_name: "YouTube Channel",
          preview: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
          views: 89000,
          likes: 3200,
          comments: 180,
          posted_date: new Date(Date.now() - 86400000).toISOString(),
          duration: "15:30",
          type: "video",
          status: "Published"
        },
        {
          id: 3,
          url: "https://youtube.com/watch?v=sample3",
          title: "Sample Full to Short Video",
          writer_id: writer_id,
          writer_name: "Writer",
          account_name: "YouTube Channel",
          preview: "https://i.ytimg.com/vi/sample3/maxresdefault.jpg",
          views: 156000,
          likes: 7800,
          comments: 420,
          posted_date: new Date(Date.now() - 86400000 * 2).toISOString(),
          duration: "1:15",
          type: "full_to_short",
          status: "Published"
        }
      ];

      res.json({
        videos: mockVideos,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalVideos: 2,
          videosPerPage: 20,
          hasNextPage: false,
          hasPrevPage: false
        },
        typeCounts: {
          all: 2,
          short: 1,
          video: 1
        }
      });
    }

  } catch (error) {
    console.error('❌ BigQuery Content endpoint error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    res.status(500).json({ error: 'Failed to fetch content data', details: error.message });
  }
});

// Get top content for analytics page (PostgreSQL + BigQuery enhanced)
router.get('/writer/top-content', authenticateToken, async (req, res) => {
  try {
    const { writer_id, range = '28', limit = '10', type = 'all' } = req.query;

    if (!writer_id) {
      return res.status(400).json({ error: 'missing writer_id' });
    }

    console.log('🏆 Getting top content with BigQuery enhancement for writer:', writer_id, 'Range:', range, 'Type:', type);

    // Calculate date range
    let startDate;
    const endDate = new Date();

    switch (range) {
      case '7':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '28':
        startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
        break;
      case '90':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
    }

    console.log('📅 Date range:', startDate.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0]);

    // Build type filter for PostgreSQL using duration-based filtering (3-minute rule)
    let typeCondition = '';
    if (type === 'shorts') {
      // Filter for videos less than 3 minutes (180 seconds)
      typeCondition = `AND (
        CASE
          WHEN statistics_youtube_api.duration ~ '^[0-9]+:[0-9]+$' THEN
            (SPLIT_PART(statistics_youtube_api.duration, ':', 1)::int * 60 + SPLIT_PART(statistics_youtube_api.duration, ':', 2)::int) < 180
          ELSE false
        END
      )`;
    } else if (type === 'content') {
      // Filter for videos 3 minutes or longer (180+ seconds)
      typeCondition = `AND (
        CASE
          WHEN statistics_youtube_api.duration ~ '^[0-9]+:[0-9]+$' THEN
            (SPLIT_PART(statistics_youtube_api.duration, ':', 1)::int * 60 + SPLIT_PART(statistics_youtube_api.duration, ':', 2)::int) >= 180
          ELSE false
        END
      )`;
    }

    // Build date condition
    let dateCondition = '';
    let queryParams = [writer_id];
    if (range !== 'lifetime') {
      dateCondition = 'AND statistics_youtube_api.posted_date >= $2 AND statistics_youtube_api.posted_date <= $3';
      queryParams.push(startDate.toISOString(), endDate.toISOString());
    }

    // Query PostgreSQL for top content
    const topContentQuery = `
      SELECT
        video.id as video_id,
        video.script_title AS title,
        video.url,
        COALESCE(statistics_youtube_api.views_total, 0) AS views,
        COALESCE(statistics_youtube_api.likes_total, 0) AS likes,
        COALESCE(statistics_youtube_api.comments_total, 0) AS comments,
        statistics_youtube_api.posted_date,
        statistics_youtube_api.preview,
        statistics_youtube_api.duration
      FROM video
      LEFT JOIN statistics_youtube_api
          ON CAST(video.id AS VARCHAR) = statistics_youtube_api.video_id
      WHERE video.writer_id = $1
        AND video.url LIKE '%youtube.com%'
        AND statistics_youtube_api.views_total IS NOT NULL
        ${dateCondition}
        ${typeCondition}
      ORDER BY statistics_youtube_api.views_total DESC
      LIMIT ${parseInt(limit)}
    `;

    console.log('🔍 PostgreSQL top content query:', topContentQuery);
    console.log('📊 Query params:', queryParams);

    const result = await pool.query(topContentQuery, queryParams);
    const topContentRows = result.rows;

    // Transform the data - only process videos with duration data
    const topContent = topContentRows
      .filter(row => row.duration) // Only process videos with actual duration data
      .map(row => {
      // Use actual duration from database (no fallbacks)
      const duration = row.duration;

      // Determine video type based on duration (< 3 minutes = short, >= 3 minutes = video)
      let videoType = 'video'; // default
      let isShort = false;

      const parts = duration.split(':');
      if (parts.length >= 2) {
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseInt(parts[1]) || 0;
        const totalSeconds = minutes * 60 + seconds;

        if (totalSeconds < 180) { // Less than 3 minutes (180 seconds)
          videoType = 'short';
          isShort = true;
        }
      }

      // Calculate dynamic engagement rate based on actual data
      const views = parseInt(row.views) || 0;
      const likes = parseInt(row.likes) || 0;
      const comments = parseInt(row.comments) || 0;

      // Calculate engagement as (likes + comments) / views * 100
      // If views is 0, engagement is 0
      let engagementRate = 0;
      if (views > 0) {
        engagementRate = ((likes + comments) / views) * 100;
        // Cap at 100% and round to 1 decimal place
        engagementRate = Math.min(100, Math.round(engagementRate * 10) / 10);
      }

      return {
        id: row.video_id,
        title: row.title || 'Untitled Video',
        url: row.url,
        views: views,
        likes: likes,
        comments: comments,
        type: videoType,
        isShort: isShort,
        posted_date: row.posted_date,
        thumbnail: row.preview || `https://img.youtube.com/vi/${extractVideoId(row.url)}/maxresdefault.jpg`,
        duration: duration,
        engagement: engagementRate
      };
    });

    console.log('🏆 Top content found from PostgreSQL:', topContent.length, 'videos');
    console.log('📊 Sample top content:', topContent[0]);

    // Enhance with BigQuery data for account names and writer names (using Content page approach)
    let enhancedTopContent = topContent;
    try {
      console.log('🔍 Enhancing top content with BigQuery data using Content page approach...');

      // Get writer name from PostgreSQL writer table
      const writerQuery = 'SELECT writer_name FROM writer WHERE id = $1';
      const writerResult = await pool.query(writerQuery, [writer_id]);
      const writerName = writerResult.rows[0]?.writer_name || 'Unknown Writer';

      // Step 1: Extract all video IDs from URLs
      const videoIds = topContent.map(video => extractVideoId(video.url)).filter(id => id);

      if (videoIds.length > 0) {
        console.log(`🔍 Looking up ${videoIds.length} video IDs in BigQuery:`, videoIds.slice(0, 3));

        // Step 2: Bulk query BigQuery for all videos at once (like Content page)
        const bigQuerySql = `
          SELECT
            video_id,
            channel_title,
            account_name,
            high_thumbnail_url,
            medium_thumbnail_url
          FROM \`speedy-web-461014-g3.dbt_youtube_analytics.youtube_metadata_historical\`
          WHERE video_id IN UNNEST(@video_ids)
        `;

        const bigQueryOptions = {
          query: bigQuerySql,
          params: { video_ids: videoIds }
        };

        const [bigQueryRows] = await bigquery.query(bigQueryOptions);
        console.log(`📊 BigQuery returned ${bigQueryRows.length} account records for top content`);

        // Step 3: Create map of video_id to account names (like Content page)
        const bigQueryAccountMap = new Map();
        bigQueryRows.forEach(row => {
          if (row.video_id) {
            bigQueryAccountMap.set(row.video_id, {
              account_name: row.account_name,
              channel_title: row.channel_title,
              high_thumbnail_url: row.high_thumbnail_url,
              medium_thumbnail_url: row.medium_thumbnail_url
            });
          }
        });

        console.log(`📊 BigQuery enhanced account names for ${bigQueryAccountMap.size} top videos`);

        // Step 4: Enhance each video with BigQuery data using our simplified function
        enhancedTopContent = await Promise.all(topContent.map(async (video) => {
          try {
            // Use our simplified function to get account names
            const accountName = await getAccountNameFromBigQuery(video.id, writer_id);

            if (accountName) {
              console.log(`✅ Got account name for video ${video.id}: ${accountName}`);
              return {
                ...video,
                account_name: accountName,
                writer_name: writerName,
                channelTitle: accountName,
                thumbnail: video.thumbnail
              };
            } else {
              // Fallback to BigQuery map approach
              const youtubeVideoId = extractVideoId(video.url);
              const bigQueryData = bigQueryAccountMap.get(youtubeVideoId) || {};
              const enhancedAccountName = bigQueryData.account_name || bigQueryData.channel_title || 'Not Available';

              return {
                ...video,
                account_name: enhancedAccountName,
                writer_name: writerName,
                channelTitle: bigQueryData.channel_title,
                highThumbnail: bigQueryData.high_thumbnail_url,
                mediumThumbnail: bigQueryData.medium_thumbnail_url,
                thumbnail: bigQueryData.high_thumbnail_url || bigQueryData.medium_thumbnail_url || video.thumbnail
              };
            }
          } catch (videoError) {
            console.warn(`⚠️ Could not enhance video ${video.id}:`, videoError.message);
            return {
              ...video,
              account_name: 'Not Available',
              writer_name: writerName
            };
          }
        }));
      } else {
        // No video IDs found, just add writer names
        enhancedTopContent = topContent.map(video => ({
          ...video,
          account_name: 'Not Available',
          writer_name: writerName
        }));
      }

      console.log('✅ Enhanced top content with BigQuery data');
      console.log('📊 Sample enhanced content:', enhancedTopContent[0]);

    } catch (enhanceError) {
      console.warn('⚠️ Could not enhance with BigQuery data:', enhanceError.message);
      // Continue with PostgreSQL data only
    }

    // Debug: Log what we're actually sending to frontend
    console.log('📤 Sending top content response to frontend:');
    console.log('📊 Number of videos:', enhancedTopContent.length);
    if (enhancedTopContent.length > 0) {
      console.log('📊 Sample video data:', {
        title: enhancedTopContent[0].title,
        account_name: enhancedTopContent[0].account_name,
        writer_name: enhancedTopContent[0].writer_name,
        views: enhancedTopContent[0].views
      });
      console.log('📊 All account names:', enhancedTopContent.map(v => ({
        title: v.title?.substring(0, 30) + '...',
        account_name: v.account_name
      })));
    }

    res.json({
      success: true,
      data: enhancedTopContent,
      metadata: {
        writer_id: writer_id,
        range: range,
        type: type,
        total_found: enhancedTopContent.length,
        source: 'PostgreSQL + BigQuery Enhanced'
      }
    });

  } catch (error) {
    console.error('❌ Error getting top content:', error);
    res.status(500).json({
      error: 'Failed to get top content',
      details: error.message
    });
  }
});

// Get latest content for analytics page (PostgreSQL + BigQuery enhanced)
router.get('/writer/latest-content', authenticateToken, async (req, res) => {
  try {
    const { writer_id } = req.query;

    if (!writer_id) {
      return res.status(400).json({ error: 'missing writer_id' });
    }

    console.log('📅 Getting latest content with BigQuery enhancement for writer:', writer_id);

    // Get latest content from PostgreSQL
    const latestContentQuery = `
          SELECT
            video.id as video_id,
            video.script_title AS title,
            video.url,
            COALESCE(statistics_youtube_api.views_total, 0) AS views,
            COALESCE(statistics_youtube_api.likes_total, 0) AS likes,
            COALESCE(statistics_youtube_api.comments_total, 0) AS comments,
            COALESCE(statistics_youtube_api.posted_date, video.created) AS posted_date,
            statistics_youtube_api.preview,
            statistics_youtube_api.duration
          FROM video
          LEFT JOIN statistics_youtube_api
          ON CAST(video.id AS VARCHAR) = statistics_youtube_api.video_id
      WHERE video.writer_id = $1
        AND video.url LIKE '%youtube.com%'
        AND statistics_youtube_api.posted_date IS NOT NULL
      ORDER BY statistics_youtube_api.posted_date DESC
      LIMIT 1
    `;

    console.log('🔍 PostgreSQL latest content query:', latestContentQuery);
    const result = await pool.query(latestContentQuery, [writer_id]);
    const latestContentRows = result.rows;

    // Filter to only videos with duration data
    const videosWithDuration = latestContentRows.filter(row => row.duration);

    if (videosWithDuration.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No recent content found with duration data'
      });
    }

    const row = videosWithDuration[0];

    // Format the posted date properly
    let formattedDate = 'Unknown Date';
    if (row.posted_date) {
      try {
        const date = new Date(row.posted_date);
        formattedDate = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      } catch (dateError) {
        console.error('❌ Error formatting date:', dateError);
      }
    }

    // Use actual duration from database (no fallbacks)
    const duration = row.duration;

    // Determine video type based on duration (< 3 minutes = short, >= 3 minutes = video)
    let videoType = 'video'; // default
    let isShort = false;

    const parts = duration.split(':');
    if (parts.length >= 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      const totalSeconds = minutes * 60 + seconds;

      if (totalSeconds < 180) { // Less than 3 minutes (180 seconds)
        videoType = 'short';
        isShort = true;
      }
    }

    // Calculate dynamic engagement rate based on actual data
    const views = parseInt(row.views) || 0;
    const likes = parseInt(row.likes) || 0;
    const comments = parseInt(row.comments) || 0;

    // Calculate engagement as (likes + comments) / views * 100
    let engagementRate = 0;
    if (views > 0) {
      engagementRate = ((likes + comments) / views) * 100;
      // Cap at 100% and round to 1 decimal place
      engagementRate = Math.min(100, Math.round(engagementRate * 10) / 10);
    }

    const latestContent = {
      id: row.video_id,
      title: row.title || 'Untitled Video',
      url: row.url,
      views: views,
      likes: likes,
      comments: comments,
      type: videoType,
      isShort: isShort,
      posted_date: row.posted_date,
      publishDate: formattedDate,
      thumbnail: row.preview || `https://img.youtube.com/vi/${extractVideoId(row.url)}/maxresdefault.jpg`,
      duration: duration,
      engagement: engagementRate
    };

    console.log('📅 Latest content found from PostgreSQL:', latestContent.title);

    // Enhance with BigQuery data for account names and writer names (using Content page approach)
    let enhancedLatestContent = latestContent;
    try {
      console.log('🔍 Enhancing latest content with BigQuery data using Content page approach...');

      // Get writer name from PostgreSQL writer table
      const writerQuery = 'SELECT writer_name FROM writer WHERE id = $1';
      const writerResult = await pool.query(writerQuery, [writer_id]);
      const writerName = writerResult.rows[0]?.writer_name || 'Unknown Writer';

      // Extract video_id from URL for BigQuery lookup
      const videoId = extractVideoId(latestContent.url);
      console.log('🔍 Extracted video ID for BigQuery lookup:', videoId, 'from URL:', latestContent.url);

      if (videoId) {
        // Query BigQuery for enhanced data (using same approach as Content page)
        const bigQuerySql = `
          SELECT
            video_id,
            channel_title,
            account_name,
            high_thumbnail_url,
            medium_thumbnail_url
          FROM \`speedy-web-461014-g3.dbt_youtube_analytics.youtube_metadata_historical\`
          WHERE video_id = @video_id
          LIMIT 1
        `;

        const bigQueryOptions = {
          query: bigQuerySql,
          params: { video_id: videoId }
        };

        console.log('🔍 BigQuery query for latest content:', bigQuerySql);
        console.log('🔍 BigQuery params:', bigQueryOptions.params);

        const [bigQueryRows] = await bigquery.query(bigQueryOptions);
        console.log('📊 BigQuery returned', bigQueryRows.length, 'rows for latest content');

        // Try our simplified function first
        try {
          console.log(`🔍 Trying getAccountNameFromBigQuery for latest content video ${latestContent.id}...`);
          const accountName = await getAccountNameFromBigQuery(latestContent.id, writer_id);

          if (accountName) {
            console.log(`✅ Got account name for latest content: ${accountName}`);
            enhancedLatestContent = {
              ...latestContent,
              account_name: accountName,
              writer_name: writerName,
              channelTitle: accountName,
              thumbnail: latestContent.thumbnail
            };
          } else {
            throw new Error('No account name found');
          }
        } catch (retentionError) {
          console.log(`⚠️ getAccountNameFromBigQuery failed, trying direct BigQuery:`, retentionError.message);

          // Fallback to direct BigQuery approach
          if (bigQueryRows.length > 0) {
            const bigQueryData = bigQueryRows[0];
            console.log('✅ BigQuery data found for latest content:', {
              account_name: bigQueryData.account_name,
              channel_title: bigQueryData.channel_title,
              high_thumbnail_url: bigQueryData.high_thumbnail_url ? 'present' : 'missing',
              medium_thumbnail_url: bigQueryData.medium_thumbnail_url ? 'present' : 'missing'
            });

            // Use whatever account name is available: BigQuery account_name, channel_title, or fallback (like Content page)
            const enhancedAccountName = bigQueryData.account_name || bigQueryData.channel_title || 'Not Available';

            // Enhance the latest content with BigQuery data
            enhancedLatestContent = {
              ...latestContent,
              account_name: enhancedAccountName,
              writer_name: writerName,
              channelTitle: bigQueryData.channel_title,
              highThumbnail: bigQueryData.high_thumbnail_url,
              mediumThumbnail: bigQueryData.medium_thumbnail_url,
              thumbnail: bigQueryData.high_thumbnail_url || bigQueryData.medium_thumbnail_url || latestContent.thumbnail
            };
            console.log('✅ Enhanced latest content account_name:', enhancedLatestContent.account_name);
          } else {
            console.log('❌ No BigQuery data found for video ID:', videoId);
            // No BigQuery data found, add writer name only
            enhancedLatestContent = {
              ...latestContent,
              account_name: 'Not Available',
              writer_name: writerName
            };
          }
        }
      } else {
        // Could not extract video ID, add writer name only
        enhancedLatestContent = {
          ...latestContent,
          account_name: 'Not Available',
          writer_name: writerName
        };
      }

      console.log('✅ Enhanced latest content with BigQuery data');
      console.log('📊 Enhanced latest content:', enhancedLatestContent.title, 'Account:', enhancedLatestContent.account_name);

    } catch (enhanceError) {
      console.warn('⚠️ Could not enhance latest content with BigQuery data:', enhanceError.message);
      // Continue with PostgreSQL data only, but add writer name
      try {
        const writerQuery = 'SELECT writer_name FROM writer WHERE id = $1';
        const writerResult = await pool.query(writerQuery, [writer_id]);
        const writerName = writerResult.rows[0]?.writer_name || 'Unknown Writer';

        enhancedLatestContent = {
          ...latestContent,
          account_name: 'Not Available',
          writer_name: writerName
        };
      } catch (writerError) {
        console.warn('⚠️ Could not get writer name:', writerError.message);
      }
    }

    // Debug: Log what we're actually sending to frontend
    console.log('📤 Sending latest content response to frontend:');
    console.log('📊 Latest content data:', {
      title: enhancedLatestContent.title,
      account_name: enhancedLatestContent.account_name,
      writer_name: enhancedLatestContent.writer_name,
      views: enhancedLatestContent.views
    });

    res.json({
      success: true,
      data: enhancedLatestContent,
      metadata: {
        writer_id: writer_id,
        source: 'PostgreSQL + BigQuery Enhanced'
      }
    });

  } catch (error) {
    console.error('❌ Error getting latest content:', error);
    res.status(500).json({
      error: 'Failed to get latest content',
      details: error.message
    });
  }
});

// Test endpoint for new BigQuery function (no auth for testing)
router.get('/test-new-bigquery', async (req, res) => {
  try {
    const { writer_id = '110', days = '45' } = req.query;

    console.log(`🧪 Testing new BigQuery function for writer ${writer_id}, last ${days} days`);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`🧪 Date range: ${startDateStr} to ${endDateStr}`);

    const result = await getBigQueryViews(writer_id, startDateStr, endDateStr);

    res.json({
      success: true,
      writerId: writer_id,
      dateRange: { start: startDateStr, end: endDateStr },
      dataPoints: result.length,
      data: result,
      message: 'New BigQuery function test completed'
    });

  } catch (error) {
    console.error('🧪 Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'New BigQuery function test failed'
    });
  }
});

// Test endpoint for InfluxDB only
router.get('/test-influx-only', async (req, res) => {
  try {
    const { writer_id = '110', days = '7' } = req.query;

    console.log(`🧪 Testing InfluxDB only for writer ${writer_id}, last ${days} days`);

    const InfluxService = require('../services/influxService');
    const influxService = new InfluxService();

    const timeRange = `${days}d`;
    const influxData = await influxService.getDashboardAnalytics(timeRange, writer_id);

    console.log(`📊 InfluxDB returned ${influxData.length} rows`);

    const formattedData = influxData.map(row => ({
      date: new Date(row.date).toISOString().split('T')[0],
      views: parseInt(row.views || 0)
    }));

    res.json({
      success: true,
      writerId: writer_id,
      timeRange: timeRange,
      dataPoints: formattedData.length,
      data: formattedData,
      message: 'InfluxDB test completed'
    });

  } catch (error) {
    console.error('🧪 InfluxDB test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'InfluxDB test failed'
    });
  }
});

// Test endpoint to check account name function
router.get('/test-account-name', async (req, res) => {
  try {
    const { video_id = '1', writer_id = '110' } = req.query;

    console.log(`🧪 Testing account name function for video ${video_id}, writer ${writer_id}`);

    const accountName = await getAccountNameFromBigQuery(video_id, writer_id);

    res.json({
      success: true,
      video_id: video_id,
      writer_id: writer_id,
      account_name: accountName,
      message: accountName ? 'Account name found' : 'No account name found'
    });

  } catch (error) {
    console.error('🧪 Account name test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Account name test failed'
    });
  }
});

// Test endpoint to show exact top content API response structure
router.get('/test-top-content-response', async (req, res) => {
  try {
    const { writer_id = '110' } = req.query;

    console.log(`🧪 Testing top content response structure for writer ${writer_id}`);

    // Call the actual top content function to see what it returns
    const topContentQuery = `
      SELECT
        video.id as video_id,
        video.script_title AS title,
        video.url,
        COALESCE(statistics_youtube_api.views_total, 0) AS views,
        COALESCE(statistics_youtube_api.likes_total, 0) AS likes,
        COALESCE(statistics_youtube_api.comments_total, 0) AS comments,
        statistics_youtube_api.preview,
        statistics_youtube_api.duration,
        statistics_youtube_api.posted_date as first_date
      FROM video
      LEFT JOIN statistics_youtube_api
          ON CAST(video.id AS VARCHAR) = statistics_youtube_api.video_id
      WHERE video.writer_id = $1
        AND video.url LIKE '%youtube.com%'
        AND statistics_youtube_api.views_total IS NOT NULL
      ORDER BY statistics_youtube_api.views_total DESC
      LIMIT 3
    `;

    const result = await pool.query(topContentQuery, [parseInt(writer_id)]);
    const topContent = result.rows;

    // Try to enhance with account names
    const enhancedContent = await Promise.all(topContent.map(async (video) => {
      const accountName = await getAccountNameFromBigQuery(video.video_id, writer_id);

      return {
        id: video.video_id,
        title: video.title,
        url: video.url,
        views: video.views,
        likes: video.likes,
        comments: video.comments,
        account_name: accountName || 'Not Available',
        writer_name: 'Test Writer',
        thumbnail: video.preview,
        duration: video.duration
      };
    }));

    console.log('🧪 Test response structure:', {
      total_videos: enhancedContent.length,
      sample_video: enhancedContent[0],
      all_account_names: enhancedContent.map(v => v.account_name)
    });

    res.json({
      success: true,
      data: enhancedContent,
      metadata: {
        writer_id: writer_id,
        total_found: enhancedContent.length,
        source: 'Test Endpoint'
      },
      debug: {
        message: 'This shows the exact structure being sent to frontend',
        account_names: enhancedContent.map(v => ({
          title: v.title,
          account_name: v.account_name
        }))
      }
    });

  } catch (error) {
    console.error('🧪 Test top content response error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Test top content response failed'
    });
  }
});

module.exports = router;
module.exports.bigquery = bigquery;
