import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  TextField,
} from '@mui/material';
import { Download } from '@mui/icons-material';

const DownloadModal = ({ open, onClose, title, options, onDownload }) => {
  const [selectedValue, setSelectedValue] = useState(options.length > 0 ? options[0].value : '');
  const [localDateRange, setLocalDateRange] = useState({ start_date: '', end_date: '' });
  const [textInput, setTextInput] = useState('');

  React.useEffect(() => {
    if (options.length > 0) {
      setSelectedValue(options[0].value);
      setLocalDateRange({ start_date: '', end_date: '' });
      setTextInput('');
    }
  }, [options]);

  const handleValueChange = (event) => {
    setSelectedValue(event.target.value);
  };

  const handleDateChange = (event) => {
    setLocalDateRange({ ...localDateRange, [event.target.name]: event.target.value });
  };
  
  const handleTextChange = (event) => {
    setTextInput(event.target.value);
  };

  const handleDownloadClick = () => {
    let params = { type: selectedValue };
    const selectedOption = options.find(o => o.value === selectedValue);
    if (selectedOption.needsDateRange) {
        params = { ...params, ...localDateRange };
    }
    if (selectedOption.needsTextInput) {
        params = { ...params, [selectedOption.textInputName]: textInput };
    }
    onDownload(params);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }}>
          <FormLabel component="legend">Select Download Option</FormLabel>
          <RadioGroup value={selectedValue} onChange={handleValueChange}>
            {options.map((option) => (
              <Box key={option.value}>
                <FormControlLabel value={option.value} control={<Radio />} label={option.label} />
                {selectedValue === option.value && option.needsDateRange && (
                  <Box sx={{ display: 'flex', gap: 2, my: 1, ml: 4 }}>
                    <TextField name="start_date" label="Start Date" type="date" value={localDateRange.start_date} onChange={handleDateChange} InputLabelProps={{ shrink: true }} fullWidth />
                    <TextField name="end_date" label="End Date" type="date" value={localDateRange.end_date} onChange={handleDateChange} InputLabelProps={{ shrink: true }} fullWidth />
                  </Box>
                )}
                {selectedValue === option.value && option.needsTextInput && (
                    <Box sx={{ my: 1, ml: 4 }}>
                        <TextField label={option.textInputLabel} value={textInput} onChange={handleTextChange} fullWidth />
                    </Box>
                )}
              </Box>
            ))}
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleDownloadClick} variant="contained" startIcon={<Download />}>Download</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DownloadModal;