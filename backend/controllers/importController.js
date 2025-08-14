const csv = require('csv-parser');
const fs = require('fs');
const { Product } = require('../models');

exports.importProducts = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const productsToImport = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
            // Assuming CSV headers match model fields (case-insensitive for simplicity here)
            // You might need more robust mapping and validation
            productsToImport.push({
                name: row.Name,
                category: row.Category,
                stock_quantity: parseInt(row['Stock Quantity']),
                reorder_level: parseInt(row['Reorder Level']),
                cost_price: parseFloat(row['Cost Price']),
                selling_price: parseFloat(row['Selling Price']),
                // Add other fields as necessary
            });
        })
        .on('end', async () => {
            try {
                // Remove the uploaded file
                fs.unlinkSync(req.file.path);

                if (productsToImport.length === 0) {
                    return res.status(400).json({ success: false, message: 'No valid product data found in CSV.' });
                }

                const createdProducts = await Product.bulkCreate(productsToImport, {
                    updateOnDuplicate: ['name', 'category', 'stock_quantity', 'reorder_level', 'cost_price', 'selling_price'] // Example: update if product name exists
                });

                res.status(200).json({
                    success: true,
                    message: `${createdProducts.length} products imported successfully.`,
                    importedCount: createdProducts.length,
                });
            } catch (error) {
                console.error('Error importing products:', error);
                res.status(500).json({ success: false, message: 'Failed to import products.', error: error.message });
            }
        })
        .on('error', (error) => {
            console.error('Error reading CSV file:', error);
            fs.unlinkSync(req.file.path); // Ensure file is removed even on error
            res.status(500).json({ success: false, message: 'Error processing CSV file.', error: error.message });
        });
};
