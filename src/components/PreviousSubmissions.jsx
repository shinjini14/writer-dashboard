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
  TextField,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Sort as SortIcon,
  Description as DocIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const PreviousSubmissions = ({
  submissions,
  loading,
  onRefresh
}) => {
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Date');

  // Enhanced filter state from reference
  const [filter, setFilter] = useState('');
  const [searchTitle, setSearchTitle] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');

  // Modern search state
  const [searchQuery, setSearchQuery] = useState('');

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

  // Static color definitions for production compatibility
  const STATUS_COLORS = {
    'Posted': {
      base: '#4CAF50',
      bg: 'rgba(76, 175, 80, 0.05)',
      border: 'rgba(76, 175, 80, 0.2)',
      hoverBg: 'rgba(76, 175, 80, 0.1)',
      hoverBorder: 'rgba(76, 175, 80, 0.4)',
      shadow: 'rgba(76, 175, 80, 0.3)',
      chipShadow: 'rgba(76, 175, 80, 0.4)',
      chipHoverShadow: 'rgba(76, 175, 80, 0.6)',
    },
    'Rejected': {
      base: '#F44336',
      bg: 'rgba(244, 67, 54, 0.05)',
      border: 'rgba(244, 67, 54, 0.2)',
      hoverBg: 'rgba(244, 67, 54, 0.1)',
      hoverBorder: 'rgba(244, 67, 54, 0.4)',
      shadow: 'rgba(244, 67, 54, 0.3)',
      chipShadow: 'rgba(244, 67, 54, 0.4)',
      chipHoverShadow: 'rgba(244, 67, 54, 0.6)',
    },
    'Pending': {
      base: '#FF9800',
      bg: 'rgba(255, 152, 0, 0.05)',
      border: 'rgba(255, 152, 0, 0.2)',
      hoverBg: 'rgba(255, 152, 0, 0.1)',
      hoverBorder: 'rgba(255, 152, 0, 0.4)',
      shadow: 'rgba(255, 152, 0, 0.3)',
      chipShadow: 'rgba(255, 152, 0, 0.4)',
      chipHoverShadow: 'rgba(255, 152, 0, 0.6)',
    },
    'Under Review': {
      base: '#2196F3',
      bg: 'rgba(33, 150, 243, 0.05)',
      border: 'rgba(33, 150, 243, 0.2)',
      hoverBg: 'rgba(33, 150, 243, 0.1)',
      hoverBorder: 'rgba(33, 150, 243, 0.4)',
      shadow: 'rgba(33, 150, 243, 0.3)',
      chipShadow: 'rgba(33, 150, 243, 0.4)',
      chipHoverShadow: 'rgba(33, 150, 243, 0.6)',
    },
    'Draft': {
      base: '#9E9E9E',
      bg: 'rgba(158, 158, 158, 0.05)',
      border: 'rgba(158, 158, 158, 0.2)',
      hoverBg: 'rgba(158, 158, 158, 0.1)',
      hoverBorder: 'rgba(158, 158, 158, 0.4)',
      shadow: 'rgba(158, 158, 158, 0.3)',
      chipShadow: 'rgba(158, 158, 158, 0.4)',
      chipHoverShadow: 'rgba(158, 158, 158, 0.6)',
    },
  };

  // Fallback colors for unknown statuses
  const DEFAULT_COLORS = {
    base: '#666',
    bg: 'rgba(102, 102, 102, 0.05)',
    border: 'rgba(102, 102, 102, 0.2)',
    hoverBg: 'rgba(102, 102, 102, 0.1)',
    hoverBorder: 'rgba(102, 102, 102, 0.4)',
    shadow: 'rgba(102, 102, 102, 0.3)',
    chipShadow: 'rgba(102, 102, 102, 0.4)',
    chipHoverShadow: 'rgba(102, 102, 102, 0.6)',
  };

  const getStatusStyles = (status) => {
    return STATUS_COLORS[status] || DEFAULT_COLORS;
  };

  // Status mapping function for your API data
  const getStatusDisplay = (status) => {
    if (!status || typeof status !== 'string') {
      return "Pending"; // Default to Pending instead of Unknown
    }
    const normalizedStatus = status.trim().toLowerCase();
    switch (normalizedStatus) {
      case "approved script. ready for production":
      case "writer submissions (qa)":
      case "finished video":
      case "pending":
      case "story continuation":
        return "Pending";
      case "rejected":
        return "Rejected";
      case "posted":
        return "Posted";
      default:
        return "Pending"; // Default to Pending for all unknown statuses
    }
  };

  // Enhanced filtering logic with modern search
  const filterSubmissions = () => {
    let filteredSubmissions = [...submissions];

    // Apply modern search query (always active)
    if (searchQuery.trim()) {
      filteredSubmissions = filteredSubmissions.filter((submission) =>
        submission.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Reset filters for "Show All"
    if (filter === "Show All") {
      setStatusFilter(""); // Reset the status filter to show all statuses
      return filteredSubmissions; // Return filtered submissions
    }

    // Filter by Title (legacy filter)
    if (filter === "Title") {
      filteredSubmissions = filteredSubmissions.filter((submission) =>
        submission.title.toLowerCase().includes(searchTitle.toLowerCase())
      );
    }

    // Filter by Custom Date Range (using created_at from your API)
    if (filter === "Custom") {
      filteredSubmissions = filteredSubmissions.filter((submission) => {
        const submissionDate = new Date(submission.created_at);
        return startDate && endDate
          ? submissionDate >= startDate && submissionDate <= endDate
          : true;
      });
    }

    // Filter by Status (using approval_status from your API)
    if (statusFilter && statusFilter !== 'All' && statusFilter !== "All Statuses") {
      filteredSubmissions = filteredSubmissions.filter(
        (submission) => getStatusDisplay(submission.approval_status) === statusFilter
      );
    }

    // Sort by date based on sortOrder (using created_at from your API)
    filteredSubmissions.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === "desc"
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });

    return filteredSubmissions;
  };

  const sortedSubmissions = filterSubmissions();

  return (
    <Box>
      {/* Inline CSS for production fallback */}
      <style>
        {`
          .status-posted {
            background-color: rgba(76, 175, 80, 0.05) !important;
            border-color: rgba(76, 175, 80, 0.2) !important;
          }
          .status-posted::before {
            background-color: #4CAF50 !important;
          }
          .status-posted::after {
            background-color: #4CAF50 !important;
          }
          .status-rejected {
            background-color: rgba(244, 67, 54, 0.05) !important;
            border-color: rgba(244, 67, 54, 0.2) !important;
          }
          .status-rejected::before {
            background-color: #F44336 !important;
          }
          .status-rejected::after {
            background-color: #F44336 !important;
          }
          .status-pending {
            background-color: rgba(255, 152, 0, 0.05) !important;
            border-color: rgba(255, 152, 0, 0.2) !important;
          }
          .status-pending::before {
            background-color: #FF9800 !important;
          }
          .status-pending::after {
            background-color: #FF9800 !important;
          }
          .status-under-review {
            background-color: rgba(33, 150, 243, 0.05) !important;
            border-color: rgba(33, 150, 243, 0.2) !important;
          }
          .status-under-review::before {
            background-color: #2196F3 !important;
          }
          .status-under-review::after {
            background-color: #2196F3 !important;
          }
          .status-draft {
            background-color: rgba(158, 158, 158, 0.05) !important;
            border-color: rgba(158, 158, 158, 0.2) !important;
          }
          .status-draft::before {
            background-color: #9E9E9E !important;
          }
          .status-draft::after {
            background-color: #9E9E9E !important;
          }
          .chip-posted {
            background-color: #4CAF50 !important;
            border-color: #4CAF50 !important;
          }
          .chip-rejected {
            background-color: #F44336 !important;
            border-color: #F44336 !important;
          }
          .chip-pending {
            background-color: #FF9800 !important;
            border-color: #FF9800 !important;
          }
          .chip-under-review {
            background-color: #2196F3 !important;
            border-color: #2196F3 !important;
          }
          .chip-draft {
            background-color: #9E9E9E !important;
            border-color: #9E9E9E !important;
          }
        `}
      </style>
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

      {/* Modern Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search submissions by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#E6B800' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(230, 184, 0, 0.3)',
              borderRadius: '12px',
              transition: 'all 0.2s ease-in-out',
              '& fieldset': { border: 'none' },
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                borderColor: 'rgba(230, 184, 0, 0.5)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(230, 184, 0, 0.15)',
              },
              '&.Mui-focused': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                borderColor: '#E6B800',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 20px rgba(230, 184, 0, 0.25)',
              },
            },
            '& .MuiInputBase-input': {
              color: 'white',
              fontSize: '0.95rem',
              '&::placeholder': {
                color: 'rgba(255, 255, 255, 0.5)',
                opacity: 1,
              },
            },
          }}
        />
      </Box>

      {/* Enhanced Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#1a1a1a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(10px)',
              mt: 1,
              minWidth: '250px'
            }
          }
        }}
      >
        <MenuItem
          onClick={() => setFilter("")}
          sx={{
            color: 'white',
            fontSize: '0.9rem',
            py: 1.5,
            px: 2,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              transform: 'translateX(4px)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          Show All
        </MenuItem>
        <MenuItem
          onClick={() => setFilter("Custom")}
          sx={{
            color: 'white',
            fontSize: '0.9rem',
            py: 1.5,
            px: 2,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              transform: 'translateX(4px)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          Custom Date
        </MenuItem>
        <MenuItem
          onClick={() => setFilter("Title")}
          sx={{
            color: 'white',
            fontSize: '0.9rem',
            py: 1.5,
            px: 2,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              transform: 'translateX(4px)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          Title
        </MenuItem>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <MenuItem
          onClick={() => setStatusFilter("")}
          sx={{
            color: 'white',
            fontSize: '0.9rem',
            py: 1.5,
            px: 2,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              transform: 'translateX(4px)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          All Statuses
        </MenuItem>
        <MenuItem
          onClick={() => setStatusFilter("Rejected")}
          sx={{
            color: 'white',
            fontSize: '0.9rem',
            py: 1.5,
            px: 2,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              transform: 'translateX(4px)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          Rejected
        </MenuItem>
        <MenuItem
          onClick={() => setStatusFilter("Pending")}
          sx={{
            color: 'white',
            fontSize: '0.9rem',
            py: 1.5,
            px: 2,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              transform: 'translateX(4px)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          Pending
        </MenuItem>
        <MenuItem
          onClick={() => setStatusFilter("Posted")}
          sx={{
            color: 'white',
            fontSize: '0.9rem',
            py: 1.5,
            px: 2,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              transform: 'translateX(4px)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          Posted
        </MenuItem>
      </Menu>

      {/* Enhanced Sort Menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={handleSortClose}
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#1a1a1a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(10px)',
              mt: 1
            }
          }
        }}
      >
        <MenuItem
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          sx={{
            color: 'white',
            fontSize: '0.9rem',
            py: 1.5,
            px: 2,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              transform: 'translateX(4px)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          Sort By Date ({sortOrder === "desc" ? "Newest First" : "Oldest First"})
        </MenuItem>
        {['Title', 'Status'].map((sort) => (
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

      {/* Search by Title Filter */}
      {filter === "Title" && (
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search by title"
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#2A2A2A',
                border: '1px solid #555',
                '& fieldset': { border: 'none' },
                '&:hover fieldset': { border: 'none' },
                '&.Mui-focused fieldset': { border: '1px solid #E6B800' },
              },
              '& .MuiInputBase-input': { color: 'white' },
            }}
          />
        </Box>
      )}

      {/* Custom Date Range Filter */}
      {filter === "Custom" && (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(date) => setStartDate(date)}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#2A2A2A',
                      border: '1px solid #555',
                      '& fieldset': { border: 'none' },
                      '&:hover fieldset': { border: 'none' },
                      '&.Mui-focused fieldset': { border: '1px solid #E6B800' },
                    },
                    '& .MuiInputBase-input': { color: 'white' },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    '& .MuiSvgIcon-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  }
                }
              }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(date) => setEndDate(date)}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#2A2A2A',
                      border: '1px solid #555',
                      '& fieldset': { border: 'none' },
                      '&:hover fieldset': { border: 'none' },
                      '&.Mui-focused fieldset': { border: '1px solid #E6B800' },
                    },
                    '& .MuiInputBase-input': { color: 'white' },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    '& .MuiSvgIcon-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  }
                }
              }}
            />
            <Button
              variant="contained"
              onClick={() => setFilter("Custom")}
              sx={{
                bgcolor: '#E6B800',
                color: 'black',
                fontWeight: '600',
                '&:hover': { bgcolor: '#D4A600' },
              }}
            >
              Apply
            </Button>
          </Box>
        </LocalizationProvider>
      )}

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
          {sortedSubmissions.map((submission) => {
            // Use mapped status for styling (using approval_status from your API)
            const displayStatus = getStatusDisplay(submission.approval_status);
            const styles = getStatusStyles(displayStatus);
            // Generate CSS class name for fallback
            const statusClass = `status-${displayStatus.toLowerCase().replace(' ', '-')}`;
            const chipClass = `chip-${displayStatus.toLowerCase().replace(' ', '-')}`;

            // Show exact title as stored in database - no parsing
            const exactTitle = submission.title;

            return (
              <Box
                key={submission.id}
                className={statusClass}
                style={{
                  backgroundColor: styles.bg,
                  border: `1px solid ${styles.border}`,
                  borderRadius: '16px',
                  padding: '24px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backdropFilter: 'blur(10px)',
                }}
                sx={{
                  '&:hover': {
                    bgcolor: styles.hoverBg,
                    borderColor: styles.hoverBorder,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 32px ${styles.shadow}`,
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    bgcolor: styles.base,
                    borderRadius: '16px 16px 0 0',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '4px',
                    height: '100%',
                    bgcolor: styles.base,
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
                  {exactTitle}
                </Typography>
                <Chip
                  label={displayStatus}
                  size="small"
                  className={chipClass}
                  style={{
                    backgroundColor: styles.base,
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '0.75rem',
                    height: '26px',
                    borderRadius: '13px',
                    border: `1px solid ${styles.base}`,
                    boxShadow: `0 2px 8px ${styles.chipShadow}`,
                  }}
                  sx={{
                    '& .MuiChip-label': {
                      px: 1.5
                    },
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: `0 4px 12px ${styles.chipHoverShadow}`,
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
                Submitted on {new Date(submission.created_at).toLocaleDateString()}
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {submission.google_doc_link && (
                    <Button
                      startIcon={<DocIcon />}
                      size="small"
                      onClick={() => window.open(submission.google_doc_link, '_blank')}
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
                  )}
                  {submission.loom_url && displayStatus === 'Rejected' && (
                    <Button
                      size="small"
                      onClick={() => window.open(submission.loom_url, '_blank')}
                      sx={{
                        bgcolor: 'rgba(156, 39, 176, 0.8)',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '0.8rem',
                        borderRadius: '10px',
                        px: 2,
                        py: 0.8,
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: 'rgba(156, 39, 176, 1)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(156, 39, 176, 0.4)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      View Feedback
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
            );
          })}

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