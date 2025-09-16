const { Customer, Transaction, Product, Category } = require('../models');
const csv = require('csv-parser');
const fs = require('fs');
const exceljs = require('exceljs');
const path = require('path');

exports.importCustomers = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const customersToImport = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
            // Handle both capitalized and lowercase headers for flexibility
            console.log('CSV Row:', row); // Debug log
            const customerData = {
                name: row.name || row.Name,
                email: row.email || row.Email,
                phone: row.phone || row.Phone,
                address: row.address || row.Address,
                date_of_birth: row.date_of_birth || row['Date of Birth'] || row.dob,
                gender: row.gender || row.Gender,
                loyalty_points: parseInt(row.loyalty_points || row['Loyalty Points']) || 0,
                total_spent: parseFloat(row.total_spent || row['Total Spent']) || 0.0
            };
            
            console.log('Processed Customer Data:', customerData); // Debug log
            
            // Only add if name is provided (required field)
            if (customerData.name && customerData.name.trim()) {
                customersToImport.push(customerData);
            } else {
                console.warn('Skipping row with missing name:', row);
            }
        })
        .on('end', async () => {
            try {
                fs.unlinkSync(req.file.path);
                console.log('Final customers to import:', customersToImport); // Debug log
                if (customersToImport.length === 0) {
                    return res.status(400).json({ success: false, message: 'No valid customer data found in CSV.' });
                }
                const createdCustomers = await Customer.bulkCreate(customersToImport, {
                    updateOnDuplicate: ['name', 'email', 'phone', 'address', 'date_of_birth', 'gender', 'loyalty_points', 'total_spent']
                });
                res.status(200).json({
                    success: true,
                    message: `${createdCustomers.length} customers imported successfully.`,
                    importedCount: createdCustomers.length,
                });
            } catch (error) {
                console.error('Error importing customers:', error);
                res.status(500).json({ success: false, message: 'Failed to import customers.', error: error.message });
            }
        })
        .on('error', (error) => {
            console.error('Error reading CSV file:', error);
            fs.unlinkSync(req.file.path);
            res.status(500).json({ success: false, message: 'Error processing CSV file.', error: error.message });
        });
};

exports.importTransactions = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const transactionsToImport = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
            // Handle both capitalized and lowercase headers for flexibility
            const transactionData = {
                customer_id: parseInt(row.customer_id || row['Customer ID']) || null,
                user_id: parseInt(row.user_id || row['User ID']) || 1, // Default to user 1
                transaction_type: row.transaction_type || row['Transaction Type'] || 'sale',
                total_amount: parseFloat(row.total_amount || row['Total Amount']) || 0,
                discount_amount: parseFloat(row.discount_amount || row['Discount Amount']) || 0,
                tax_amount: parseFloat(row.tax_amount || row['Tax Amount']) || 0,
                final_amount: parseFloat(row.final_amount || row['Final Amount']) || parseFloat(row.total_amount || row['Total Amount']) || 0,
                payment_method: row.payment_method || row['Payment Method'] || 'cash',
                payment_status: row.payment_status || row['Payment Status'] || 'completed',
                transaction_status: row.transaction_status || row['Transaction Status'] || row.Status || 'completed',
                notes: row.notes || row.Notes || '',
                created_at: row.created_at || row['Created At'] || new Date(),
                updated_at: row.updated_at || row['Updated At'] || new Date()
            };
            
            // Only add if required fields are provided
            if (transactionData.customer_id && transactionData.total_amount > 0) {
                transactionsToImport.push(transactionData);
            } else {
                console.warn('Skipping row with missing required data:', row);
            }
        })
        .on('end', async () => {
            try {
                fs.unlinkSync(req.file.path);
                if (transactionsToImport.length === 0) {
                    return res.status(400).json({ success: false, message: 'No valid transaction data found in CSV.' });
                }
                const createdTransactions = await Transaction.bulkCreate(transactionsToImport, {
                    updateOnDuplicate: ['customer_id', 'user_id', 'transaction_type', 'total_amount', 'discount_amount', 'tax_amount', 'final_amount', 'payment_method', 'payment_status', 'transaction_status', 'notes']
                });
                res.status(200).json({
                    success: true,
                    message: `${createdTransactions.length} transactions imported successfully.`,
                    importedCount: createdTransactions.length,
                });
            } catch (error) {
                console.error('Error importing transactions:', error);
                res.status(500).json({ success: false, message: 'Failed to import transactions.', error: error.message });
            }
        })
        .on('error', (error) => {
            console.error('Error reading CSV file:', error);
            fs.unlinkSync(req.file.path);
            res.status(500).json({ success: false, message: 'Error processing CSV file.', error: error.message });
        });
};

