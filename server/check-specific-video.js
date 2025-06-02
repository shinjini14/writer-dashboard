const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkSpecificVideo() {
  try {
    console.log('🔍 Running exact query for video 128379 with writer_id 110...');
    
    const query = `
      SELECT 
        video.id,
        video.url,
        video.script_title AS title,
        video.writer_id,
        COALESCE(statistics_youtube_api.posted_date, video.created) AS posted_date,
        statistics_youtube_api.preview,
        statistics_youtube_api.duration, 
        COALESCE(statistics_youtube_api.likes_total, 0) AS likes_total,
        COALESCE(statistics_youtube_api.comments_total, 0) AS comments_total,
        COALESCE(statistics_youtube_api.views_total, 0) AS views_total
      FROM video
      LEFT JOIN statistics_youtube_api
          ON CAST(video.id AS VARCHAR) = statistics_youtube_api.video_id
      WHERE video.id = 128379 AND video.writer_id = 110;
    `;
    
    const { rows } = await pool.query(query);
    
    if (rows.length === 0) {
      console.log('❌ No results found for video 128379 with writer_id 110');
      return;
    }
    
    const video = rows[0];
    console.log('\n📊 EXACT QUERY RESULTS:');
    console.log('='.repeat(50));
    console.log('ID:', video.id);
    console.log('Title:', video.title);
    console.log('Writer ID:', video.writer_id);
    console.log('URL:', video.url);
    console.log('DURATION:', `"${video.duration}"`);
    console.log('Views Total:', video.views_total);
    console.log('Likes Total:', video.likes_total);
    console.log('Comments Total:', video.comments_total);
    console.log('Posted Date:', video.posted_date);
    console.log('Preview:', video.preview);
    console.log('='.repeat(50));
    
    // Also check what's in statistics_youtube_api table directly
    console.log('\n🔍 Checking statistics_youtube_api table directly...');
    const directQuery = `
      SELECT video_id, duration, views_total, likes_total, comments_total, created_at, updated_at
      FROM statistics_youtube_api 
      WHERE video_id = '128379'
      ORDER BY updated_at DESC;
    `;
    
    const { rows: directRows } = await pool.query(directQuery);
    console.log(`Found ${directRows.length} entries in statistics_youtube_api for video_id='128379':`);
    
    directRows.forEach((row, index) => {
      console.log(`\nEntry ${index + 1}:`);
      console.log('  Video ID:', row.video_id);
      console.log('  Duration:', `"${row.duration}"`);
      console.log('  Views:', row.views_total);
      console.log('  Likes:', row.likes_total);
      console.log('  Comments:', row.comments_total);
      console.log('  Created:', row.created_at);
      console.log('  Updated:', row.updated_at);
    });
    
  } catch (error) {
    console.error('❌ Error running query:', error);
  } finally {
    await pool.end();
  }
}

checkSpecificVideo();
