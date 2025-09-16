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

export const importCustomersCsv = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/imports/customers', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const importTransactionsCsv = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/imports/transactions', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const importInventoryUpdates = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/imports/inventory', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};
