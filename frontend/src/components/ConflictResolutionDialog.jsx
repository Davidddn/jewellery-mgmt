// src/components/ConflictResolutionDialog.jsx
// Universal conflict resolution dialog for all entities
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  IconButton,
  Chip,
  Alert,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon, // eslint-disable-next-line no-unused-vars
  Merge as MergeIcon,
  Schedule as TimeIcon,
  Person as PersonIcon,
  CloudDownload as ServerIcon,
  PhonelinkIcon as LocalIcon
} from '@mui/icons-material';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`conflict-tabpanel-${index}`}
      aria-labelledby={`conflict-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export function ConflictResolutionDialog({ 
  open, 
  onClose, 
  conflicts, 
  onResolve,
  entityType = 'item',
  entityName = 'Item'
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [resolutions, setResolutions] = useState({});
  const [mergedData, setMergedData] = useState({});
  const [autoResolution, setAutoResolution] = useState('manual');
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Reset state when conflicts change
  useEffect(() => {
    if (conflicts && conflicts.length > 0) {
      const initialResolutions = {};
      const initialMerged = {};
      
      conflicts.forEach(conflict => {
        Object.keys(conflict.fields || {}).forEach(fieldName => {
          const field = conflict.fields[fieldName];
          if (field.resolution) {
            initialResolutions[`${conflict.id}_${fieldName}`] = field.resolution;
          }
          if (field.merged !== undefined) {
            initialMerged[`${conflict.id}_${fieldName}`] = field.merged;
          }
        });
      });
      
      setResolutions(initialResolutions);
      setMergedData(initialMerged);
      setActiveTab(0);
    }
  }, [conflicts]);

  const handleResolutionChange = (conflictId, fieldName, resolution) => {
    const key = `${conflictId}_${fieldName}`;
    setResolutions(prev => ({ ...prev, [key]: resolution }));
  };

  const handleMergedDataChange = (conflictId, fieldName, value) => {
    const key = `${conflictId}_${fieldName}`;
    setMergedData(prev => ({ ...prev, [key]: value }));
  };

  const handleAutoResolve = () => {
    const newResolutions = {};
    
    conflicts.forEach(conflict => {
      Object.keys(conflict.fields || {}).forEach(fieldName => {
        const field = conflict.fields[fieldName];
        const key = `${conflict.id}_${fieldName}`;
        
        switch (autoResolution) {
          case 'prefer-local':
            newResolutions[key] = 'local';
            break;
          case 'prefer-server':
            newResolutions[key] = 'server';
            break;
          case 'latest-timestamp':
            if (field.localTimestamp && field.serverTimestamp) {
              newResolutions[key] = new Date(field.localTimestamp) > new Date(field.serverTimestamp) ? 'local' : 'server';
            } else {
              newResolutions[key] = 'local'; // fallback
            }
            break;
          default:
            // Keep existing resolution
            break;
        }
      });
    });
    
    setResolutions(prev => ({ ...prev, ...newResolutions }));
  };

  const handleResolveAll = () => {
    const resolvedConflicts = conflicts.map(conflict => ({
      ...conflict,
      resolved: true,
      resolutions: Object.keys(conflict.fields || {}).reduce((acc, fieldName) => {
        const key = `${conflict.id}_${fieldName}`;
        acc[fieldName] = {
          action: resolutions[key] || 'local',
          mergedValue: mergedData[key]
        };
        return acc;
      }, {})
    }));
    
    onResolve(resolvedConflicts);
    onClose();
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    return String(value);
  };

  const getFieldIcon = (fieldType) => {
    switch (fieldType) {
      case 'timestamp': return <TimeIcon fontSize="small" />;
      case 'user': return <PersonIcon fontSize="small" />;
      default: return null;
    }
  };

  const getConflictSeverity = (conflict) => {
    const fieldCount = Object.keys(conflict.fields || {}).length;
    if (fieldCount > 5) return 'high';
    if (fieldCount > 2) return 'medium';
    return 'low';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  if (!conflicts || conflicts.length === 0) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: { 
          height: isMobile ? '100%' : '90vh',
          borderRadius: isMobile ? 0 : 2
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          <Typography variant="h6">
            Resolve {entityName} Conflicts ({conflicts.length})
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Auto-resolution controls */}
        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Changes were made both locally and on the server. Please resolve conflicts manually or choose an auto-resolution strategy.
          </Alert>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl component="fieldset" size="small">
              <FormLabel component="legend">Auto-resolve strategy:</FormLabel>
              <RadioGroup
                row
                value={autoResolution}
                onChange={(e) => setAutoResolution(e.target.value)}
              >
                <FormControlLabel value="manual" control={<Radio />} label="Manual" />
                <FormControlLabel value="prefer-local" control={<Radio />} label="Prefer Local" />
                <FormControlLabel value="prefer-server" control={<Radio />} label="Prefer Server" />
                <FormControlLabel value="latest-timestamp" control={<Radio />} label="Latest Timestamp" />
              </RadioGroup>
            </FormControl>
            
            {autoResolution !== 'manual' && (
              <Button
                variant="outlined"
                onClick={handleAutoResolve}
                startIcon={<MergeIcon />}
                size="small"
              >
                Apply Auto-Resolution
              </Button>
            )}
          </Box>
        </Box>

        {/* Conflict tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {conflicts.map((conflict, index) => (
              <Tab 
                key={conflict.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      {entityName} {index + 1}
                    </Typography>
                    <Chip 
                      size="small" 
                      label={getConflictSeverity(conflict)}
                      color={getSeverityColor(getConflictSeverity(conflict))}
                    />
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>

        {/* Conflict resolution content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {conflicts.map((conflict, index) => (
            <TabPanel key={conflict.id} value={activeTab} index={index}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Conflict Details
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Entity: {conflict.entityType || entityType} | ID: {conflict.entityId || conflict.id}
                  </Typography>
                  {conflict.timestamp && (
                    <Typography variant="body2" color="textSecondary">
                      Detected: {new Date(conflict.timestamp).toLocaleString()}
                    </Typography>
                  )}
                </Box>

                {/* Field conflicts */}
                {Object.entries(conflict.fields || {}).map(([fieldName, field]) => {
                  const key = `${conflict.id}_${fieldName}`;
                  const currentResolution = resolutions[key] || 'local';
                  
                  return (
                    <Accordion key={fieldName} defaultExpanded={index === 0}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                          {getFieldIcon(field.type)}
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            {fieldName}
                          </Typography>
                          <Chip 
                            size="small"
                            label={currentResolution}
                            color={currentResolution === 'merged' ? 'secondary' : 'primary'}
                            variant="outlined"
                          />
                        </Box>
                      </AccordionSummary>
                      
                      <AccordionDetails>
                        <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 2 }}>
                          {/* Local version */}
                          <Card variant="outlined">
                            <CardContent sx={{ p: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <LocalIcon color="info" />
                                <Typography variant="subtitle2" fontWeight="bold">
                                  Local Version
                                </Typography>
                                {field.localTimestamp && (
                                  <Typography variant="caption" color="textSecondary">
                                    {new Date(field.localTimestamp).toLocaleString()}
                                  </Typography>
                                )}
                              </Box>
                              <Box 
                                component="pre" 
                                sx={{ 
                                  fontSize: '0.8rem',
                                  backgroundColor: '#f5f5f5',
                                  p: 1,
                                  borderRadius: 1,
                                  overflow: 'auto',
                                  maxHeight: 150,
                                  whiteSpace: 'pre-wrap'
                                }}
                              >
                                {formatValue(field.local)}
                              </Box>
                            </CardContent>
                          </Card>

                          {/* Server version */}
                          <Card variant="outlined">
                            <CardContent sx={{ p: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <ServerIcon color="warning" />
                                <Typography variant="subtitle2" fontWeight="bold">
                                  Server Version
                                </Typography>
                                {field.serverTimestamp && (
                                  <Typography variant="caption" color="textSecondary">
                                    {new Date(field.serverTimestamp).toLocaleString()}
                                  </Typography>
                                )}
                              </Box>
                              <Box 
                                component="pre" 
                                sx={{ 
                                  fontSize: '0.8rem',
                                  backgroundColor: '#f5f5f5',
                                  p: 1,
                                  borderRadius: 1,
                                  overflow: 'auto',
                                  maxHeight: 150,
                                  whiteSpace: 'pre-wrap'
                                }}
                              >
                                {formatValue(field.server)}
                              </Box>
                            </CardContent>
                          </Card>
                        </Box>

                        {/* Resolution options */}
                        <Box sx={{ mt: 2 }}>
                          <FormControl component="fieldset">
                            <FormLabel component="legend">Resolution:</FormLabel>
                            <RadioGroup
                              row
                              value={currentResolution}
                              onChange={(e) => handleResolutionChange(conflict.id, fieldName, e.target.value)}
                            >
                              <FormControlLabel 
                                value="local" 
                                control={<Radio />} 
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <LocalIcon fontSize="small" />
                                    Use Local
                                  </Box>
                                }
                              />
                              <FormControlLabel 
                                value="server" 
                                control={<Radio />} 
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <ServerIcon fontSize="small" />
                                    Use Server
                                  </Box>
                                }
                              />
                              <FormControlLabel 
                                value="merged" 
                                control={<Radio />} 
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <MergeIcon fontSize="small" />
                                    Merge/Custom
                                  </Box>
                                }
                              />
                            </RadioGroup>
                          </FormControl>

                          {/* Custom merge input */}
                          {currentResolution === 'merged' && (
                            <TextField
                              fullWidth
                              multiline
                              rows={3}
                              label="Custom merged value"
                              value={mergedData[key] || ''}
                              onChange={(e) => handleMergedDataChange(conflict.id, fieldName, e.target.value)}
                              sx={{ mt: 2 }}
                              placeholder="Enter the merged value or modify one of the versions above"
                            />
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            </TabPanel>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleResolveAll}
          variant="contained"
          startIcon={<CheckIcon />}
          color="primary"
        >
          Resolve All Conflicts
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConflictResolutionDialog;
