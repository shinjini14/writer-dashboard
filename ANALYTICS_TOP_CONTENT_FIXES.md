# Analytics Page Top Content Fixes

## Issues Fixed

### 1. Videos/Shorts Filtering Not Working
- **Problem**: Frontend was sending 'videos' but backend expected 'content'
- **Solution**: Added filter mapping in frontend: `videos` → `content`
- **Result**: All three filters (All Content, Videos, Shorts) now work correctly

### 2. Balanced Results for "All Content"
- **Problem**: All 20 results were shorts, leaving Videos filter empty
- **Solution**: Implemented balanced approach for "All Content":
  - Gets top 10 shorts (< 183 seconds)
  - Gets top 10 videos (≥ 183 seconds)
  - Combines and sorts by views
- **Result**: Both Videos and Shorts filters now have content to show

### 3. Account Names from BigQuery
- **Problem**: Account names were not showing correctly
- **Solution**: 
  - Changed BigQuery table from `youtube_metadata_historical` to `youtube_video_report_historical`
  - Use `channel_title` as primary account name source
  - Query: `SELECT channel_title FROM speedy-web-461014-g3.dbt_youtube_analytics.youtube_video_report_historical`
- **Result**: Proper account names now display for all videos

### 4. Date Range Filtering
- **Problem**: Custom date ranges weren't being passed to top content API
- **Solution**: Enhanced date handling to support:
  - Predefined ranges (7, 30, 90, 365 days, lifetime)
  - Custom date ranges with start_date and end_date parameters
  - Single day selection (end_date = start_date)
- **Result**: Top content now filters by published date correctly

### 5. URL Support Enhancement
- **Problem**: Only supported `youtube.com` URLs
- **Solution**: Added support for both URL formats:
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
- **Result**: All YouTube URL formats now supported

### 6. Duration Threshold Consistency
- **Problem**: Inconsistent thresholds (180 vs 183 seconds)
- **Solution**: Standardized to 183 seconds throughout:
  - Shorts: < 183 seconds
  - Videos: ≥ 183 seconds
- **Result**: Consistent video type classification

## Technical Implementation

### Backend Changes (server/routes/analytics.js)

```javascript
// Balanced results for 'all' type
if (type === 'all') {
  const halfLimit = Math.floor(parseInt(limit) / 2);
  
  const topShorts = enhancedVideos
    .filter(video => video.isShort)
    .sort((a, b) => b.views - a.views)
    .slice(0, halfLimit);
  
  const topVideos = enhancedVideos
    .filter(video => !video.isShort)
    .sort((a, b) => b.views - a.views)
    .slice(0, halfLimit);
  
  topContent = [...topShorts, ...topVideos]
    .sort((a, b) => b.views - a.views);
}
```

### BigQuery Integration

```sql
SELECT 
  video_id,
  video_duration_seconds,
  channel_title
FROM `speedy-web-461014-g3.dbt_youtube_analytics.youtube_video_report_historical`
WHERE video_id IN UNNEST(@video_ids)
GROUP BY video_id, video_duration_seconds, channel_title
```

### Frontend Changes (src/pages/Analytics.jsx)

```javascript
// Filter mapping
let apiFilterType = filterType;
if (filterType === 'videos') {
  apiFilterType = 'content'; // Backend expects 'content' for videos
}

// Increased limit to 20
let url = `${buildApiUrl('/api/analytics/writer/top-content')}?writer_id=${writerId}&range=${range}&limit=20&type=${apiFilterType}`;
```

## API Endpoints

### Main Endpoint
- **URL**: `/api/analytics/writer/top-content`
- **Parameters**:
  - `writer_id`: Writer ID (required)
  - `range`: Date range (7, 30, 90, 365, lifetime, or custom)
  - `limit`: Number of results (default: 20)
  - `type`: Content type (all, shorts, content)
  - `start_date`: Custom start date (YYYY-MM-DD)
  - `end_date`: Custom end date (YYYY-MM-DD)

### Test Endpoint
- **URL**: `/api/analytics/test/top-content`
- **Purpose**: Verify functionality and configuration

## Expected Behavior

1. **All Content**: Shows 10 shorts + 10 videos, sorted by views
2. **Shorts**: Shows only videos < 183 seconds
3. **Videos**: Shows only videos ≥ 183 seconds
4. **Account Names**: Displays channel_title from BigQuery
5. **Date Filtering**: Filters by published_date in specified range
6. **URL Support**: Works with both youtube.com and youtu.be formats

## Testing

To test the implementation:

1. Navigate to Analytics page
2. Try all three filter buttons (All Content, Videos, Shorts)
3. Test custom date range selection
4. Verify account names are displayed correctly
5. Check that both URL formats work

The implementation now works exactly like the Content page with proper filtering, balanced results, and accurate account name display.