exports.importProducts = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const productsToImport = [];
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    const processProducts = async () => {
        try {
            if (productsToImport.length === 0) {
                return res.status(400).json({ success: false, message: 'No valid product data found in the file.' });
            }

            for (const productData of productsToImport) {
                if (productData.category) {
                    const [category] = await Category.findOrCreate({
                        where: { name: productData.category },
                        defaults: { name: productData.category }
                    });
                    productData.category_id = category.id;
                }
                if (productData.sku) {
                    await Product.upsert(productData);
                }
            }

            res.status(200).json({
                success: true,
                message: `${productsToImport.length} products processed successfully.`,
                importedCount: productsToImport.length,
            });
        } catch (error) {
            console.error('Error importing products:', error);
            res.status(500).json({ success: false, message: 'Failed to import products.', error: error.message });
        } finally {
            fs.unlinkSync(filePath);
        }
    };

    const parseRow = (row) => {
        const stock_quantity = parseInt(row['Stock Quantity']);
        const reorder_level = parseInt(row['Reorder Level']);
        const cost_price = parseFloat(row['Cost Price (₹)']);
        const selling_price = parseFloat(row['Selling Price (₹)']);
        const weight = parseFloat(row['Weight (g)']);

        return {
            name: row.Name,
            sku: row.SKU,
            barcode: row.Barcode,
            category: row.Category,
            subcategory: row.Subcategory,
            metal_type: row['Metal Type'],
            purity: row.Purity,
            weight: isNaN(weight) ? 0 : weight,
            stone_type: row['Stone Type'],
            stone_weight: row['Stone Weight (ct)'],
            cost_price: isNaN(cost_price) ? 0 : cost_price,
            selling_price: isNaN(selling_price) ? 0 : selling_price,
            discount_percentage: row['Discount %'],
            stock_quantity: isNaN(stock_quantity) ? 0 : stock_quantity,
            reorder_level: isNaN(reorder_level) ? 0 : reorder_level,
            supplier: row.Supplier,
            tags: row.Tags,
            is_active: row.Status === 'Active',
            description: row.Description,
        };
    }

    if (fileExt === '.csv') {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                productsToImport.push(parseRow(row));
            })
            .on('end', processProducts)
            .on('error', (error) => {
                console.error('Error reading CSV file:', error);
                fs.unlinkSync(filePath);
                res.status(500).json({ success: false, message: 'Error processing CSV file.', error: error.message });
            });
    } else if (fileExt === '.xlsx') {
        try {
            const workbook = new exceljs.Workbook();
            await workbook.xlsx.readFile(filePath);
            const worksheet = workbook.getWorksheet(1);
            if (!worksheet) {
                throw new Error("No worksheet found in the Excel file.");
            }
            const headers = worksheet.getRow(1).values.map(h => h.toString());

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1) {
                    let productData = {};
                    row.values.forEach((value, index) => {
                        if (headers[index]) {
                            productData[headers[index]] = value;
                        }
                    });
                    productsToImport.push(parseRow(productData));
                }
            });
            await processProducts();
        } catch (error) {
            console.error('Error processing XLSX file:', error);
            fs.unlinkSync(filePath);
            res.status(500).json({ success: false, message: 'Error processing XLSX file.', error: error.message });
        }
    } else {
        fs.unlinkSync(filePath);
        return res.status(400).json({ success: false, message: 'Unsupported file type. Please upload a .csv or .xlsx file.' });
    }
};

exports.importInventoryUpdates = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    
    const inventoryUpdates = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
            // Handle both capitalized and lowercase headers for flexibility
            const updateData = {
                sku: row.sku || row.SKU,
                stock_quantity: parseInt(row.stock_quantity || row['Stock Quantity']) || 0,
                cost_price: parseFloat(row.cost_price || row['Cost Price']) || null,
                selling_price: parseFloat(row.selling_price || row['Selling Price']) || null,
                reorder_level: parseInt(row.reorder_level || row['Reorder Level']) || null
            };
            
            // Only add if SKU is provided (required field)
            if (updateData.sku && updateData.sku.trim()) {
                inventoryUpdates.push(updateData);
            } else {
                console.warn('Skipping row with missing SKU:', row);
            }
        })
        .on('end', async () => {
            try {
                fs.unlinkSync(req.file.path);
                
                if (inventoryUpdates.length === 0) {
                    return res.status(400).json({ success: false, message: 'No valid inventory data found in CSV.' });
                }
                
                let updatedCount = 0;
                let notFoundCount = 0;
                
                for (const update of inventoryUpdates) {
                    const product = await Product.findOne({ where: { sku: update.sku } });
                    
                    if (product) {
                        const updateFields = {};
                        if (update.stock_quantity !== undefined) updateFields.stock_quantity = update.stock_quantity;
                        if (update.cost_price !== null) updateFields.cost_price = update.cost_price;
                        if (update.selling_price !== null) updateFields.selling_price = update.selling_price;
                        if (update.reorder_level !== null) updateFields.reorder_level = update.reorder_level;
                        
                        await product.update(updateFields);
                        updatedCount++;
                    } else {
                        console.warn(`Product with SKU ${update.sku} not found`);
                        notFoundCount++;
                    }
                }
                
                res.status(200).json({
                    success: true,
                    message: `${updatedCount} products updated successfully. ${notFoundCount} products not found.`,
                    updatedCount,
                    notFoundCount
                });
            } catch (error) {
                console.error('Error updating inventory:', error);
                res.status(500).json({ success: false, message: 'Failed to update inventory.', error: error.message });
            }
        })
        .on('error', (error) => {
            console.error('Error reading CSV file:', error);
            fs.unlinkSync(req.file.path);
            res.status(500).json({ success: false, message: 'Error processing CSV file.', error: error.message });
        });
};
