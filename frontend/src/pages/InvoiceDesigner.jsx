import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, Snackbar, Alert, Grid, IconButton, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Select, InputLabel, FormControl } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon, Restore as RestoreIcon } from '@mui/icons-material';
import api from '../api';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const dynamicFields = [
  { label: 'Customer Name', value: '{customerName}' },
  { label: 'Invoice Date', value: '{invoiceDate}' },
  { label: 'Invoice Number', value: '{invoiceNumber}' },
  { label: 'Total Amount', value: '{totalAmount}' },
];

const Text = ({ text }) => <Typography>{text}</Typography>;
const Image = ({ src }) => <img src={src} alt="" style={{ maxWidth: '100%' }} />;

const defaultTemplate = [
  { id: '1', type: 'Text', props: { text: 'Invoice Title' } },
  { id: '2', type: 'Text', props: { text: '{customerName}' } },
  { id: '3', type: 'Text', props: { text: '{invoiceDate}' } },
  { id: '4', type: 'Image', props: { src: '/logo.png' } },
];

const componentMap = { Text, Image };

const InvoiceDesigner = () => {
  const [template, setTemplate] = useState(defaultTemplate);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editIdx, setEditIdx] = useState(null);
  const [editText, setEditText] = useState('');
  const [editImage, setEditImage] = useState('');
  const [templates, setTemplates] = useState([]);
  const [templateName, setTemplateName] = useState('Default');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedField, setSelectedField] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/api/invoice-template')
      .then(res => {
        setTemplates(res.data.templates || []);
        const found = res.data.templates?.find(t => t.name === templateName);
        if (found) setTemplate(found.template);
      })
      .catch(() => setSnackbar({ open: true, message: 'Failed to load templates', severity: 'error' }))
      .finally(() => setLoading(false));
  }, [templateName]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post('/api/invoice-template', { name: templateName, template });
      setSnackbar({ open: true, message: 'Template saved!', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Save failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await api.post('/api/invoice-template/reset', { name: templateName });
      setTemplate(res.data.template);
      setSnackbar({ open: true, message: 'Template reset!', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Reset failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const addText = () => setTemplate([...template, { id: Date.now().toString(), type: 'Text', props: { text: 'New Text' } }]);
  const addImage = () => setTemplate([...template, { id: Date.now().toString(), type: 'Image', props: { src: '/logo.png' } }]);
  const addDynamicField = (field) => setTemplate([...template, { id: Date.now().toString(), type: 'Text', props: { text: field } }]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(template);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setTemplate(items);
  };

  const handleDelete = (id) => setTemplate(template.filter(item => item.id !== id));

  // Inline editing
  const handleEdit = (idx) => {
    setEditIdx(idx);
    setEditText(template[idx].props.text || '');
    setEditImage(template[idx].props.src || '');
    setDialogOpen(true);
  };
  const handleDialogSave = () => {
    const updated = [...template];
    if (updated[editIdx].type === 'Text') updated[editIdx].props.text = editText;
    if (updated[editIdx].type === 'Image') updated[editIdx].props.src = editImage;
    setTemplate(updated);
    setDialogOpen(false);
  };

  // Multiple templates
  const handleTemplateChange = (e) => setTemplateName(e.target.value);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Custom Invoice Designer (Premium)
      </Typography>
      <Box sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 180, mr: 2 }}>
          <InputLabel>Template</InputLabel>
          <Select value={templateName} label="Template" onChange={handleTemplateChange}>
            {templates.map(t => (
              <MenuItem key={t.name} value={t.name}>{t.name}</MenuItem>
            ))}
            <MenuItem value="Default">Default</MenuItem>
          </Select>
        </FormControl>
        <Button startIcon={<RestoreIcon />} onClick={handleReset} variant="outlined" color="secondary" sx={{ mr: 1 }}>
          Reset to Default
        </Button>
        <Button startIcon={<AddIcon />} onClick={() => setTemplateName(`Custom-${Date.now()}`)} variant="outlined">
          New Template
        </Button>
      </Box>
      <Paper sx={{ minHeight: 400, p: 2, mb: 2 }} elevation={3}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="designer">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {template.map((item, idx) => {
                  const Comp = componentMap[item.type];
                  return (
                    <Draggable key={item.id} draggableId={item.id} index={idx}>
                      {(provided, snapshot) => (
                        <Grid container alignItems="center" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} sx={{ mb: 2, background: snapshot.isDragging ? '#f0f0f0' : 'transparent', borderRadius: 1 }}>
                          <Grid item xs>
                            {Comp ? <Comp {...item.props} /> : null}
                          </Grid>
                          <Grid item>
                            <IconButton onClick={() => handleEdit(idx)} size="small" color="primary"><EditIcon /></IconButton>
                            <IconButton onClick={() => handleDelete(item.id)} size="small" color="error"><DeleteIcon /></IconButton>
                          </Grid>
                        </Grid>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </Paper>
      <Button onClick={addText} sx={{ mr: 1 }} variant="outlined">Add Text</Button>
      <Button onClick={addImage} sx={{ mr: 1 }} variant="outlined">Add Image</Button>
      <Button onClick={handleSave} variant="contained" color="primary" disabled={loading}>
        Save Template
      </Button>
      <FormControl size="small" sx={{ minWidth: 180, ml: 2 }}>
        <InputLabel>Dynamic Field</InputLabel>
        <Select
          value={selectedField}
          onChange={e => setSelectedField(e.target.value)}
          label="Dynamic Field"
        >
          {dynamicFields.map(f => (
            <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        onClick={() => {
          if (selectedField) {
            addDynamicField(selectedField);
            setSelectedField('');
          }
        }}
        sx={{ ml: 1 }}
        variant="outlined"
        disabled={!selectedField}
      >
        Add Dynamic Field
      </Button>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Edit Block</DialogTitle>
        <DialogContent>
          {editIdx !== null && template[editIdx]?.type === 'Text' && (
            <TextField
              label="Text"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
            />
          )}
          {editIdx !== null && template[editIdx]?.type === 'Image' && (
            <TextField
              label="Image URL"
              value={editImage}
              onChange={e => setEditImage(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDialogSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceDesigner;
