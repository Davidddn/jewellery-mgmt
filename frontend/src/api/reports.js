import api from './config';

// Helper function to trigger file download in the browser
const downloadFile = (data, fallbackFilename) => {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fallbackFilename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const reportsAPI = {
  /**
   * Fetches the data for the main dashboard cards.
   * @param {string} date - The current date in YYYY-MM-DD format.
   * @returns {Promise<object>} The dashboard data.
   */
  getDailySales: async (date) => {
    const response = await api.get('/reports/daily-sales', { params: { date } });
    return response.data;
  },

  /**
   * Fetches the current gold rates.
   * @returns {Promise<object>} The gold rate data.
   */
  getGoldRate: async () => {
    const response = await api.get('/reports/gold-rate');
    return response.data;
  },

  /**
   * Fetches sales analytics data, optionally filtered by a date range.
   * @param {object} params - The query parameters.
   * @param {string} [params.start_date] - The start date for the filter (YYYY-MM-DD).
   * @param {string} [params.end_date] - The end date for the filter (YYYY-MM-DD).
   * @returns {Promise<object>} The sales analytics data.
   */
  getSalesAnalytics: async (params = {}) => {
    const response = await api.get('/reports/sales-analytics', { params });
    return response.data;
  },

  /**
   * Fetches inventory report data.
   * @returns {Promise<object>} The inventory report data.
   */
  getInventoryReports: async (params = {}) => {
    const response = await api.get('/reports/inventory', { params });
    return response.data;
  },

  /**
   * Fetches customer analytics data.
   * @returns {Promise<object>} The customer analytics data.
   */
  getCustomerAnalytics: async (params = {}) => {
    const response = await api.get('/reports/customer-analytics', { params });
    return response.data;
  },

  // --- Download Functions ---

  /**
   * Downloads a sales report as a CSV or PDF file.
   * @param {object} params - The query parameters for the report.
   * @param {string} format - The format of the report (csv or pdf).
   * @returns {Promise<void>}
   */
  downloadSalesReport: async (params = {}, format = 'csv') => {
    const response = await api.get(`/reports/download/sales?format=${format}`, { 
      params, 
      responseType: 'blob' 
    });
    const contentDisposition = response.headers['content-disposition'];
    let filename = `sales-report.${format}`;
    if (contentDisposition) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) { 
          filename = matches[1].replace(/['"]/g, '');
        }
    }
    downloadFile(response.data, filename);
  },

  /**
   * Downloads an inventory report as a CSV or PDF file.
   * @param {object} params - The query parameters for the report.
   * @param {string} format - The format of the report (csv or pdf).
   * @returns {Promise<void>}
   */
  downloadInventoryReport: async (params = {}, format = 'csv') => {
    const response = await api.get(`/reports/download/inventory?format=${format}`, { 
      params, 
      responseType: 'blob' 
    });
    const contentDisposition = response.headers['content-disposition'];
    let filename = `inventory-report.${format}`;
    if (contentDisposition) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) { 
          filename = matches[1].replace(/['"]/g, '');
        }
    }
    downloadFile(response.data, filename);
  },

  /**
   * Downloads a customer report as a CSV or PDF file.
   * @param {object} params - The query parameters for the report.
   * @param {string} format - The format of the report (csv or pdf).
   * @returns {Promise<void>}
   */
  downloadCustomerReport: async (params = {}, format = 'csv') => {
    const response = await api.get(`/reports/download/customers?format=${format}`, { 
      params, 
      responseType: 'blob' 
    });
    const contentDisposition = response.headers['content-disposition'];
    let filename = `customer-report.${format}`;
    if (contentDisposition) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) { 
          filename = matches[1].replace(/['"]/g, '');
        }
    }
    downloadFile(response.data, filename);
  },
};