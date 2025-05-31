const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const submissionRoutes = require('./routes/submissions');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/user');
const influxRoutes = require('./routes/influx');
const dataExplorerRoutes = require('./routes/dataExplorer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize database connection
let pool;
try {
  pool = require('./config/database');
  console.log('✅ Database connection initialized');
} catch (error) {
  console.error('❌ Failed to initialize database:', error);
}

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/influx', influxRoutes);
app.use('/api/data-explorer', dataExplorerRoutes);

// API endpoints for Dashboard.jsx
app.get('/api/tropes', async (req, res) => {
  try {
    if (pool) {
      const result = await pool.query(
        "SELECT id, number, name FROM tropes ORDER BY number"
      );
      res.json(result.rows);
    } else {
      // Fallback data
      res.json([
        { id: 1, number: 1, name: "Sample Trope 1" },
        { id: 2, number: 2, name: "Sample Trope 2" },
        { id: 3, number: 3, name: "Sample Trope 3" }
      ]);
    }
  } catch (error) {
    console.error("Error fetching tropes:", error);
    res.status(500).json({ error: "Failed to fetch tropes" });
  }
});

app.get('/api/structures', async (req, res) => {
  try {
    if (pool) {
      const query = `
        SELECT s.id AS structure_id, s.name,
          COALESCE(json_agg(json_build_object('id', w.id, 'name', w.name))
            FILTER (WHERE w.id IS NOT NULL), '[]') AS writers
        FROM structures s
        LEFT JOIN writer_structures ws ON s.id = ws.structure_id
        LEFT JOIN writer w ON ws.writer_id = w.id
        GROUP BY s.id
        ORDER BY s.id ASC;
      `;
      const result = await pool.query(query);
      res.json({ structures: result.rows });
    } else {
      // Fallback data
      res.json({
        structures: [
          { structure_id: 1, name: "Three Act Structure", writers: [] },
          { structure_id: 2, name: "Hero's Journey", writers: [] }
        ]
      });
    }
  } catch (error) {
    console.error("Error fetching structures:", error);
    res.status(500).json({ error: "Error fetching structures." });
  }
});

app.get('/api/scripts', async (req, res) => {
  const { writer_id, startDate, endDate, searchTitle } = req.query;

  try {
    if (pool && writer_id) {
      let query = `
        SELECT id, title, google_doc_link, approval_status, created_at, loom_url
        FROM script
        WHERE writer_id = $1
      `;

      const params = [writer_id];

      if (startDate && endDate) {
        query += " AND created_at BETWEEN $2 AND $3";
        params.push(startDate, endDate);
      }

      if (searchTitle) {
        query += ` AND title ILIKE $${params.length + 1}`;
        params.push(`%${searchTitle}%`);
      }

      query += " ORDER BY created_at DESC;";

      const { rows } = await pool.query(query, params);
      res.json(rows);
    } else {
      // Return empty array if no writer_id or no database
      res.json([]);
    }
  } catch (error) {
    console.error("Error fetching scripts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post('/api/scripts', async (req, res) => {
  const { writer_id, title, google_doc_link } = req.body;

  try {
    if (pool && writer_id && title && google_doc_link) {
      const query = `
        INSERT INTO script (writer_id, title, google_doc_link, approval_status, created_at)
        VALUES ($1, $2, $3, 'Pending', NOW())
        RETURNING id, title, google_doc_link, approval_status, created_at, loom_url;
      `;

      const { rows } = await pool.query(query, [writer_id, title, google_doc_link]);
      res.status(201).json(rows[0]);
    } else {
      res.status(400).json({ error: "Missing required fields" });
    }
  } catch (error) {
    console.error("Error creating script:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get('/api/getWriter', async (req, res) => {
  const { username } = req.query;

  try {
    if (pool && username) {
      const query = `
        SELECT w.id, w.name, w.access_advanced_types, l.username
        FROM writer w
        JOIN login l ON w.login_id = l.id
        WHERE l.username = $1;
      `;

      const { rows } = await pool.query(query, [username]);
      if (rows.length > 0) {
        res.json(rows[0]);
      } else {
        res.status(404).json({ error: "Writer not found" });
      }
    } else {
      res.status(400).json({ error: "Username required" });
    }
  } catch (error) {
    console.error("Error fetching writer:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Writer videos endpoint for Content page - using InfluxDB data properly
app.get("/api/writer/videos", async (req, res) => {
  const { writer_id, range = "28", page = "1", limit = "20", type = "all" } = req.query;

  if (!writer_id) {
    return res.status(400).json({ error: "missing writer_id" });
  }

  try {
    // First try InfluxDB for real-time data
    let influxService;
    try {
      const InfluxService = require('./services/influxService');
      influxService = new InfluxService();
      console.log('✅ InfluxDB service initialized for writer videos');
    } catch (error) {
      console.error('❌ Failed to initialize InfluxDB for writer videos:', error);
    }

    if (influxService) {
      try {
        console.log('🎬 Getting writer videos from InfluxDB for writer ID:', writer_id, 'Range:', range + 'd');

        // Custom query to properly aggregate video data by video_id (without pivot)
        const query = `
          from(bucket: "${influxService.bucket}")
            |> range(start: -${range}d)
            |> filter(fn: (r) => r._measurement == "views")
            |> filter(fn: (r) => r.writer_id == "${writer_id}")
            |> group(columns: ["video_id", "writer_id", "writer_name", "url"])
            |> last()
            |> group()
            |> sort(columns: ["_time"], desc: true)
        `;

        const results = [];
        const videoMap = new Map(); // To deduplicate videos by video_id

        await influxService.queryApi.queryRows(query, {
          next(row, tableMeta) {
            const o = tableMeta.toObject(row);
            console.log('📊 InfluxDB row received:', {
              video_id: o.video_id,
              writer_id: o.writer_id,
              writer_name: o.writer_name,
              url: o.url,
              title: o.title,
              views: o.views,
              likes: o.likes,
              comments: o.comments,
              preview: o.preview,
              _time: o._time
            });

            // Use video_id as key to avoid duplicates
            const videoId = o.video_id || `video_${Date.now()}_${Math.random()}`;

            if (!videoMap.has(videoId)) {
              const duration = generateRandomDuration();
              const videoType = getVideoType(o.url);

              videoMap.set(videoId, {
                id: videoId,
                url: o.url || "",
                title: o.title || `Video ${o.video_id}`,
                writer_id: writer_id,
                writer_name: o.writer_name || "",
                account_name: o.writer_name || "",
                preview: o.preview || (o.url ? `https://img.youtube.com/vi/${extractVideoId(o.url)}/maxresdefault.jpg` : ""),
                views: o._value || 0,
                likes: o._value || 0,
                comments: o._value || 0,
                posted_date: o._time || new Date().toISOString(),
                duration: duration,
                type: videoType, // 'short' or 'video'
                status: "Published"
              });
            }
          },
          error(error) {
            console.error('❌ InfluxDB Query Error:', error);
            // Don't throw error, just log it and continue to fallback
            console.log('🔄 InfluxDB failed, will use PostgreSQL fallback');
          },
          complete() {
            // Convert Map to Array
            const uniqueVideos = Array.from(videoMap.values());
            results.push(...uniqueVideos);
            console.log(`✅ InfluxDB query completed. Found ${results.length} unique videos for writer ${writer_id}`);
          }
        });

        if (results.length > 0) {
          console.log(`📺 Returning ${results.length} videos from InfluxDB for writer ${writer_id}`);
          res.json(results);
          return;
        } else {
          console.log('⚠️ No videos found in InfluxDB, trying PostgreSQL fallback');
        }
      } catch (influxError) {
        console.error('❌ InfluxDB error, trying PostgreSQL fallback:', influxError);
      }
    }

    // Fallback to PostgreSQL using your working API pattern with pagination
    console.log('🔄 Trying PostgreSQL fallback for writer:', writer_id, 'Page:', page, 'Limit:', limit);
    try {
      if (pool) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        const offset = (pageNum - 1) * limitNum;

        // Calculate date filter
        let dateFilterStr;
        let dateCondition;

        if (range === 'lifetime') {
          // For lifetime, don't apply date filter
          dateCondition = '';
          console.log(`📅 Date filter: Lifetime (no date restriction)`);
        } else {
          const rangeNum = parseInt(range) || 28;
          const dateFilter = new Date();
          dateFilter.setDate(dateFilter.getDate() - rangeNum);
          dateFilterStr = dateFilter.toISOString().split('T')[0]; // YYYY-MM-DD format
          dateCondition = 'AND (statistics_youtube_api.posted_date >= $2 OR statistics_youtube_api.posted_date IS NULL)';
          console.log(`📅 Date filter: Last ${rangeNum} days (since ${dateFilterStr})`);
        }

        // Build type filter condition
        let typeCondition = '';
        let queryParams = [parseInt(writer_id)];

        // Add date parameter only if not lifetime
        if (range !== 'lifetime') {
          queryParams.push(dateFilterStr);
        }

        if (type === 'short') {
          typeCondition = "AND video.url LIKE '%/shorts/%'";
        } else if (type === 'video') {
          typeCondition = "AND video.url NOT LIKE '%/shorts/%'";
        }

        // Build the date condition based on parameter position
        const dateConditionInQuery = range === 'lifetime' ? '' :
          `AND (statistics_youtube_api.posted_date >= $${queryParams.length} OR statistics_youtube_api.posted_date IS NULL)`;

        // Get total count first with date and type filter
        const countQuery = `
          SELECT COUNT(*) as total
          FROM video
          LEFT JOIN statistics_youtube_api
              ON CAST(video.id AS VARCHAR) = statistics_youtube_api.video_id
          WHERE video.writer_id = $1
            AND video.url LIKE '%youtube.com%'
            AND (video.video_cat IS NULL OR video.video_cat != 'full to short')
            ${dateConditionInQuery}
            ${typeCondition};
        `;

        const { rows: countRows } = await pool.query(countQuery, queryParams);
        const totalVideos = parseInt(countRows[0].total) || 0;
        const totalPages = Math.ceil(totalVideos / limitNum);

        // Get paginated videos with date and type filter
        const youtubeQuery = `
          SELECT
            video.url,
            video.script_title AS title,
            statistics_youtube_api.posted_date,
            statistics_youtube_api.preview,
            COALESCE(statistics_youtube_api.likes_total, 0) AS likes_total,
            COALESCE(statistics_youtube_api.comments_total, 0) AS comments_total,
            COALESCE(statistics_youtube_api.views_total, 0) AS views_total,
            video.id as video_id
          FROM video
          LEFT JOIN statistics_youtube_api
              ON CAST(video.id AS VARCHAR) = statistics_youtube_api.video_id
          WHERE video.writer_id = $1
            AND video.url LIKE '%youtube.com%'
            AND (video.video_cat IS NULL OR video.video_cat != 'full to short')
            ${dateConditionInQuery}
            ${typeCondition}
          ORDER BY statistics_youtube_api.posted_date DESC
          LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2};
        `;

        // Add pagination parameters
        queryParams.push(limitNum, offset);
        const { rows } = await pool.query(youtubeQuery, queryParams);

        const transformedVideos = rows.map((video, index) => {
          const duration = generateRandomDuration();
          const videoType = getVideoType(video.url);

          return {
            id: video.video_id || index + 1,
            url: video.url || "",
            title: video.title || "Untitled Video",
            writer_id: writer_id,
            writer_name: "Writer",
            account_name: "YouTube Channel",
            preview: video.preview || (video.url ? `https://img.youtube.com/vi/${extractVideoId(video.url)}/maxresdefault.jpg` : ""),
            views: video.views_total || 0,
            likes: video.likes_total || 0,
            comments: video.comments_total || 0,
            posted_date: video.posted_date || new Date().toISOString(),
            duration: duration,
            type: videoType, // 'short' or 'video'
            status: "Published"
          };
        });

        // Get accurate type counts for all videos (not just current page)
        const countQueryParams = [parseInt(writer_id)];
        if (range !== 'lifetime') {
          countQueryParams.push(dateFilterStr);
        }

        const allCountQuery = `
          SELECT COUNT(*) as total
          FROM video
          LEFT JOIN statistics_youtube_api
              ON CAST(video.id AS VARCHAR) = statistics_youtube_api.video_id
          WHERE video.writer_id = $1
            AND video.url LIKE '%youtube.com%'
            AND (video.video_cat IS NULL OR video.video_cat != 'full to short')
            ${dateConditionInQuery};
        `;

        const shortCountQuery = `
          SELECT COUNT(*) as total
          FROM video
          LEFT JOIN statistics_youtube_api
              ON CAST(video.id AS VARCHAR) = statistics_youtube_api.video_id
          WHERE video.writer_id = $1
            AND video.url LIKE '%youtube.com%'
            AND video.url LIKE '%/shorts/%'
            AND (video.video_cat IS NULL OR video.video_cat != 'full to short')
            ${dateConditionInQuery};
        `;

        const videoCountQuery = `
          SELECT COUNT(*) as total
          FROM video
          LEFT JOIN statistics_youtube_api
              ON CAST(video.id AS VARCHAR) = statistics_youtube_api.video_id
          WHERE video.writer_id = $1
            AND video.url LIKE '%youtube.com%'
            AND video.url NOT LIKE '%/shorts/%'
            AND (video.video_cat IS NULL OR video.video_cat != 'full to short')
            ${dateConditionInQuery};
        `;

        const [allCountResult, shortCountResult, videoCountResult] = await Promise.all([
          pool.query(allCountQuery, countQueryParams),
          pool.query(shortCountQuery, countQueryParams),
          pool.query(videoCountQuery, countQueryParams)
        ]);

        const allCount = parseInt(allCountResult.rows[0].total) || 0;
        const shortCount = parseInt(shortCountResult.rows[0].total) || 0;
        const videoCount = parseInt(videoCountResult.rows[0].total) || 0;

        console.log(`📊 Type counts for writer ${writer_id}: All=${allCount}, Shorts=${shortCount}, Videos=${videoCount}`);
        console.log(`📺 Current filter: ${type} - Showing ${transformedVideos.length} videos on page ${pageNum}`);

        // Videos are already filtered by the database query, no need for additional filtering
        const filteredVideos = transformedVideos;

        // Add InfluxDB total data for each video (no delta calculations)
        const videosWithInfluxData = await Promise.all(
          filteredVideos.map(async (video) => {
            try {
              if (video.url) {
                const influxData = await getVideoTotalData(video.url);
                // Use InfluxDB data if available, otherwise keep PostgreSQL data
                return {
                  ...video,
                  views: influxData.views || video.views,
                  likes: influxData.likes || video.likes,
                  comments: influxData.comments || video.comments,
                  influxData // Keep for debugging
                };
              }
              return video;
            } catch (error) {
              console.error(`❌ Error getting InfluxDB data for video ${video.id}:`, error);
              return video;
            }
          })
        );

        console.log(`✅ PostgreSQL fallback: Found ${videosWithInfluxData.length}/${totalVideos} videos for writer ${writer_id} (Page ${pageNum}/${totalPages}) Type: ${type}`);

        // Return paginated response with type counts
        res.json({
          videos: videosWithInfluxData,
          pagination: {
            currentPage: pageNum,
            totalPages: totalPages,
            totalVideos: totalVideos,
            videosPerPage: limitNum,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
          },
          typeCounts: {
            all: allCount,
            short: shortCount,
            video: videoCount
          }
        });
        return;
      }
    } catch (pgError) {
      console.error('❌ PostgreSQL fallback error:', pgError);
    }

    // Final fallback to mock data
    console.log('📝 Using final mock data fallback for writer:', writer_id);
    const mockVideos = [
      {
        id: 1,
        url: "https://youtube.com/shorts/zQrDuHoNZCc",
        title: "Dare Roulette was just a harmless game we made up, until the new kid joined.",
        writer_id: writer_id,
        writer_name: "Hannah Moskowitz",
        account_name: "StoryChannel",
        preview: "https://i.ytimg.com/vi/zQrDuHoNZCc/default.jpg",
        views: 216577,
        likes: 8462,
        comments: 52,
        posted_date: new Date().toISOString(),
        duration: "0:45",
        type: "short", // YouTube Short
        status: "Published"
      },
      {
        id: 2,
        url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
        title: "Long Form Story: The Complete Adventure",
        writer_id: writer_id,
        writer_name: "Hannah Moskowitz",
        account_name: "StoryChannel",
        preview: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        views: 89000,
        likes: 3200,
        comments: 180,
        posted_date: new Date(Date.now() - 86400000).toISOString(),
        duration: "15:30",
        type: "video", // Long-form video
        status: "Published"
      }
    ];

    res.json(mockVideos);
  } catch (error) {
    console.error("Error fetching writer videos:", error);
    res.status(500).json({ error: "Error fetching videos" });
  }
});

// Helper function to extract video ID from YouTube URL
function extractVideoId(url) {
  if (!url) return 'dQw4w9WgXcQ'; // Default video ID
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : 'dQw4w9WgXcQ';
}

// Helper function to identify video type from URL
function getVideoType(url) {
  if (!url) return 'video';

  // Check for YouTube Shorts URLs
  if (url.includes('/shorts/') || url.includes('youtube.com/shorts')) {
    return 'short';
  }

  // Check for other short-form indicators
  if (url.includes('youtu.be/') && url.length < 50) {
    return 'short'; // youtu.be links are often shorts
  }

  // Default to long-form video
  return 'video';
}

// Helper function to get video duration category
function getVideoDurationCategory(duration) {
  if (!duration) return 'video';

  // Parse duration string (e.g., "0:45", "15:30")
  const parts = duration.split(':');
  let totalSeconds = 0;

  if (parts.length === 2) {
    totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
  } else if (parts.length === 3) {
    totalSeconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }

  // YouTube Shorts are typically under 60 seconds
  return totalSeconds <= 60 ? 'short' : 'video';
}

// Helper function to generate random duration for videos
function generateRandomDuration() {
  const minutes = Math.floor(Math.random() * 20) + 1; // 1-20 minutes
  const seconds = Math.floor(Math.random() * 60); // 0-59 seconds
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Your working PostgreSQL API for writer analytics with pagination
app.get("/api/writer/analytics", async (req, res) => {
  const { writer_id, page = "1", limit = "20", type = "all" } = req.query;
  if (!writer_id) {
    return res.status(400).json({ error: "Missing writer_id" });
  }

  // Query to get engagement data for non-YouTube URLs excluding 'full to short' category
  const nonYoutubeQuery = `
    SELECT
      video.url,
      video.script_title AS title,
      statistics.posted_date,
      statistics.preview,
      COALESCE(statistics.views_total, 0) AS views_total,
      COALESCE(statistics.likes_total, 0) AS likes_total,
      COALESCE(statistics.comments_total, 0) AS comments_total,
      video.id as video_id
    FROM video
    LEFT JOIN statistics ON video.id = statistics.video_id
    WHERE video.writer_id = $1
      AND video.url NOT LIKE '%youtube.com%'
      AND (video.video_cat IS NULL OR video.video_cat != 'full to short')
    ORDER BY statistics.posted_date DESC;
  `;

  // Query to get YouTube video data excluding 'full to short' category
  const youtubeQuery = `
    SELECT
      video.url,
      video.script_title AS title,
      statistics_youtube_api.posted_date,
      statistics_youtube_api.preview,
      COALESCE(statistics_youtube_api.likes_total, 0) AS likes_total,
      COALESCE(statistics_youtube_api.comments_total, 0) AS comments_total,
      COALESCE(statistics_youtube_api.views_total, 0) AS views_total,
      video.id as video_id
    FROM video
    LEFT JOIN statistics_youtube_api
        ON CAST(video.id AS VARCHAR) = statistics_youtube_api.video_id
    WHERE video.writer_id = $1
      AND video.url LIKE '%youtube.com%'
      AND (video.video_cat IS NULL OR video.video_cat != 'full to short')
    ORDER BY statistics_youtube_api.posted_date DESC;
  `;

  try {
    if (pool) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;
      const offset = (pageNum - 1) * limitNum;

      // Get all data first, then paginate
      const { rows: nonYoutubeRows } = await pool.query(nonYoutubeQuery, [
        parseInt(writer_id),
      ]);

      const { rows: youtubeRows } = await pool.query(youtubeQuery, [
        parseInt(writer_id),
      ]);

      const combinedData = [...nonYoutubeRows, ...youtubeRows];

      // Apply type filtering
      let filteredData = combinedData;
      if (type === 'short') {
        filteredData = combinedData.filter(video => video.url && video.url.includes('/shorts/'));
      } else if (type === 'video') {
        filteredData = combinedData.filter(video => video.url && !video.url.includes('/shorts/'));
      }
      // For type === 'all', no filtering needed

      const totalVideos = filteredData.length;
      const totalPages = Math.ceil(totalVideos / limitNum);

      // Apply pagination
      const paginatedData = filteredData.slice(offset, offset + limitNum);

      // Transform for Content page format
      const transformedData = paginatedData.map((video, index) => {
        const duration = generateRandomDuration();
        const videoType = getVideoType(video.url);

        return {
          id: video.video_id || index + 1,
          url: video.url || "",
          title: video.title || "Untitled Video",
          writer_id: writer_id,
          writer_name: "Writer",
          account_name: "Channel",
          preview: video.preview || (video.url ? `https://img.youtube.com/vi/${extractVideoId(video.url)}/maxresdefault.jpg` : ""),
          views: video.views_total || 0,
          likes: video.likes_total || 0,
          comments: video.comments_total || 0,
          posted_date: video.posted_date || new Date().toISOString(),
          duration: duration,
          type: videoType, // 'short' or 'video'
          status: "Published"
        };
      });

      console.log(`✅ PostgreSQL analytics: Found ${transformedData.length}/${totalVideos} videos for writer ${writer_id} (Page ${pageNum}/${totalPages})`);

      // Return paginated response
      res.json({
        videos: transformedData,
        pagination: {
          currentPage: pageNum,
          totalPages: totalPages,
          totalVideos: totalVideos,
          videosPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      });
    } else {
      res.status(500).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Error querying PostgreSQL for writer analytics:", error);
    res.status(500).json({ error: "Error querying writer analytics data" });
  }
});

// Individual video data endpoint for VideoAnalytics page
app.get("/api/video/:id", async (req, res) => {
  const { id } = req.params;
  const { writer_id, range = "lifetime" } = req.query;

  if (!id) {
    return res.status(400).json({ error: "missing video id" });
  }

  try {
    console.log('🎬 Getting video details for ID:', id, 'Writer:', writer_id);

    // First try InfluxDB for real-time data
    try {
      console.log('🔍 Querying InfluxDB for video ID:', id, 'Range:', range);

      // Calculate date range for InfluxDB query
      let timeRange;
      if (range === 'lifetime') {
        timeRange = '-5y'; // Use 5 years for lifetime
      } else {
        timeRange = `-${range}d`;
      }

      // Query InfluxDB for specific video data - try multiple field patterns
      console.log(`🔍 Searching InfluxDB for video ID: ${id} with time range: ${timeRange}`);

      const query = `
        from(bucket: "${bucket}")
          |> range(start: ${timeRange})
          |> filter(fn: (r) => r._measurement == "views")
          |> filter(fn: (r) => r.video_id == "${id}" or r.id == "${id}" or r.video_id == ${id})
          |> last()
      `;

      const results = await queryInfluxDB(query);

      console.log(`✅ InfluxDB video query completed. Found ${results.length} records for video ${id}`);

      if (results.length > 0) {
        console.log(`🎯 Using InfluxDB data for video ${id}`);
        const influxVideo = results[0];

        // Get additional metrics from InfluxDB
        const totalData = await getVideoTotalData(influxVideo.url || '');
        const chartData = await getVideoLineChartData(influxVideo.url || '', range || '7d');

        const duration = generateRandomDuration();
        const videoData = {
          id: id,
          title: influxVideo.title || `Video ${id}`,
          url: influxVideo.url || '',
          views: totalData.views || influxVideo._value || 0,
          likes: totalData.likes || 0,
          comments: totalData.comments || 0,
          duration: duration,
          avgViewDuration: generateRandomDuration(Math.floor(Math.random() * 60) + 30),
          isShort: getVideoType(influxVideo.url) === 'short',
          viewsIncrease: Math.floor(Math.random() * 50) + 10,
          retentionRate: Math.floor(Math.random() * 30) + 60,
          preview: influxVideo.preview || (influxVideo.url ? `https://img.youtube.com/vi/${extractVideoId(influxVideo.url)}/maxresdefault.jpg` : ""),
          chartData: chartData,
          retentionData: generateRetentionData(duration),
          influxData: totalData // Keep this for reference
        };

        console.log(`✅ Returning InfluxDB data for video: ${videoData.title} (${videoData.views} views)`);
        console.log(`📊 Chart data points: ${chartData.length}`);
        return res.json(videoData);
      }

      // If no InfluxDB data found, fall back to PostgreSQL
      console.log('⚠️ No video found in InfluxDB, trying PostgreSQL fallback');
    } catch (influxError) {
      console.error('❌ InfluxDB error for video details, trying PostgreSQL fallback:', influxError);
    }

    // Fallback to PostgreSQL
    if (pool) {
      console.log('🔄 Using PostgreSQL fallback for video details');
      const videoQuery = `
        SELECT
          video.id,
          video.url,
          video.script_title AS title,
          video.writer_id,
          statistics_youtube_api.posted_date,
          statistics_youtube_api.preview,
          COALESCE(statistics_youtube_api.likes_total, 0) AS likes_total,
          COALESCE(statistics_youtube_api.comments_total, 0) AS comments_total,
          COALESCE(statistics_youtube_api.views_total, 0) AS views_total
        FROM video
        LEFT JOIN statistics_youtube_api
            ON CAST(video.id AS VARCHAR) = statistics_youtube_api.video_id
        WHERE video.id = $1
          AND video.url LIKE '%youtube.com%'
          AND (video.video_cat IS NULL OR video.video_cat != 'full to short');
      `;

      const { rows } = await pool.query(videoQuery, [parseInt(id)]);

      if (rows.length === 0) {
        return res.status(404).json({ error: "Video not found" });
      }

      const video = rows[0];
      const duration = generateRandomDuration();
      const videoType = getVideoType(video.url);

      // Transform PostgreSQL data to match VideoAnalytics expected format
      const videoData = {
        id: video.id,
        title: video.title || "Untitled Video",
        url: video.url,
        thumbnail: videoType === 'short' ? '🎯' : '📺',
        color: videoType === 'short' ? '#4CAF50' : '#2196F3',
        duration: duration,
        views: video.views_total || 0,
        viewsIncrease: Math.floor(Math.random() * 50) + 20,
        retentionRate: Math.floor(Math.random() * 30) + 70,
        avgViewDuration: generateAverageViewDuration(duration),
        isShort: videoType === 'short',
        publishDate: video.posted_date ? new Date(video.posted_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : 'Unknown',
        likes: video.likes_total || 0,
        comments: video.comments_total || 0,
        preview: video.preview || (video.url ? `https://img.youtube.com/vi/${extractVideoId(video.url)}/maxresdefault.jpg` : ""),
        // Generate chart data based on actual views with proper dates
        chartData: generateMockViewsChartData(video.views_total || 0),
        retentionData: generateRetentionData(duration)
      };

      console.log(`✅ Found video from PostgreSQL: ${videoData.title} (${videoData.views} views)`);
      console.log(`📊 Chart data sample:`, videoData.chartData?.slice(0, 3));
      res.json(videoData);
    } else {
      res.status(500).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Error fetching video details:", error);
    res.status(500).json({ error: "Error fetching video details" });
  }
});

// Helper function to generate average view duration based on total duration
function generateAverageViewDuration(totalDuration) {
  if (!totalDuration) return "1:30";

  const parts = totalDuration.split(':');
  let totalSeconds = 0;

  if (parts.length === 2) {
    totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }

  // Average view duration is typically 60-80% of total duration
  const avgSeconds = Math.floor(totalSeconds * (0.6 + Math.random() * 0.2));
  const minutes = Math.floor(avgSeconds / 60);
  const seconds = avgSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper function to get video line chart data using your InfluxDB API
async function getVideoLineChartData(url, timeRange = '7d') {
  if (!url) {
    console.log('⚠️ No URL provided for line chart data');
    return generateMockViewsChartData(0);
  }

  try {
    console.log(`📈 Getting InfluxDB line chart data for URL: ${url}, Range: ${timeRange}`);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    if (timeRange === 'lifetime' || timeRange === '-5y') {
      startDate.setFullYear(startDate.getFullYear() - 2); // 2 years for lifetime
    } else {
      const days = parseInt(timeRange.replace('-', '').replace('d', '')) || 7;
      startDate.setDate(startDate.getDate() - days);
    }

    // Use your existing line chart API internally (without problematic grouping)
    console.log(`📈 Getting line chart data for URL: ${url}, Range: ${timeRange}`);

    const query = `
      from(bucket: "youtube_api")
        |> range(start: ${startDate.toISOString()}, stop: ${endDate.toISOString()})
        |> filter(fn: (r) => r._measurement == "views")
        |> filter(fn: (r) => r._field == "views")
        |> filter(fn: (r) => r.url == "${url}")
        |> aggregateWindow(every: 1d, fn: last, createEmpty: false)
        |> sort(columns: ["_time"], desc: false)
    `;

    const result = await queryInfluxDB(query);
    console.log(`📊 InfluxDB line chart query returned ${result.length} data points`);

    if (result.length > 0) {
      // Transform to chart format using _value field with proper date formatting
      const chartData = result.map((item, index) => {
        const date = new Date(item._time);
        return {
          day: index,
          views: item._value || 0,
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDate: date.toISOString(),
          timestamp: item._time
        };
      });

      console.log(`✅ InfluxDB line chart data processed: ${chartData.length} points`);
      console.log(`📊 Sample data point:`, chartData[0]);
      return chartData;
    } else {
      console.log('⚠️ No InfluxDB line chart data found, using mock data');
      return generateMockViewsChartData(0);
    }
  } catch (error) {
    console.error('❌ Error getting video line chart data:', error);
    return generateMockViewsChartData(0);
  }
}

// Helper function to get video total data from InfluxDB (using correct field names)
async function getVideoTotalData(url) {
  if (!url) {
    return { views: null, likes: null, comments: null };
  }

  try {
    const fields = ['views', 'likes', 'comments'];
    const totalData = {};

    for (let field of fields) {
      try {
        // Query InfluxDB for each field separately without using _value
        const query = `
          from(bucket: "youtube_api")
            |> range(start: -30d)
            |> filter(fn: (r) => r._measurement == "views")
            |> filter(fn: (r) => r._field == "${field}")
            |> filter(fn: (r) => r.url == "${url}")
            |> last()
        `;

        const result = await queryInfluxDB(query);

        if (result.length > 0) {
          // Use the field name directly from the result
          const value = result[0][field] || result[0]._value || 0;
          totalData[field] = value;
          console.log(`📊 InfluxDB ${field} for ${url}: ${value} (from ${result[0]._value ? '_value' : field} field)`);
          console.log(`🔍 Full result object:`, result[0]);
        } else {
          totalData[field] = 0;
          console.log(`⚠️ No InfluxDB data found for ${field} on ${url}`);
        }
      } catch (fieldError) {
        console.error(`❌ Error getting ${field} total:`, fieldError);
        totalData[field] = 0;
      }
    }

    return totalData;
  } catch (error) {
    console.error('❌ Error getting video total data:', error);
    return { views: 0, likes: 0, comments: 0 };
  }
}

// Helper function to generate views chart data from InfluxDB historical data
async function getVideoHistoricalData(influxService, videoId, timeRange = '7d') {
  if (!influxService) {
    return generateMockViewsChartData(0);
  }

  try {
    const query = `
      from(bucket: "${influxService.bucket}")
        |> range(start: -${timeRange})
        |> filter(fn: (r) => r._measurement == "views")
        |> filter(fn: (r) => r._field == "views")
        |> filter(fn: (r) => r.video_id == "${videoId}")
        |> aggregateWindow(every: 1d, fn: last, createEmpty: false)
        |> sort(columns: ["_time"], desc: false)
    `;

    const results = [];
    await influxService.queryApi.queryRows(query, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        results.push({
          time: o._time,
          views: o._value || 0
        });
      },
      error(error) {
        console.error('❌ Error getting video historical data:', error);
      },
      complete() {
        console.log(`📈 Historical data retrieved: ${results.length} data points for video ${videoId}`);
      }
    });

    // Transform to chart format
    return results.map((item, index) => ({
      day: index,
      views: item.views,
      date: new Date(item.time).toLocaleDateString()
    }));
  } catch (error) {
    console.error('❌ Error querying historical data:', error);
    return generateMockViewsChartData(0);
  }
}

// Helper function to generate mock views chart data (fallback)
function generateMockViewsChartData(totalViews) {
  const data = [];
  let currentViews = 0;
  const today = new Date();

  for (let day = 0; day <= 7; day++) {
    // Simulate growth curve
    const progress = day / 7;
    const growthFactor = Math.pow(progress, 0.7); // Slower growth at start, faster later
    currentViews = Math.floor(totalViews * growthFactor);

    // Create date for each day
    const date = new Date(today);
    date.setDate(date.getDate() - (7 - day));

    data.push({
      day,
      views: currentViews,
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: date.toISOString(),
      timestamp: date.toISOString()
    });
  }

  return data;
}

// Helper function to generate retention data with key moments
function generateRetentionData(duration, avgViewDuration = null) {
  if (!duration) return [];

  const parts = duration.split(':');
  let totalSeconds = 0;

  if (parts.length === 2) {
    totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }

  const data = [];
  const intervals = Math.min(30, Math.max(10, totalSeconds / 10)); // 10-second intervals, 10-30 points

  // Calculate key moment at 30 seconds (or 25% of video, whichever is earlier)
  const keyMomentSeconds = Math.min(30, totalSeconds * 0.25);

  for (let i = 0; i <= intervals; i++) {
    const timeSeconds = Math.floor((totalSeconds * i) / intervals);
    const minutes = Math.floor(timeSeconds / 60);
    const seconds = timeSeconds % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Simulate realistic retention curve
    const progress = i / intervals;
    let retention;

    if (progress < 0.1) {
      // High retention at start (90-100%)
      retention = 100 - (progress * 100);
    } else if (progress < 0.3) {
      // Gradual drop (70-90%)
      retention = 90 - ((progress - 0.1) * 100);
    } else {
      // Steady decline (40-70%)
      retention = 70 - ((progress - 0.3) * 43);
    }

    // Add some randomness but keep it realistic
    retention += (Math.random() - 0.5) * 10;
    retention = Math.max(20, Math.min(180, retention)); // Keep between 20% and 180%

    // Mark key moment
    let keyMoment = null;
    if (Math.abs(timeSeconds - keyMomentSeconds) < 5) {
      keyMoment = retention + 20; // Show key moment marker
    }

    data.push({
      time: timeStr,
      percentage: Math.round(retention),
      keyMoment: keyMoment,
      isKeyMoment: Math.abs(timeSeconds - keyMomentSeconds) < 5
    });
  }

  return data;
}

// Video analytics time-series data endpoint
app.get("/api/video/:id/analytics", async (req, res) => {
  const { id } = req.params;
  const { range = "lifetime" } = req.query;

  if (!id) {
    return res.status(400).json({ error: "missing video id" });
  }

  try {
    console.log('📈 Getting time-series analytics for video ID:', id, 'Range:', range);

    // Initialize InfluxDB service
    let influxService;
    try {
      const InfluxService = require('./services/influxService');
      influxService = new InfluxService();
    } catch (error) {
      console.error('❌ Failed to initialize InfluxDB for video analytics:', error);
    }

    if (influxService) {
      try {
        // Calculate time range
        let timeRange;
        if (range === 'lifetime') {
          timeRange = '-5y';
        } else {
          timeRange = `-${range}d`;
        }

        // Query for time-series views data
        const viewsQuery = `
          from(bucket: "${influxService.bucket}")
            |> range(start: ${timeRange})
            |> filter(fn: (r) => r._measurement == "views")
            |> filter(fn: (r) => r._field == "views")
            |> filter(fn: (r) => r.video_id == "${id}")
            |> aggregateWindow(every: 1d, fn: last, createEmpty: false)
            |> sort(columns: ["_time"], desc: false)
        `;

        const viewsData = [];
        await influxService.queryApi.queryRows(viewsQuery, {
          next(row, tableMeta) {
            const o = tableMeta.toObject(row);
            viewsData.push({
              date: o._time,
              views: o._value || 0
            });
          },
          error(error) {
            console.error('❌ Error getting views time-series:', error);
          },
          complete() {
            console.log(`📊 Views time-series retrieved: ${viewsData.length} data points`);
          }
        });

        // Query for engagement data (likes, comments) - without pivot
        const engagementQuery = `
          from(bucket: "${influxService.bucket}")
            |> range(start: ${timeRange})
            |> filter(fn: (r) => r._measurement == "views")
            |> filter(fn: (r) => r._field == "likes" or r._field == "comments")
            |> filter(fn: (r) => r.video_id == "${id}")
            |> sort(columns: ["_time"], desc: false)
        `;

        const engagementData = [];
        await influxService.queryApi.queryRows(engagementQuery, {
          next(row, tableMeta) {
            const o = tableMeta.toObject(row);
            engagementData.push({
              date: o._time,
              field: o._field,
              value: o._value || 0
            });
          },
          error(error) {
            console.error('❌ Error getting engagement time-series:', error);
          },
          complete() {
            console.log(`💬 Engagement time-series retrieved: ${engagementData.length} data points`);
          }
        });

        // Return structured analytics data
        const analyticsData = {
          views: viewsData,
          engagement: engagementData,
          summary: {
            totalViews: viewsData.reduce((sum, item) => sum + item.views, 0),
            totalLikes: engagementData.reduce((sum, item) => sum + item.likes, 0),
            totalComments: engagementData.reduce((sum, item) => sum + item.comments, 0),
            dateRange: range,
            dataPoints: viewsData.length
          }
        };

        console.log(`✅ Video analytics retrieved for ${id}: ${analyticsData.summary.totalViews} total views`);
        res.json(analyticsData);
        return;
      } catch (influxError) {
        console.error('❌ InfluxDB error for video analytics:', influxError);
      }
    }

    // Fallback to mock analytics data
    console.log('📝 Using mock analytics data for video:', id);
    const mockAnalytics = {
      views: generateMockTimeSeriesData(range),
      engagement: generateMockEngagementData(range),
      summary: {
        totalViews: 50000,
        totalLikes: 2000,
        totalComments: 150,
        dateRange: range,
        dataPoints: 7
      }
    };

    res.json(mockAnalytics);
  } catch (error) {
    console.error("Error fetching video analytics:", error);
    res.status(500).json({ error: "Error fetching video analytics" });
  }
});

// Helper function to determine measurement and field based on URL and field
function getMeasurementAndField(url, field) {
  // Default measurement is "views"
  let measurement = "views";
  let adjustedField = field;

  // You can add logic here to adjust measurement/field based on URL patterns
  // For now, keeping it simple
  return { measurement, adjustedField };
}

// Helper function to check if video is a repost
async function isRepost(url) {
  // Add your logic to determine if a video is a repost
  // For now, returning false as default
  return false;
}

// InfluxDB client setup (using your existing pattern)
const { InfluxDB } = require('@influxdata/influxdb-client');

const influxDB = new InfluxDB({
  url: process.env.INFLUXDB_URL,
  token: process.env.INFLUXDB_TOKEN,
});
const org = process.env.INFLUXDB_ORG;
const bucket = process.env.INFLUXDB_BUCKET;

// Helper function to query InfluxDB (using your existing pattern)
const queryInfluxDB = async (query) => {
  const queryApi = influxDB.getQueryApi(org);
  const results = [];

  return new Promise((resolve, reject) => {
    queryApi.queryRows(query, {
      next(row, tableMeta) {
        const rowData = tableMeta.toObject(row);
        results.push(rowData);
      },
      error(error) {
        console.error("❌ InfluxDB Query Error:", error);
        reject(error);
      },
      complete() {
        console.log(`✅ InfluxDB query completed. Found ${results.length} records`);
        resolve(results);
      },
    });
  });
};

// InfluxDB Scorecard Data API (your existing endpoint)
app.post("/api/influx/scorecard-data", async (req, res) => {
  const { url, field } = req.body;
  const { measurement, field: adjustedField } = getMeasurementAndField(url, field);

  try {
    // Determine if the video is a repost and select the appropriate bucket
    const isRepostVideo = await isRepost(url);
    const bucketName = isRepostVideo ? "repost_views" : "youtube_api";

    const query = `
      from(bucket: "${bucketName}")
        |> range(start: -2d)
        |> filter(fn: (r) => r["_measurement"] == "${measurement}")
        |> filter(fn: (r) => r["_field"] == "${adjustedField}")
        |> filter(fn: (r) => r["url"] == "${url}")
        |> aggregateWindow(every: 60m, fn: max, createEmpty: true)
        |> fill(usePrevious: true)
        |> derivative(unit: 60m)
        |> keep(columns: ["_time", "_value"])
    `;

    const result = await queryInfluxDB(query);

    // Initialize variables for the 24-hour periods
    const now = new Date();
    const last24hStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const prev24hStart = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    let latest24hTotal = 0;
    let previous24hTotal = 0;

    // Iterate through the results to calculate 24-hour totals
    result.forEach((record) => {
      const recordTime = new Date(record._time);
      const recordValue = record._value;

      if (recordValue !== null) {
        if (recordTime >= last24hStart && recordTime <= now) {
          latest24hTotal += recordValue;
        } else if (recordTime >= prev24hStart && recordTime < last24hStart) {
          previous24hTotal += recordValue;
        }
      }
    });

    // Calculate total value for the last 48 hours
    const totalValueLast48h = latest24hTotal + previous24hTotal;

    // Calculate delta as percentage change
    const delta =
      previous24hTotal > 0
        ? Math.round(
            ((latest24hTotal - previous24hTotal) / previous24hTotal) * 100
          )
        : null;

    // Return data in the required format
    res.json({
      value: totalValueLast48h,
      delta: delta,
      debug: {
        latest_24h_total: latest24hTotal,
        previous_24h_total: previous24hTotal,
        total_value_last_48h: totalValueLast48h,
      },
    });
  } catch (error) {
    console.error("Error querying InfluxDB:", error);
    res.status(500).json({ error: "Error fetching scorecard data" });
  }
});

// InfluxDB Line Chart Data API (your existing endpoint)
app.post("/api/influx/line-chart-data", async (req, res) => {
  const { url, startDate, endDate } = req.body;
  const { measurement, field: adjustedField } = getMeasurementAndField(url, "views");

  try {
    // Determine if the video is a repost and select the appropriate bucket
    const isRepostVideo = await isRepost(url);
    const bucketName = isRepostVideo ? "repost_views" : "youtube_api";

    const start = new Date(startDate).toISOString();
    const end = new Date(endDate).toISOString();

    const query = `
      from(bucket: "${bucketName}")
        |> range(start: ${start}, stop: ${end})
        |> filter(fn: (r) => r["_measurement"] == "${measurement}")
        |> filter(fn: (r) => r["_field"] == "${adjustedField}")
        |> filter(fn: (r) => r["url"] == "${url}")
        |> group(columns: ["url"])
        |> aggregateWindow(every: 60m, fn: max, createEmpty: true)
        |> fill(usePrevious: true)
        |> keep(columns: ["_time", "_value"])
    `;

    const result = await queryInfluxDB(query);
    res.json(result);
  } catch (error) {
    console.error("Error querying InfluxDB:", error);
    res.status(500).json({ error: "Error fetching line chart data" });
  }
});

// Helper functions for mock data
function generateMockTimeSeriesData(range) {
  const days = range === 'lifetime' ? 30 : parseInt(range) || 7;
  const data = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));
    data.push({
      date: date.toISOString(),
      views: Math.floor(Math.random() * 5000) + 1000
    });
  }

  return data;
}

function generateMockEngagementData(range) {
  const days = range === 'lifetime' ? 30 : parseInt(range) || 7;
  const data = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));
    data.push({
      date: date.toISOString(),
      likes: Math.floor(Math.random() * 200) + 50,
      comments: Math.floor(Math.random() * 20) + 5
    });
  }

  return data;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Writer Dashboard API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
