import React, { useState } from 'react';
import {
  Typography,
  Box,
  Button,
  Menu,
  MenuItem,
  Chip,
  IconButton,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Sort as SortIcon,
  Description as DocIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const PreviousSubmissions = ({
  submissions,
  loading,
  onRefresh
}) => {
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Date');

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleSortClick = (event) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const handleFilterChange = (filter) => {
    setStatusFilter(filter);
    handleFilterClose();
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    handleSortClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Posted':
        return '#4CAF50'; // Green for success
      case 'Rejected':
        return '#F44336'; // Red for rejection
      case 'Pending':
        return '#FF9800'; // Orange for pending
      case 'Under Review':
        return '#2196F3'; // Blue for under review
      case 'Draft':
        return '#9E9E9E'; // Gray for draft
      default:
        return '#666';
    }
  };

  const getStatusColorWithOpacity = (status, opacity = 0.1) => {
    const color = getStatusColor(status);
    // Convert hex to rgba
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (statusFilter === 'All') return true;
    return submission.status === statusFilter;
  });

  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    switch (sortBy) {
      case 'Date':
        return new Date(b.submittedOn).getTime() - new Date(a.submittedOn).getTime();
      case 'Title':
        return a.title.localeCompare(b.title);
      case 'Status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  return (
    <Box>
      {/* Modern Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        pb: 2,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Typography
          variant="h6"
          fontWeight="600"
          sx={{
            color: 'white',
            fontSize: '1.1rem',
            letterSpacing: '0.5px'
          }}
        >
          Previous Submissions
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <IconButton
            onClick={onRefresh}
            size="small"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              color: 'white',
              borderRadius: '8px',
              width: 32,
              height: 32,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
          <Button
            startIcon={<FilterIcon />}
            onClick={handleFilterClick}
            size="small"
            sx={{
              bgcolor: '#E6B800',
              color: 'black',
              border: 'none',
              fontWeight: '600',
              borderRadius: '8px',
              px: 2,
              py: 0.5,
              fontSize: '0.8rem',
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#D4A600',
                border: 'none',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(230, 184, 0, 0.3)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            Filters
          </Button>
          <Button
            startIcon={<SortIcon />}
            onClick={handleSortClick}
            size="small"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontWeight: '500',
              borderRadius: '8px',
              px: 2,
              py: 0.5,
              fontSize: '0.8rem',
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            Sort By {sortBy}
          </Button>
        </Box>
      </Box>

      {/* Modern Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            mt: 1
          }
        }}
      >
        {['All', 'Pending', 'Posted', 'Rejected', 'Under Review', 'Draft'].map((filter) => (
          <MenuItem
            key={filter}
            onClick={() => handleFilterChange(filter)}
            selected={statusFilter === filter}
            sx={{
              color: 'white',
              fontSize: '0.9rem',
              py: 1.5,
              px: 2,
              '&.Mui-selected': {
                bgcolor: 'rgba(230, 184, 0, 0.2)',
                color: '#E6B800',
                fontWeight: '600'
              },
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                transform: 'translateX(4px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {filter}
          </MenuItem>
        ))}
      </Menu>

      {/* Modern Sort Menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={handleSortClose}
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            mt: 1
          }
        }}
      >
        {['Date', 'Title', 'Status'].map((sort) => (
          <MenuItem
            key={sort}
            onClick={() => handleSortChange(sort)}
            selected={sortBy === sort}
            sx={{
              color: 'white',
              fontSize: '0.9rem',
              py: 1.5,
              px: 2,
              '&.Mui-selected': {
                bgcolor: 'rgba(230, 184, 0, 0.2)',
                color: '#E6B800',
                fontWeight: '600'
              },
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                transform: 'translateX(4px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {sort}
          </MenuItem>
        ))}
      </Menu>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress
            sx={{
              color: '#E6B800',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              }
            }}
            size={32}
            thickness={4}
          />
        </Box>
      ) : (
        <Stack spacing={2.5}>
          {sortedSubmissions.map((submission) => (
            <Box
              key={submission.id}
              sx={{
                bgcolor: getStatusColorWithOpacity(submission.status, 0.05),
                backdropFilter: 'blur(10px)',
                p: 3,
                borderRadius: '16px',
                border: `1px solid ${getStatusColorWithOpacity(submission.status, 0.2)}`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: getStatusColorWithOpacity(submission.status, 0.1),
                  borderColor: getStatusColorWithOpacity(submission.status, 0.4),
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 32px ${getStatusColorWithOpacity(submission.status, 0.3)}`,
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  bgcolor: getStatusColor(submission.status),
                  borderRadius: '16px 16px 0 0',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '4px',
                  height: '100%',
                  bgcolor: getStatusColor(submission.status),
                  borderRadius: '16px 0 0 16px',
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'white',
                    fontWeight: '600',
                    flex: 1,
                    mr: 2,
                    fontSize: '1rem',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {submission.title}
                </Typography>
                <Chip
                  label={submission.status}
                  size="small"
                  sx={{
                    bgcolor: getStatusColor(submission.status),
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '0.75rem',
                    height: '26px',
                    borderRadius: '13px',
                    boxShadow: `0 2px 8px ${getStatusColorWithOpacity(submission.status, 0.4)}`,
                    border: `1px solid ${getStatusColor(submission.status)}`,
                    '& .MuiChip-label': {
                      px: 1.5
                    },
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: `0 4px 12px ${getStatusColorWithOpacity(submission.status, 0.6)}`,
                    },
                    transition: 'all 0.2s ease'
                  }}
                />
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  mb: 2.5,
                  fontSize: '0.85rem'
                }}
              >
                Submitted on {submission.submittedOn}
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Chip
                    label={submission.type}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.75rem',
                      height: '28px',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                        bgcolor: 'rgba(255, 255, 255, 0.05)'
                      }
                    }}
                  />
                  <Chip
                    label={submission.number}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.75rem',
                      height: '28px',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                        bgcolor: 'rgba(255, 255, 255, 0.05)'
                      }
                    }}
                  />
                </Box>

                <Button
                  startIcon={<DocIcon />}
                  size="small"
                  onClick={() => window.open(submission.googleDocLink, '_blank')}
                  sx={{
                    bgcolor: '#E6B800',
                    color: 'black',
                    fontWeight: '600',
                    fontSize: '0.8rem',
                    borderRadius: '10px',
                    px: 2,
                    py: 0.8,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: '#D4A600',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(230, 184, 0, 0.4)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  Open Doc
                </Button>
              </Box>
            </Box>
          ))}

          {sortedSubmissions.length === 0 && (
            <Box sx={{
              textAlign: 'center',
              py: 8,
              bgcolor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '16px',
              border: '1px dashed rgba(255, 255, 255, 0.1)'
            }}>
              <Typography sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}>
                {statusFilter === 'All' ? 'No submissions found' : `No ${statusFilter.toLowerCase()} submissions found`}
              </Typography>
            </Box>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default PreviousSubmissions;