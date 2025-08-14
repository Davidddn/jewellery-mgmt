import api from './config';

export const importProductsCsv = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/imports/products', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

// TODO: Add functions for importing transactions and customers
