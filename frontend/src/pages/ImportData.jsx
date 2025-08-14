import React, { useState } from 'react';
import { importProductsCsv } from '../api/imports';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ImportData = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleImport = async () => {
        if (!selectedFile) {
            toast.error('Please select a file to import.');
            return;
        }

        setLoading(true);
        try {
            const response = await importProductsCsv(selectedFile);
            toast.success(response.data.message || 'Products imported successfully!');
            setSelectedFile(null); // Clear selected file after successful import
        } catch (error) {
            console.error('Error importing products:', error);
            toast.error(error.response?.data?.message || 'Failed to import products.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Import Data</h1>

            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-3">Import Products (CSV)</h2>
                <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileChange} 
                    className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                <button 
                    onClick={handleImport} 
                    disabled={loading || !selectedFile}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                >
                    {loading ? 'Importing...' : 'Import Products'}
                </button>
            </div>

            {/* TODO: Add sections for importing transactions and customers */}
        </div>
    );
};

export default ImportData;
