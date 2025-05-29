import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  KeyboardArrowDown as ArrowDownIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon
} from '@mui/icons-material';
import Layout from '../components/Layout.jsx';

const Content = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filterAnchor, setFilterAnchor] = useState(null);

  // Shorts content data matching the first image
  const shortsData = [
    {
      id: 1,
      thumbnail: '🎯',
      color: '#4CAF50',
      duration: '2:41',
      title: 'Have you ever made a joke at the moment decis...',
      description: 'Have you ever made a joke at the moment decision that you regret? #redditstories Real story...',
      account: 'AskRedditEdit',
      date: 'May 24, 2025',
      status: 'Published',
      views: '1.9M',
      likes: '97.8%',
      comments: '64 likes'
    },
    {
      id: 2,
      thumbnail: '🎮',
      color: '#2196F3',
      duration: '1:11',
      title: 'Nightingale, what\'s your "they didn\'t realize I co...',
      description: 'Nightingale, what\'s your "they didn\'t realize I could understand them" moment? #redditstories Real...',
      account: 'Requestedreads',
      date: 'May 23, 2025',
      status: 'Published',
      views: '29.7K',
      likes: '98.6%',
      comments: '1,284 likes'
    },
    {
      id: 3,
      thumbnail: '💔',
      color: '#E91E63',
      duration: '0:52',
      title: 'Girls, how did you learn that your father was a soc...',
      description: 'Girls, how did you learn that your father was a sociopath? #redditstories Real story...',
      account: 'Requestedreads',
      date: 'May 22, 2025',
      status: 'Published',
      views: '56.5K',
      likes: '98.2%',
      comments: '1,807 likes'
    },
    {
      id: 4,
      thumbnail: '👶',
      color: '#FF9800',
      duration: '1:47',
      title: 'Parents, do you actually have a favorite child?',
      description: 'Parents, do you actually have a favorite child? #redditstories Real story, get with fake names so it...',
      account: 'UnlimitedStories',
      date: 'May 22, 2025',
      status: 'Published',
      views: '27.1K',
      likes: '98.7%',
      comments: '3,065 likes'
    },
    {
      id: 5,
      thumbnail: '📖',
      color: '#9C27B0',
      duration: '3:02',
      title: 'What made you realize the villain of a story?',
      description: 'What made you realize the villain of a story? #redditstories Real story, get with fake names so it...',
      account: 'BrokenStories',
      date: 'May 22, 2025',
      status: 'Published',
      views: '14.8K',
      likes: '97.3%',
      comments: '774 likes'
    },
    {
      id: 6,
      thumbnail: '❤️',
      color: '#F44336',
      duration: '1:09',
      title: 'Parents, do you actually have a favorite child?',
      description: 'Parents, do you actually have a favorite child? #redditstories Real story, get with fake names so it...',
      account: 'Frontlinereads',
      date: 'May 21, 2025',
      status: 'Published',
      views: '159.9K',
      likes: '98.9%',
      comments: '6,911 likes'
    },
    {
      id: 7,
      thumbnail: '💰',
      color: '#FFC107',
      duration: '1:44',
      title: 'Did you ever think your dad didn\'t love you?',
      description: 'Did you ever think your dad didn\'t love you? #redditstories Real story, get with fake names so it...',
      account: 'Thumbs Up Stories',
      date: 'May 21, 2025',
      status: 'Published',
      views: '15.1K',
      likes: '99.2%',
      comments: '1,143 likes'
    }
  ];

  // Videos content data matching the second image
  const videosData = [
    {
      id: 1,
      thumbnail: '📰',
      color: '#2E2E2E',
      duration: '24:1',
      title: '[FULL STORY] What made you realize that "open...',
      description: 'What made you realize that "open marriage" was a bad idea? #redditstories Real story, get with fake names so it...',
      account: 'AskRedditEdit',
      date: 'May 24, 2025',
      status: 'Published',
      views: '1.9M',
      likes: '97.8%',
      comments: '64 likes'
    },
    {
      id: 2,
      thumbnail: '📝',
      color: '#2E2E2E',
      duration: '32:2',
      title: '[FULL STORY] What\'s the most insane way some...',
      description: 'What\'s the most insane way someone has tried to get you? #redditstories Real story, get with fake names so it...',
      account: 'Requestedreads',
      date: 'May 23, 2025',
      status: 'Published',
      views: '29.7K',
      likes: '98.6%',
      comments: '1,284 likes'
    },
    {
      id: 3,
      thumbnail: '📄',
      color: '#2E2E2E',
      duration: '34:46',
      title: '[FULL STORY] When did you realize your parents...',
      description: 'When did you realize your parents shouldn\'t have had kids? #redditstories Real story, get with fake names so it...',
      account: 'Requestedreads',
      date: 'May 22, 2025',
      status: 'Published',
      views: '56.5K',
      likes: '98.2%',
      comments: '1,807 likes'
    },
    {
      id: 4,
      thumbnail: '📋',
      color: '#2E2E2E',
      duration: '32:2',
      title: '[FULL STORY] What subtle comment completely...',
      description: 'What subtle comment completely destroyed your self-esteem? #redditstories Real story, get with fake names so it...',
      account: 'UnlimitedStories',
      date: 'May 22, 2025',
      status: 'Published',
      views: '27.1K',
      likes: '98.7%',
      comments: '3,065 likes'
    },
    {
      id: 5,
      thumbnail: '📃',
      color: '#2E2E2E',
      duration: '33:04',
      title: '[FULL STORY] What made you realize that there...',
      description: 'What made you realize that there was something wrong with your family? #redditstories Real story, get with fake names so it...',
      account: 'BrokenStories',
      date: 'May 22, 2025',
      status: 'Published',
      views: '14.8K',
      likes: '97.3%',
      comments: '774 likes'
    },
    {
      id: 6,
      thumbnail: '📑',
      color: '#2E2E2E',
      duration: '34:46',
      title: '[FULL STORY] When did you realize your friend h...',
      description: 'When did you realize your friend had no moral compass? #redditstories Real story, get with fake names so it...',
      account: 'Frontlinereads',
      date: 'May 21, 2025',
      status: 'Published',
      views: '159.9K',
      likes: '98.9%',
      comments: '6,911 likes'
    },
    {
      id: 7,
      thumbnail: '📊',
      color: '#2E2E2E',
      duration: '34:46',
      title: '[FULL STORY] When did you realize your parents...',
      description: 'When did you realize your parents shouldn\'t have had kids? #redditstories Real story, get with fake names so it...',
      account: 'Thumbs Up Stories',
      date: 'May 21, 2025',
      status: 'Published',
      views: '15.1K',
      likes: '99.2%',
      comments: '1,143 likes'
    }
  ];

  // Get current content based on selected tab
  const contentData = tabValue === 0 ? shortsData : videosData;

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedItems(contentData.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const isSelected = (id) => selectedItems.includes(id);
  const isAllSelected = selectedItems.length === contentData.length;
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < contentData.length;

  const handleVideoClick = (videoId, event) => {
    // Don't navigate if clicking on checkbox or more options
    if (event.target.closest('input[type="checkbox"]') || event.target.closest('[data-testid="MoreVertIcon"]')) {
      return;
    }
    navigate(`/content/video/${videoId}`);
  };

  return (
    <Layout>
      <Box sx={{
        minHeight: '100vh',
        bgcolor: '#1a1a1a',
        color: 'white',
        p: 0
      }}>
        {/* Header */}
        <Box sx={{ p: 3, borderBottom: '1px solid #333' }}>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 3 }}>
            Channel content
          </Typography>

          {/* Tabs */}
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => {
              setTabValue(newValue);
              setSelectedItems([]); // Reset selections when switching tabs
            }}
            sx={{
              '& .MuiTab-root': {
                color: '#888',
                textTransform: 'none',
                fontSize: '14px',
                fontWeight: 500,
                minWidth: 'auto',
                px: 0,
                mr: 4
              },
              '& .Mui-selected': { color: 'white !important' },
              '& .MuiTabs-indicator': {
                backgroundColor: 'white',
                height: 2
              }
            }}
          >
            <Tab label="Shorts" />
            <Tab label="Videos" />
          </Tabs>
        </Box>

        {/* Filter Bar */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          borderBottom: '1px solid #333'
        }}>
          <IconButton
            onClick={(e) => setFilterAnchor(e.currentTarget)}
            sx={{ color: '#888' }}
          >
            <FilterIcon />
          </IconButton>
          <Button
            variant="outlined"
            size="small"
            endIcon={<ArrowDownIcon />}
            sx={{
              color: '#888',
              borderColor: '#444',
              textTransform: 'none',
              '&:hover': { borderColor: '#666' }
            }}
          >
            Filter
          </Button>
          <Menu
            anchorEl={filterAnchor}
            open={Boolean(filterAnchor)}
            onClose={() => setFilterAnchor(null)}
          >
            <MenuItem>All content</MenuItem>
            <MenuItem>Published</MenuItem>
            <MenuItem>Unlisted</MenuItem>
            <MenuItem>Private</MenuItem>
          </Menu>
        </Box>

        {/* Content Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ borderBottom: '1px solid #333' }}>
                <TableCell sx={{ color: '#888', border: 'none', py: 1 }}>
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onChange={handleSelectAll}
                    sx={{ color: '#888' }}
                  />
                </TableCell>
                <TableCell sx={{ color: '#888', border: 'none', py: 1 }}>
                  {tabValue === 0 ? 'Short' : 'Video'}
                </TableCell>
                <TableCell sx={{ color: '#888', border: 'none', py: 1 }}>Account</TableCell>
                <TableCell sx={{ color: '#888', border: 'none', py: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Date
                    <ArrowDownIcon sx={{ fontSize: 16 }} />
                  </Box>
                </TableCell>
                <TableCell sx={{ color: '#888', border: 'none', py: 1 }}>Views</TableCell>
                <TableCell sx={{ color: '#888', border: 'none', py: 1 }}>Likes (vs. dislikes)</TableCell>
                <TableCell sx={{ color: '#888', border: 'none', py: 1 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contentData.map((item) => (
                <TableRow
                  key={item.id}
                  onClick={(event) => handleVideoClick(item.id, event)}
                  sx={{
                    borderBottom: '1px solid #333',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#2a2a2a' }
                  }}
                >
                  <TableCell sx={{ border: 'none', py: 2 }}>
                    <Checkbox
                      checked={isSelected(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      sx={{ color: '#888' }}
                    />
                  </TableCell>
                  <TableCell sx={{ border: 'none', py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {/* Thumbnail */}
                      <Box sx={{ position: 'relative' }}>
                        <Box
                          sx={{
                            width: 60,
                            height: 40,
                            bgcolor: item.color,
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px'
                          }}
                        >
                          {item.thumbnail}
                        </Box>
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 2,
                            right: 2,
                            bgcolor: 'rgba(0,0,0,0.8)',
                            color: 'white',
                            px: 0.5,
                            borderRadius: '2px',
                            fontSize: '10px'
                          }}
                        >
                          {item.duration}
                        </Box>
                      </Box>
                      {/* Title and Description */}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, mb: 0.5 }}>
                          {item.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#888' }}>
                          {item.description}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ border: 'none', py: 2 }}>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      {item.account}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ border: 'none', py: 2 }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                        {item.date}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888' }}>
                        {item.status}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ border: 'none', py: 2 }}>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      {item.views}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ border: 'none', py: 2 }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                        {item.likes}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888' }}>
                        {item.comments}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ border: 'none', py: 2 }}>
                    <IconButton sx={{ color: '#888' }}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderTop: '1px solid #333'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: '#888' }}>
              Rows per page:
            </Typography>
            <Button
              variant="text"
              size="small"
              endIcon={<ArrowDownIcon />}
              sx={{ color: '#888', textTransform: 'none' }}
            >
              30
            </Button>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#888' }}>
              1-30 of about 457
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton sx={{ color: '#888' }}>
                <PrevIcon />
              </IconButton>
              <IconButton sx={{ color: '#888' }}>
                <NextIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default Content;
