import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Grid,
  Paper,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Typography,
  Badge,
  IconButton,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  Search,
  FilterList,
  Close,
  TuneSharp,
  SavedSearch,
  History,
  Clear
} from '@mui/icons-material';

const AdvancedFilters = ({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  purityFilter,
  setPurityFilter,
  minPrice,
  maxPrice,
  tagFilter,
  setTagFilter,
  categories = [],
  purities = [],
  tags = [],
  onClearFilters,
  savedFilters = [],
  onSaveFilter,
  onLoadFilter
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [stockStatus, setStockStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [recentSearches, setRecentSearches] = useState([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentProductSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save search to recent searches
  const saveToRecentSearches = (search) => {
    if (!search.trim()) return;
    
    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentProductSearches', JSON.stringify(updated));
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleSearchSubmit = () => {
    saveToRecentSearches(searchTerm);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (categoryFilter) count++;
    if (purityFilter) count++;
    if (minPrice || maxPrice) count++;
    if (tagFilter && Array.isArray(tagFilter) && tagFilter.length > 0) count++;
    if (stockStatus !== 'all') count++;
    return count;
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      {/* Main Search Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-end' }}>
        <Autocomplete
          freeSolo
          sx={{ flex: 1 }}
          options={recentSearches}
          value={searchTerm}
          onInputChange={(event, newValue) => handleSearchChange(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search products..."
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: searchTerm && (
                  <IconButton 
                    size="small" 
                    onClick={() => setSearchTerm('')}
                    sx={{
                      borderRadius: 1.5,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        bgcolor: 'error.50',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <Clear fontSize="small" />
                  </IconButton>
                )
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <History fontSize="small" color="action" />
              {option}
            </Box>
          )}
        />
        
        <Button
          variant="outlined"
          startIcon={<TuneSharp />}
          onClick={() => setShowAdvanced(!showAdvanced)}
          sx={{ 
            minWidth: 'auto',
            borderRadius: 2,
            px: 3,
            py: 1.5,
            fontWeight: 500,
            textTransform: 'none',
            borderWidth: 2,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderWidth: 2,
              transform: 'translateY(-1px)',
              boxShadow: 2
            }
          }}
        >
          <Badge badgeContent={getActiveFilterCount()} color="primary">
            <FilterList />
          </Badge>
        </Button>
      </Box>

      {/* Recent Searches */}
      {recentSearches.length > 0 && !searchTerm && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Recent searches:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {recentSearches.map((search, index) => (
              <Chip
                key={index}
                label={search}
                size="small"
                variant="outlined"
                onClick={() => setSearchTerm(search)}
                onDelete={() => {
                  const updated = recentSearches.filter((_, i) => i !== index);
                  setRecentSearches(updated);
                  localStorage.setItem('recentProductSearches', JSON.stringify(updated));
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Advanced Filters */}
      <Collapse in={showAdvanced}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id || category} value={category.id || category}>
                    {category.name || category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Purity</InputLabel>
              <Select
                value={purityFilter}
                onChange={(e) => setPurityFilter(e.target.value)}
                label="Purity"
              >
                <MenuItem value="">All Purities</MenuItem>
                {purities.map((purity) => (
                  <MenuItem key={purity} value={purity}>
                    {purity || 'Unknown'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Stock Status</InputLabel>
              <Select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value)}
                label="Stock Status"
              >
                <MenuItem value="all">All Items</MenuItem>
                <MenuItem value="in_stock">In Stock</MenuItem>
                <MenuItem value="low_stock">Low Stock</MenuItem>
                <MenuItem value="out_of_stock">Out of Stock</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Sort By
              </Typography>
              <ToggleButtonGroup
                value={sortBy}
                exclusive
                onChange={(e, value) => value && setSortBy(value)}
                size="small"
                fullWidth
                sx={{
                  '& .MuiToggleButton-root': {
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: 1
                    },
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      }
                    }
                  }
                }}
              >
                <ToggleButton value="name">Name</ToggleButton>
                <ToggleButton value="price">Price</ToggleButton>
                <ToggleButton value="stock">Stock</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>

          {/* Price Range Slider */}
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Price Range: ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
            </Typography>
            <Slider
              value={priceRange}
              onChange={(e, newValue) => setPriceRange(newValue)}
              valueLabelDisplay="auto"
              min={0}
              max={500000}
              step={1000}
              valueLabelFormat={(value) => `₹${value.toLocaleString()}`}
            />
          </Grid>

          {/* Tags Filter */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              options={tags}
              value={tagFilter}
              onChange={(event, newValue) => setTagFilter(newValue)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags"
                  placeholder="Select tags..."
                />
              )}
            />
          </Grid>
        </Grid>

        {/* Filter Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              size="medium"
              onClick={onClearFilters}
              startIcon={<Clear />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 500,
                textTransform: 'none',
                borderWidth: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderWidth: 2,
                  bgcolor: 'error.50',
                  transform: 'translateY(-1px)',
                  boxShadow: 1
                }
              }}
              color="error"
            >
              Clear All
            </Button>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<SavedSearch />}
              onClick={() => onSaveFilter && onSaveFilter({
                searchTerm, categoryFilter, purityFilter, tagFilter, stockStatus, sortBy
              })}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 500,
                textTransform: 'none',
                borderWidth: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderWidth: 2,
                  bgcolor: 'success.50',
                  transform: 'translateY(-1px)',
                  boxShadow: 1
                }
              }}
              color="success"
            >
              Save Filter
            </Button>
          </Box>
          
          {savedFilters.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Saved Filters</InputLabel>
              <Select
                label="Saved Filters"
                onChange={(e) => onLoadFilter && onLoadFilter(e.target.value)}
              >
                {savedFilters.map((filter, index) => (
                  <MenuItem key={index} value={filter}>
                    {filter.name || `Filter ${index + 1}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default AdvancedFilters;
