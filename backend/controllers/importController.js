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
            customersToImport.push({
                name: row.Name,
                email: row.Email,
                phone: row.Phone,
                address: row.Address,
                date_of_birth: row['Date of Birth'],
                gender: row.Gender,
                loyalty_points: parseInt(row['Loyalty Points']) || 0,
                total_spent: parseFloat(row['Total Spent']) || 0.0
            });
        })
        .on('end', async () => {
            try {
                fs.unlinkSync(req.file.path);
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
            transactionsToImport.push({
                customer_id: row['Customer ID'],
                user_id: row['User ID'],
                transaction_type: row['Transaction Type'],
                total_amount: parseFloat(row['Total Amount']),
                discount_amount: parseFloat(row['Discount Amount']) || 0,
                tax_amount: parseFloat(row['Tax Amount']) || 0,
                payment_method: row['Payment Method'],
                status: row.Status,
                created_at: row['Created At'],
                updated_at: row['Updated At']
            });
        })
        .on('end', async () => {
            try {
                fs.unlinkSync(req.file.path);
                if (transactionsToImport.length === 0) {
                    return res.status(400).json({ success: false, message: 'No valid transaction data found in CSV.' });
                }
                const createdTransactions = await Transaction.bulkCreate(transactionsToImport, {
                    updateOnDuplicate: ['customer_id', 'user_id', 'transaction_type', 'total_amount', 'discount_amount', 'tax_amount', 'payment_method', 'status', 'created_at', 'updated_at']
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
