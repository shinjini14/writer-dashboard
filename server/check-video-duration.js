const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkVideoDuration() {
  try {
    console.log('🔍 Checking duration for video 128379...');
    
    // Check the video data and duration from statistics_youtube_api
    const query = `
      SELECT 
        video.id,
        video.script_title AS title,
        video.url,
        statistics_youtube_api.duration,
        statistics_youtube_api.views_total,
        statistics_youtube_api.likes_total,
        statistics_youtube_api.comments_total,
        statistics_youtube_api.posted_date,
        statistics_youtube_api.video_id
      FROM video
      LEFT JOIN statistics_youtube_api
          ON CAST(video.id AS VARCHAR) = statistics_youtube_api.video_id
      WHERE video.id = $1;
    `;
    
    const { rows } = await pool.query(query, [128379]);
    
    if (rows.length === 0) {
      console.log('❌ Video 128379 not found');
      return;
    }
    
    const video = rows[0];
    console.log('📊 Video data from database:');
    console.log('ID:', video.id);
    console.log('Title:', video.title);
    console.log('URL:', video.url);
    console.log('Duration from statistics_youtube_api:', video.duration);
    console.log('Views:', video.views_total);
    console.log('Likes:', video.likes_total);
    console.log('Comments:', video.comments_total);
    console.log('Posted Date:', video.posted_date);
    console.log('Video ID in statistics_youtube_api:', video.video_id);
    
    // Also check if there are multiple entries in statistics_youtube_api for this video
    const statsQuery = `
      SELECT * FROM statistics_youtube_api 
      WHERE video_id = $1 
      ORDER BY created_at DESC;
    `;
    
    const { rows: statsRows } = await pool.query(statsQuery, ['128379']);
    console.log(`\n📈 Found ${statsRows.length} entries in statistics_youtube_api for video 128379:`);
    
    statsRows.forEach((stat, index) => {
      console.log(`Entry ${index + 1}:`);
      console.log('  Duration:', stat.duration);
      console.log('  Views:', stat.views_total);
      console.log('  Created:', stat.created_at);
      console.log('  Updated:', stat.updated_at);
    });
    
  } catch (error) {
    console.error('❌ Error checking video duration:', error);
  } finally {
    await pool.end();
  }
}

checkVideoDuration();
