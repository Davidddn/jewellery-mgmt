import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Button,
  Tooltip
} from '@mui/material';
import {
  Visibility,
  ExpandMore,
  ExpandLess,
  ShoppingCart,
  Star,
  Bookmark
} from '@mui/icons-material';

const RecommendationsCard = ({ recommendations = [], onViewProduct }) => {
  const [expanded, setExpanded] = useState(false);

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <Card elevation={2} sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Star color="primary" />
            <Typography variant="h6" fontWeight="600">
              Smart Recommendations
            </Typography>
            <Chip label="AI" size="small" color="primary" variant="outlined" />
          </Box>
          <IconButton 
            size="medium" 
            onClick={() => setExpanded(!expanded)}
            sx={{
              borderRadius: 2,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: 'primary.50',
                transform: 'scale(1.1)'
              }
            }}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        {/* Always show top 2 recommendations */}
        <List dense>
          {recommendations.slice(0, 2).map((item, index) => (
            <ListItem key={item.id || index} sx={{ px: 0 }}>
              <ListItemIcon>
                <Avatar src={item.image_url} sx={{ width: 40, height: 40 }}>
                  <ShoppingCart />
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" fontWeight="500">
                      {item.name}
                    </Typography>
                    <Chip 
                      label={item.reason} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                    <Typography variant="body2" color="success.main" fontWeight="600">
                      ₹{item.selling_price?.toLocaleString()}
                    </Typography>
                    <Chip label={`${item.stock_quantity} in stock`} size="small" />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="medium" 
                          onClick={() => onViewProduct(item)}
                          sx={{
                            borderRadius: 2,
                            padding: 1,
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              bgcolor: 'info.50',
                              transform: 'scale(1.1)',
                              boxShadow: 1
                            }
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Add to Favorites">
                        <IconButton 
                          size="medium"
                          sx={{
                            borderRadius: 2,
                            padding: 1,
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              bgcolor: 'warning.50',
                              transform: 'scale(1.1)',
                              boxShadow: 1
                            }
                          }}
                        >
                          <Bookmark fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                }
                primaryTypographyProps={{ component: 'div' }}
                secondaryTypographyProps={{ component: 'div' }}
              />
            </ListItem>
          ))}
        </List>

        <Collapse in={expanded}>
          <List dense>
            {recommendations.slice(2).map((item, index) => (
              <ListItem key={item.id || index + 2} sx={{ px: 0 }}>
                <ListItemIcon>
                  <Avatar src={item.image_url} sx={{ width: 40, height: 40 }}>
                    <ShoppingCart />
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" fontWeight="500">
                        {item.name}
                      </Typography>
                      <Chip 
                        label={item.reason} 
                        size="small" 
                        color="secondary" 
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                      <Typography variant="body2" color="success.main" fontWeight="600">
                        ₹{item.selling_price?.toLocaleString()}
                      </Typography>
                      <Chip label={`${item.stock_quantity} in stock`} size="small" />
                    </Box>
                  }
                  primaryTypographyProps={{ component: 'div' }}
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
            ))}
          </List>
        </Collapse>

        {recommendations.length > 2 && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button
              size="medium"
              onClick={() => setExpanded(!expanded)}
              endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 500,
                textTransform: 'none',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: 'primary.50',
                  transform: 'translateY(-1px)',
                  boxShadow: 1
                }
              }}
            >
              {expanded ? 'Show Less' : `Show ${recommendations.length - 2} More`}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendationsCard;
