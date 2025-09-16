import React, { useEffect, useState, useContext } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  IconButton, 
  TextField, 
  MenuItem, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Select, 
  InputLabel, 
  FormControl,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
  Switch,
  FormControlLabel,
  Tooltip,
  Alert,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ButtonGroup,
  Avatar,
  Collapse
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { 
  Delete as DeleteIcon, 
  Edit as EditIcon, 
  Add as AddIcon, 
  Restore as RestoreIcon,
  Preview as PreviewIcon,
  Save as SaveIcon,
  Palette as PaletteIcon,
  TextFields as TextFieldsIcon,
  Image as ImageIcon,
  DragIndicator,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  ExpandMore,
  AutoFixHigh,
  Settings as SettingsIcon,
  Star as StarIcon,
  Business as BusinessIcon,
  Info as InfoIcon,
  Help as HelpIcon,
  GetApp as ExportIcon,
  CloudUpload as ImportIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import api from '../api';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { NotificationContext } from '../contexts/NotificationContext';

const dynamicFields = [
  { label: 'Customer Name', value: '{customerName}', category: 'Customer', icon: '👤' },
  { label: 'Customer Phone', value: '{customerPhone}', category: 'Customer', icon: '📞' },
  { label: 'Customer Address', value: '{customerAddress}', category: 'Customer', icon: '📍' },
  { label: 'Invoice Date', value: '{invoiceDate}', category: 'Invoice', icon: '📅' },
  { label: 'Invoice Number', value: '{invoiceNumber}', category: 'Invoice', icon: '#️⃣' },
  { label: 'Due Date', value: '{dueDate}', category: 'Invoice', icon: '⏰' },
  { label: 'Total Amount', value: '{totalAmount}', category: 'Financial', icon: '💰' },
  { label: 'Subtotal', value: '{subtotal}', category: 'Financial', icon: '💵' },
  { label: 'Tax Amount', value: '{taxAmount}', category: 'Financial', icon: '🧾' },
  { label: 'Discount', value: '{discount}', category: 'Financial', icon: '🎯' },
  { label: 'Company Name', value: '{companyName}', category: 'Business', icon: '🏢' },
  { label: 'Company Address', value: '{companyAddress}', category: 'Business', icon: '🏪' },
  { label: 'Company Phone', value: '{companyPhone}', category: 'Business', icon: '☎️' },
];

const Text = ({ text, style = {} }) => (
  <Typography 
    sx={{ 
      ...style,
      p: 1,
      borderRadius: 1,
      '&:hover': { bgcolor: 'action.hover' }
    }}
  >
    {text}
  </Typography>
);

const Image = ({ src, style = {} }) => (
  <Box sx={{ p: 1, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
    <img 
      src={src} 
      alt="" 
      style={{ 
        maxWidth: '100%', 
        maxHeight: '100px',
        borderRadius: '8px',
        ...style 
      }} 
    />
  </Box>
);

const defaultTemplate = [
  { 
    id: '1', 
    type: 'Text', 
    props: { 
      text: 'INVOICE', 
      style: { 
        fontSize: '2rem', 
        fontWeight: 'bold', 
        textAlign: 'center',
        color: 'primary.main'
      } 
    } 
  },
  { 
    id: '2', 
    type: 'Text', 
    props: { 
      text: '{companyName}', 
      style: { 
        fontSize: '1.5rem', 
        fontWeight: '600',
        textAlign: 'center',
        mb: 1
      } 
    } 
  },
  { 
    id: '3', 
    type: 'Text', 
    props: { 
      text: 'Bill To: {customerName}', 
      style: { 
        fontSize: '1.1rem',
        mt: 2
      } 
    } 
  },
  { 
    id: '4', 
    type: 'Text', 
    props: { 
      text: 'Invoice #: {invoiceNumber} | Date: {invoiceDate}', 
      style: { 
        fontSize: '1rem',
        color: 'text.secondary'
      } 
    } 
  },
  { 
    id: '5', 
    type: 'Text', 
    props: { 
      text: 'Total Amount: {totalAmount}', 
      style: { 
        fontSize: '1.5rem',
        fontWeight: 'bold',
        textAlign: 'right',
        mt: 3,
        color: 'success.main'
      } 
    } 
  },
];

const componentMap = { Text, Image };

const InvoiceDesigner = () => {
  const theme = useTheme();
  const [template, setTemplate] = useState(defaultTemplate);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [editText, setEditText] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editStyle, setEditStyle] = useState({});
  const [templates, setTemplates] = useState([]);
  const [templateName, setTemplateName] = useState('Default');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFieldPanel, setShowFieldPanel] = useState(true);
  const { showSnackbar } = useContext(NotificationContext);

  // Group dynamic fields by category
  const fieldCategories = dynamicFields.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {});

  useEffect(() => {
    setLoading(true);
    api.get('/invoice-template')
      .then(res => {
        setTemplates(res.data.templates || []);
        const found = res.data.templates?.find(t => t.name === templateName);
        if (found) setTemplate(found.template);
      })
      .catch((error) => {
        console.error('Load templates error:', error);
        showSnackbar('Failed to load templates', 'error');
      })
      .finally(() => setLoading(false));
  }, [templateName, showSnackbar]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/invoice-template', { name: templateName, template });
      showSnackbar('Template saved successfully! 🎉', 'success');
    } catch (error) {
      console.error('Save error:', error);
      showSnackbar('Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await api.post('/invoice-template/reset', { name: templateName });
      setTemplate(res.data.template || defaultTemplate);
      showSnackbar('Template reset to default', 'success');
    } catch (error) {
      console.error('Reset error:', error);
      showSnackbar('Reset failed', 'error');
    } finally {
      setResetting(false);
    }
  };

  const addText = () => {
    const newItem = { 
      id: Date.now().toString(), 
      type: 'Text', 
      props: { 
        text: 'New Text Element', 
        style: { fontSize: '1rem', color: 'text.primary' } 
      } 
    };
    setTemplate([...template, newItem]);
  };

  const addImage = () => {
    const newItem = { 
      id: Date.now().toString(), 
      type: 'Image', 
      props: { 
        src: '/logo.png',
        style: { maxWidth: '200px' }
      } 
    };
    setTemplate([...template, newItem]);
  };

  const addDynamicField = (field) => {
    const newItem = { 
      id: Date.now().toString(), 
      type: 'Text', 
      props: { 
        text: field, 
        style: { fontSize: '1rem', color: 'text.primary' } 
      } 
    };
    setTemplate([...template, newItem]);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(template);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setTemplate(items);
  };

  const handleDelete = (id) => setTemplate(template.filter(item => item.id !== id));

  const handleDuplicate = (item) => {
    const duplicated = { 
      ...item, 
      id: Date.now().toString(),
      props: { ...item.props, text: item.props.text + ' (Copy)' }
    };
    const index = template.findIndex(t => t.id === item.id);
    const newTemplate = [...template];
    newTemplate.splice(index + 1, 0, duplicated);
    setTemplate(newTemplate);
  };

  const handleEdit = (idx) => {
    setEditIdx(idx);
    const item = template[idx];
    setEditText(item.props.text || '');
    setEditImage(item.props.src || '');
    setEditStyle(item.props.style || {});
    setDialogOpen(true);
  };

  const handleDialogSave = () => {
    const updated = [...template];
    if (updated[editIdx].type === 'Text') {
      updated[editIdx].props.text = editText;
      updated[editIdx].props.style = editStyle;
    }
    if (updated[editIdx].type === 'Image') {
      updated[editIdx].props.src = editImage;
      updated[editIdx].props.style = editStyle;
    }
    setTemplate(updated);
    setDialogOpen(false);
  };

  const handleTemplateChange = (e) => setTemplateName(e.target.value);

  const filteredFields = selectedCategory === 'All' 
    ? dynamicFields 
    : dynamicFields.filter(field => field.category === selectedCategory);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
      p: { xs: 1, sm: 2, md: 3 }
    }}>
      {/* Header Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          mb: 3, 
          p: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          borderRadius: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
              <PaletteIcon sx={{ fontSize: '2rem' }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Invoice Designer
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Create beautiful, professional invoices with our drag-and-drop designer
              </Typography>
            </Box>
          </Box>
          <Chip
            icon={<StarIcon />}
            label="Premium Feature"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              '& .MuiChip-icon': { color: 'white' }
            }}
          />
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Panel - Tools & Fields */}
        <Grid item xs={12} md={6} lg={3}>
          <Stack spacing={2}>
            {/* Template Controls */}
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SettingsIcon color="primary" />
                  Template Settings
                </Typography>
                
                <Stack spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Template</InputLabel>
                    <Select 
                      value={templateName} 
                      label="Select Template" 
                      onChange={handleTemplateChange}
                      disabled={loading}
                    >
                      {loading ? (
                        <MenuItem disabled>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <RefreshIcon fontSize="small" className="animate-spin" />
                            Loading templates...
                          </Box>
                        </MenuItem>
                      ) : (
                        <>
                          {templates.map(t => (
                            <MenuItem key={t.name} value={t.name}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <BusinessIcon fontSize="small" />
                                {t.name}
                              </Box>
                            </MenuItem>
                          ))}
                          <MenuItem value="Default">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AutoFixHigh fontSize="small" />
                              Default Template
                            </Box>
                          </MenuItem>
                        </>
                      )}
                    </Select>
                  </FormControl>

                  <TextField 
                    label="Template Name" 
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    size="small"
                    fullWidth
                  />

                  <ButtonGroup orientation="vertical" fullWidth>
                    <Button 
                      startIcon={saving ? <RefreshIcon className="animate-spin" /> : <SaveIcon />} 
                      onClick={handleSave} 
                      variant="contained" 
                      disabled={saving || resetting}
                      sx={{ py: 1.5 }}
                    >
                      {saving ? 'Saving...' : 'Save Template'}
                    </Button>
                    <Button 
                      startIcon={resetting ? <RefreshIcon className="animate-spin" /> : <RestoreIcon />} 
                      onClick={handleReset} 
                      variant="outlined"
                      disabled={saving || resetting}
                      sx={{ py: 1.5 }}
                    >
                      {resetting ? 'Resetting...' : 'Reset to Default'}
                    </Button>
                  </ButtonGroup>
                </Stack>
              </CardContent>
            </Card>

            {/* Add Elements */}
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AddIcon color="primary" />
                  Add Elements
                </Typography>
                
                <Stack spacing={1}>
                  <Button
                    startIcon={<TextFieldsIcon />}
                    onClick={addText}
                    variant="outlined"
                    fullWidth
                    sx={{ justifyContent: 'flex-start', py: 1.5 }}
                  >
                    Add Text Element
                  </Button>
                  <Button
                    startIcon={<ImageIcon />}
                    onClick={addImage}
                    variant="outlined"
                    fullWidth
                    sx={{ justifyContent: 'flex-start', py: 1.5 }}
                  >
                    Add Image Element
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Dynamic Fields */}
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoFixHigh color="primary" />
                    Dynamic Fields
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={showFieldPanel} 
                        onChange={(e) => setShowFieldPanel(e.target.checked)}
                        size="small"
                      />
                    }
                    label=""
                  />
                </Box>

                <Collapse in={showFieldPanel}>
                  <Stack spacing={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Category</InputLabel>
                      <Select 
                        value={selectedCategory} 
                        label="Category" 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        <MenuItem value="All">All Categories</MenuItem>
                        {Object.keys(fieldCategories).map(category => (
                          <MenuItem key={category} value={category}>{category}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                      <Stack spacing={1}>
                        {filteredFields.map(field => (
                          <Tooltip key={field.value} title={`Add ${field.label}`} placement="right">
                            <Button
                              onClick={() => addDynamicField(field.value)}
                              variant="outlined"
                              size="small"
                              fullWidth
                              sx={{ 
                                justifyContent: 'flex-start',
                                textTransform: 'none',
                                fontSize: '0.875rem'
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                <span>{field.icon}</span>
                                <span>{field.label}</span>
                                <Chip 
                                  label={field.category} 
                                  size="small" 
                                  sx={{ ml: 'auto', fontSize: '0.7rem', height: 20 }}
                                />
                              </Box>
                            </Button>
                          </Tooltip>
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                </Collapse>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Center Panel - Design Canvas */}
        <Grid item xs={12} md={12} lg={6}>
          <Card sx={{ borderRadius: 2, minHeight: 600 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PaletteIcon color="primary" />
                  Design Canvas
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title={previewMode ? "Edit Mode" : "Preview Mode"}>
                    <IconButton 
                      onClick={() => setPreviewMode(!previewMode)}
                      color={previewMode ? "primary" : "default"}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download PDF">
                    <IconButton color="primary">
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {template.length === 0 ? (
                <Box 
                  sx={{ 
                    minHeight: 500, 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                    p: 4,
                    textAlign: 'center'
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      mb: 2
                    }}
                  >
                    <PaletteIcon sx={{ fontSize: '2.5rem', color: 'primary.main' }} />
                  </Avatar>
                  <Typography variant="h6" color="primary.main" gutterBottom>
                    Start Creating Your Invoice
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 300 }}>
                    Add text elements, images, or dynamic fields from the left panel to begin designing your professional invoice template.
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
                    <Button 
                      variant="outlined" 
                      startIcon={<TextFieldsIcon />}
                      onClick={addText}
                      size="small"
                    >
                      Add Text
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={<ImageIcon />}
                      onClick={addImage}
                      size="small"
                    >
                      Add Image
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Paper 
                  elevation={previewMode ? 3 : 1} 
                  sx={{ 
                    minHeight: 500, 
                    p: 3, 
                    borderRadius: 2,
                    border: previewMode ? `2px solid ${theme.palette.primary.main}` : '1px dashed #ddd',
                    background: previewMode ? 'white' : alpha(theme.palette.background.paper, 0.8)
                  }}
                >
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="designer">
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          sx={{
                            minHeight: 400,
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: snapshot.isDraggingOver 
                              ? alpha(theme.palette.primary.main, 0.08) 
                              : 'transparent',
                            border: snapshot.isDraggingOver 
                              ? `2px dashed ${theme.palette.primary.main}` 
                              : '2px dashed transparent',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            '&::before': snapshot.isDraggingOver ? {
                              content: '"Drop here to add element"',
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              color: 'primary.main',
                              fontWeight: 'bold',
                              fontSize: '1.1rem',
                              pointerEvents: 'none',
                              zIndex: 1,
                              opacity: 0.7
                            } : {}
                          }}
                        >
                          {template.map((item, idx) => {
                            const Comp = componentMap[item.type];
                            return (
                              <Draggable key={item.id} draggableId={item.id} index={idx} isDragDisabled={previewMode}>
                                {(provided, snapshot) => (
                                  <Box
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    sx={{
                                      mb: 1.5,
                                      p: 2,
                                      borderRadius: 2,
                                      border: !previewMode ? '1px solid transparent' : 'none',
                                      '&:hover': !previewMode ? {
                                        border: `1px solid ${theme.palette.primary.main}`,
                                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`
                                      } : {},
                                      backgroundColor: snapshot.isDragging ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                                      transform: snapshot.isDragging ? 'rotate(1deg) scale(1.02)' : 'none',
                                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                      boxShadow: snapshot.isDragging ? `0 8px 25px ${alpha(theme.palette.primary.main, 0.25)}` : 'none'
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                      {!previewMode && (
                                        <Box 
                                          {...provided.dragHandleProps}
                                          sx={{ 
                                            cursor: 'grab',
                                            color: 'text.secondary',
                                            mt: 0.5,
                                            p: 0.5,
                                            borderRadius: 1,
                                            '&:hover': { 
                                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                                              color: 'primary.main'
                                            },
                                            '&:active': { cursor: 'grabbing' },
                                            transition: 'all 0.2s ease'
                                          }}
                                        >
                                          <DragIndicator />
                                        </Box>
                                      )}
                                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                        {Comp ? <Comp {...item.props} /> : null}
                                      </Box>
                                      {!previewMode && (
                                        <Stack direction="row" spacing={0.5} sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}>
                                          <Tooltip title="Edit Element" arrow>
                                            <IconButton 
                                              onClick={() => handleEdit(idx)} 
                                              size="small" 
                                              color="primary"
                                              sx={{ 
                                                transition: 'all 0.2s ease',
                                                '&:hover': { 
                                                  transform: 'scale(1.1)',
                                                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                                                }
                                              }}
                                            >
                                              <EditIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="Duplicate Element" arrow>
                                            <IconButton 
                                              onClick={() => handleDuplicate(item)} 
                                              size="small" 
                                              color="info"
                                              sx={{ 
                                                transition: 'all 0.2s ease',
                                                '&:hover': { 
                                                  transform: 'scale(1.1)',
                                                  bgcolor: alpha(theme.palette.info.main, 0.1)
                                                }
                                              }}
                                            >
                                              <CopyIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="Delete Element" arrow>
                                            <IconButton 
                                              onClick={() => handleDelete(item.id)} 
                                              size="small" 
                                              color="error"
                                              sx={{ 
                                                transition: 'all 0.2s ease',
                                                '&:hover': { 
                                                  transform: 'scale(1.1)',
                                                  bgcolor: alpha(theme.palette.error.main, 0.1)
                                                }
                                              }}
                                            >
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        </Stack>
                                      )}
                                    </Box>
                                  </Box>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </Box>
                      )}
                    </Droppable>
                  </DragDropContext>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - Properties & Preview */}
        <Grid item xs={12} md={6} lg={3}>
          <Stack spacing={2}>
            {/* Quick Actions */}
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PreviewIcon color="primary" />
                  Quick Actions
                </Typography>
                
                <Stack spacing={1}>
                  <Button
                    startIcon={<ImportIcon />}
                    variant="outlined"
                    fullWidth
                    sx={{ justifyContent: 'flex-start', py: 1.5 }}
                  >
                    Import Template
                  </Button>
                  <Button
                    startIcon={<ExportIcon />}
                    variant="outlined"
                    fullWidth
                    sx={{ justifyContent: 'flex-start', py: 1.5 }}
                  >
                    Export Template
                  </Button>
                  <Button
                    startIcon={<VisibilityIcon />}
                    variant="contained"
                    fullWidth
                    onClick={() => setPreviewMode(!previewMode)}
                    sx={{ justifyContent: 'flex-start', py: 1.5 }}
                  >
                    {previewMode ? 'Exit Preview' : 'Preview Invoice'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Template Info */}
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Template Info
                </Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Elements Count
                    </Typography>
                    <Typography variant="h4" color="primary.main">
                      {template.length}
                    </Typography>
                  </Box>
                  
                  <Divider />
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Element Types
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip 
                        icon={<TextFieldsIcon />}
                        label={`${template.filter(t => t.type === 'Text').length} Text`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip 
                        icon={<ImageIcon />}
                        label={`${template.filter(t => t.type === 'Image').length} Images`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Help & Tips */}
            <Card sx={{ 
              borderRadius: 2, 
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: 'info.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HelpIcon />
                  Pro Tips
                </Typography>
                
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box sx={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      bgcolor: 'info.main', 
                      mt: 1,
                      flexShrink: 0
                    }} />
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                      Drag elements using the handle to reorder them in your template
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box sx={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      bgcolor: 'info.main', 
                      mt: 1,
                      flexShrink: 0
                    }} />
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                      Use dynamic fields (like {'{customerName}'}) for data that changes per invoice
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box sx={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      bgcolor: 'info.main', 
                      mt: 1,
                      flexShrink: 0
                    }} />
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                      Toggle preview mode to see how your invoice will look to customers
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box sx={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      bgcolor: 'info.main', 
                      mt: 1,
                      flexShrink: 0
                    }} />
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                      Save multiple templates for different business needs or customers
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        aria-labelledby="edit-element-dialog-title"
        aria-describedby="edit-element-dialog-description"
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon color="primary" />
            Edit Element
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            {editIdx !== null && template[editIdx]?.type === 'Text' && (
              <>
                <TextField
                  label="Text Content"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  helperText="Use dynamic fields like {customerName} for data that changes per invoice"
                />
                
                <Accordion sx={{ borderRadius: 2, '&:before': { display: 'none' } }}>
                  <AccordionSummary 
                    expandIcon={<ExpandMore />}
                    sx={{ borderRadius: 2 }}
                  >
                    <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SettingsIcon fontSize="small" />
                      Style Settings
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Font Size"
                          value={editStyle.fontSize || '1rem'}
                          onChange={e => setEditStyle({...editStyle, fontSize: e.target.value})}
                          fullWidth
                          size="small"
                          helperText="e.g., 1rem, 16px, 1.2em"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Color"
                          value={editStyle.color || 'text.primary'}
                          onChange={e => setEditStyle({...editStyle, color: e.target.value})}
                          fullWidth
                          size="small"
                          helperText="e.g., #000000, primary.main"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Text Align</InputLabel>
                          <Select
                            value={editStyle.textAlign || 'left'}
                            label="Text Align"
                            onChange={e => setEditStyle({...editStyle, textAlign: e.target.value})}
                          >
                            <MenuItem value="left">Left</MenuItem>
                            <MenuItem value="center">Center</MenuItem>
                            <MenuItem value="right">Right</MenuItem>
                            <MenuItem value="justify">Justify</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Font Weight</InputLabel>
                          <Select
                            value={editStyle.fontWeight || 'normal'}
                            label="Font Weight"
                            onChange={e => setEditStyle({...editStyle, fontWeight: e.target.value})}
                          >
                            <MenuItem value="300">Light</MenuItem>
                            <MenuItem value="normal">Normal</MenuItem>
                            <MenuItem value="500">Medium</MenuItem>
                            <MenuItem value="600">Semi Bold</MenuItem>
                            <MenuItem value="bold">Bold</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </>
            )}
            
            {editIdx !== null && template[editIdx]?.type === 'Image' && (
              <>
                <TextField
                  label="Image URL"
                  value={editImage}
                  onChange={e => setEditImage(e.target.value)}
                  fullWidth
                  helperText="Enter a valid image URL or upload to your server"
                />
                
                <Accordion sx={{ borderRadius: 2, '&:before': { display: 'none' } }}>
                  <AccordionSummary 
                    expandIcon={<ExpandMore />}
                    sx={{ borderRadius: 2 }}
                  >
                    <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ImageIcon fontSize="small" />
                      Image Settings
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Max Width"
                          value={editStyle.maxWidth || '200px'}
                          onChange={e => setEditStyle({...editStyle, maxWidth: e.target.value})}
                          fullWidth
                          size="small"
                          helperText="e.g., 200px, 50%, auto"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Max Height"
                          value={editStyle.maxHeight || '100px'}
                          onChange={e => setEditStyle({...editStyle, maxHeight: e.target.value})}
                          fullWidth
                          size="small"
                          helperText="e.g., 100px, 50%, auto"
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Button 
            onClick={() => setDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDialogSave} 
            variant="contained" 
            startIcon={<SaveIcon />}
            sx={{ borderRadius: 2 }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceDesigner;
