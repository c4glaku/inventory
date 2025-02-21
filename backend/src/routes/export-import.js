const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const multer = require('multer');
const csv = require('csv-parser');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const fs = require('fs');
const upload = multer({ dest: 'tmp/csv' });

// Export Routes
router.get('/export/json/:type', async (req, res) => {
    try {
        const { type } = req.params;
        let data;
        
        if (type === 'products') {
            data = await db.any('SELECT * FROM products');
        } else if (type === 'suppliers') {
            data = await db.any('SELECT * FROM suppliers');
        } else {
            return res.status(400).json({ error: 'Invalid export type' });
        }

        res.json(data);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Export failed' });
    }
});

router.get('/export/csv/:type', async (req, res) => {
    console.log('CSV Export route hit:', req.params); // Debugging
    try {
        const { type } = req.params;
        let data;
        let csvStringifier;
        
        if (type === 'products') {
            data = await db.any('SELECT * FROM products');
            csvStringifier = createCsvStringifier({
                header: [
                    { id: 'name', title: 'Name'},
                    { id: 'description', title: 'Description'},
                    { id: 'sku', title: 'SKU'},
                    { id: 'quantity', title: 'Quantity'},
                    { id: 'unit_price', title: 'Unit Price'},
                    { id: 'supplier_id', title: 'Supplier ID'},
                    { id: 'min_quantity', title: 'Minimum Quantity'},
                    { id: 'max_quantity', title: 'Maximum Quantity'}
                ]
            });
        } else if (type === 'suppliers') {
            data = await db.any('SELECT * FROM suppliers');
            csvStringifier = createCsvStringifier({
                header: [
                    { id: 'name', title: 'Name'},
                    { id: 'contact_name', title: 'Contact Name'},
                    { id: 'email', title: 'Email'},
                    { id: 'phone', title: 'Phone'},
                    { id: 'address', title: 'Address'}
                ]
            });
        } else {
            return res.status(400).json({ error: 'Invalid export type' });
        }

        const csvHeader = csvStringifier.getHeaderString();
        const csvRows = csvStringifier.stringifyRecords(data);
        const csvContent = csvHeader + csvRows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${type}.csv`);
        res.send(csvContent);
    } catch (error) {
        console.error('CSV Export error:', error);
        res.status(500).json({ error: 'CSV Export failed' });
    }
});

// Import Routes
router.post('/import/json/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { data } = req.body;

        if (!Array.isArray(data)) {
            return res.status(400).json({ error: 'Invalid data format. Expected array.' });
        }

        const client = await db.connect();

        try {
            await client.tx(async t => {
                if (type === 'products') {
                    for (const item of data) {
                        await t.none(
                            `INSERT INTO products
                            (name, description, sku, quantity, unit_price, supplier_id, min_quantity, max_quantity)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                            [item.name, item.description, item.sku, 
                            parseInt(item.quantity), parseFloat(item.unit_price), 
                            parseInt(item.supplier_id), parseInt(item.min_quantity), 
                            parseInt(item.max_quantity)]
                        );
                    }
                } else if (type === 'suppliers') {
                    for (const item of data) {
                        await t.none(
                            `INSERT INTO suppliers
                            (name, contact_name, email, phone, address)
                            VALUES ($1, $2, $3, $4, $5)`,
                            [item.name, item.contact_name, item.email, item.phone, item.address]
                        );
                    }
                } else {
                    return res.status(400).json({ error: 'Invalid import type' });
                }
            });

            res.json({ message: 'JSON Import successful' });
        } finally {
            client.done();
        }
    } catch (error) {
        console.error('JSON Import error:', error);
        res.status(500).json({ error: 'JSON Import failed' });
    }
});

router.post('/import/csv/:type', upload.single('file'), async (req, res) => {
    console.log('CSV import route hit!');

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { type } = req.params;
    const results = [];

    try {
        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csv({ utf8BOM: true }))
                .on('data', (data) => results.push(data))
                .on('end', () => resolve())
                .on('error', (error) => reject(error));
        });

        console.log('Parsed CSV Data:', results); 

        const client = await db.connect();

        try {
            await client.tx(async t => {
                if (type === 'products') {
                    for (const item of results) {
                        console.log('Processing item:', item);

                        const name = item.Name || item.name;
                        const description = item.Description || item.description;
                        const sku = item.SKU || item.sku;
                        const quantity = parseInt(item.Quantity || item.quantity);
                        const unitPrice = parseFloat(item['Unit Price'] || item['unit_price'] || item.unitPrice || item['Unit price']);
                        const supplierId = parseInt(item['Supplier ID'] || item['supplier_id'] || item.supplierId || item['Supplier id']);
                        const minQuantity = parseInt(item['Min Quantity'] || item['min_quantity'] || item.minQuantity || item['Min quantity']);
                        const maxQuantity = parseInt(item['Max Quantity'] || item['max_quantity'] ||item.maxQuantity || item['Max quantity']);
                        
                        console.log('name:', name);
                        console.log('description:', description);
                        console.log('sku:', sku);
                        console.log('quantity:', quantity);
                        console.log('unitPrice:', unitPrice);
                        console.log('supplierId:', supplierId);
                        console.log('minQuantity:', minQuantity);
                        console.log('maxQuantity:', maxQuantity);

                        await t.none(
                            `INSERT INTO products
                            (name, description, sku, quantity, unit_price, supplier_id, min_quantity, max_quantity)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                            [name, description, sku, quantity, unitPrice, supplierId, minQuantity, maxQuantity]
                        );
                    }
                } else if (type === 'suppliers') {
                    for (const item of results) {
                        console.log("suppliers item is ", item);
                        await t.none(
                            `INSERT INTO suppliers
                            (name, contact_name, email, phone, address)
                            VALUES ($1, $2, $3, $4, $5)`,
                            [
                                item.name || item.Name,
                                item.contact_name || item['Contact Name'],
                                item.email || item.Email,
                                item.phone || item.Phone,
                                item.address || item.Address
                            ]
                        );
                    }
                }
            });

            res.json({ message: 'CSV Import successful' });
        } finally {
            client.done();
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting temporary file:', err);
            });
        }
    } catch (error) {
        console.error('CSV Import error:', error); 
        console.error(error.stack);
        res.status(500).json({ error: 'CSV Import failed' });
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting temporary file:', err);
        });
    }
});

module.exports = router;