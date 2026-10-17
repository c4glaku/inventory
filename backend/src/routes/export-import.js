const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const { createObjectCsvStringifier } = require('csv-writer');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { db } = require('../config/database');
const { InputError, product, supplier } = require('../lib/validation');

const router = express.Router();
const DATA_TYPES = new Set(['products', 'suppliers']);
const MAX_IMPORT_ROWS = 5_000;
const CSV_TEMP_DIRECTORY = fs.mkdtempSync(path.join(os.tmpdir(), 'inventory-manager-'));
if (process.platform !== 'win32') fs.chmodSync(CSV_TEMP_DIRECTORY, 0o700);

const upload = multer({
    dest: CSV_TEMP_DIRECTORY,
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter(req, file, callback) {
        if (!file.originalname.toLowerCase().endsWith('.csv')) {
            return callback(new InputError('Upload a .csv file.'));
        }
        return callback(null, true);
    },
});

const CSV_HEADERS = {
    products: [
        { id: 'name', title: 'Name' },
        { id: 'description', title: 'Description' },
        { id: 'sku', title: 'SKU' },
        { id: 'quantity', title: 'Quantity' },
        { id: 'unit_price', title: 'Unit Price' },
        { id: 'supplier_id', title: 'Supplier ID' },
        { id: 'min_quantity', title: 'Minimum Quantity' },
        { id: 'max_quantity', title: 'Maximum Quantity' },
    ],
    suppliers: [
        { id: 'name', title: 'Name' },
        { id: 'contact_name', title: 'Contact Name' },
        { id: 'email', title: 'Email' },
        { id: 'phone', title: 'Phone' },
        { id: 'address', title: 'Address' },
    ],
};

const COLUMNS = {
    products: 'id, name, description, sku, quantity, unit_price, supplier_id, min_quantity, max_quantity, created_at, updated_at',
    suppliers: 'id, name, contact_name, email, phone, address, created_at, updated_at',
};

function validateType(req, res, next) {
    if (!DATA_TYPES.has(req.params.type)) {
        return res.status(400).json({ error: 'Type must be products or suppliers.' });
    }
    return next();
}

function csvSafeValue(value) {
    if (typeof value === 'string' && /^[\u0000-\u0020]*[=+\-@]/.test(value)) {
        return `'${value}`;
    }
    return value;
}

function csvField(row, ...names) {
    const fields = new Map(Object.entries(row).map(([key, value]) => [
        key.replace(/^\uFEFF/, '').trim().toLowerCase(),
        value,
    ]));
    for (const name of names) {
        const value = fields.get(name.toLowerCase());
        if (value !== undefined) return value;
    }
    return undefined;
}

function normalizeImport(type, row) {
    if (type === 'suppliers') {
        return supplier({
            name: csvField(row, 'name'),
            contact_name: csvField(row, 'contact name', 'contact_name'),
            email: csvField(row, 'email'),
            phone: csvField(row, 'phone'),
            address: csvField(row, 'address'),
        });
    }

    return product({
        name: csvField(row, 'name'),
        description: csvField(row, 'description'),
        sku: csvField(row, 'sku'),
        quantity: csvField(row, 'quantity'),
        unit_price: csvField(row, 'unit price', 'unit_price', 'unitprice'),
        supplier_id: csvField(row, 'supplier id', 'supplier_id', 'supplierid'),
        min_quantity: csvField(row, 'minimum quantity', 'min quantity', 'min_quantity', 'minquantity'),
        max_quantity: csvField(row, 'maximum quantity', 'max quantity', 'max_quantity', 'maxquantity'),
    });
}

async function insertRows(type, rows) {
    const records = rows.map(row => type === 'products' ? product(row) : supplier(row));
    await db.tx(async transaction => {
        for (const item of records) {
            if (type === 'products') {
                await transaction.none(
                    `INSERT INTO products
                        (name, description, sku, quantity, unit_price, supplier_id, min_quantity, max_quantity)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [item.name, item.description, item.sku, item.quantity, item.unit_price,
                        item.supplier_id, item.min_quantity, item.max_quantity]
                );
            } else {
                await transaction.none(
                    `INSERT INTO suppliers (name, contact_name, email, phone, address)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [item.name, item.contact_name, item.email, item.phone, item.address]
                );
            }
        }
    });
    return records.length;
}

router.get('/export/json/:type', validateType, async (req, res, next) => {
    try {
        const rows = await db.any(
            `SELECT ${COLUMNS[req.params.type]} FROM ${req.params.type} ORDER BY id`
        );
        return res.json(rows);
    } catch (error) {
        return next(error);
    }
});

router.get('/export/csv/:type', validateType, async (req, res, next) => {
    try {
        const { type } = req.params;
        const rows = await db.any(`SELECT ${COLUMNS[type]} FROM ${type} ORDER BY id`);
        const stringifier = createObjectCsvStringifier({ header: CSV_HEADERS[type] });
        const safeRows = rows.map(row => Object.fromEntries(
            Object.entries(row).map(([key, value]) => [key, csvSafeValue(value)])
        ));
        const content = stringifier.getHeaderString() + stringifier.stringifyRecords(safeRows);
        res.set('Content-Type', 'text/csv; charset=utf-8');
        res.attachment(`${type}.csv`);
        return res.send(content);
    } catch (error) {
        return next(error);
    }
});

router.post('/import/json/:type', validateType, async (req, res, next) => {
    try {
        const { data } = req.body || {};
        if (!Array.isArray(data) || data.length > MAX_IMPORT_ROWS) {
            throw new InputError(`Import must contain an array of no more than ${MAX_IMPORT_ROWS} rows.`);
        }
        const imported = await insertRows(req.params.type, data);
        return res.json({ message: 'Import successful.', imported });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Import contains a duplicate SKU.' });
        }
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Product import references a Supplier ID that does not exist. Import suppliers first and check the Supplier ID values.' });
        }
        return next(error);
    }
});

router.post('/import/csv/:type', validateType, upload.single('file'), async (req, res, next) => {
    if (!req.file) return res.status(400).json({ error: 'Choose a CSV file to import.' });

    try {
        const rows = [];
        await new Promise((resolve, reject) => {
            const parser = csv({ strict: true, maxRowBytes: 1024 * 1024 });
            const stream = fs.createReadStream(req.file.path);
            stream.on('error', reject);
            parser.on('data', row => {
                if (rows.length >= MAX_IMPORT_ROWS) {
                    parser.destroy(new InputError(`Import may contain at most ${MAX_IMPORT_ROWS} rows.`));
                    return;
                }
                rows.push(row);
            });
            parser.on('error', reject);
            parser.on('end', resolve);
            stream.pipe(parser);
        });

        if (rows.length === 0) throw new InputError('CSV file has no data rows.');

        const normalizedRows = rows.map(row => normalizeImport(req.params.type, row));
        const imported = await insertRows(req.params.type, normalizedRows);
        return res.json({ message: 'Import successful.', imported });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Import contains a duplicate SKU.' });
        }
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Product import references a Supplier ID that does not exist. Import suppliers first and check the Supplier ID values.' });
        }
        if (!error.status && !error.code) {
            return next(new InputError('CSV file could not be parsed. Check the headers and row format.'));
        }
        return next(error);
    } finally {
        await fs.promises.unlink(req.file.path).catch(() => {});
    }
});

module.exports = router;
