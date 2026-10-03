const express = require('express');
const { db } = require('../config/database');
const { InputError, id, product } = require('../lib/validation');

const router = express.Router();
const PRODUCT_COLUMNS = `
    id, name, description, sku, quantity, unit_price, supplier_id,
    min_quantity, max_quantity, created_at, updated_at`;

async function requireSupplier(supplierId) {
    const supplier = await db.oneOrNone('SELECT id FROM suppliers WHERE id = $1', [supplierId]);
    if (!supplier) throw new InputError('Supplier does not exist.');
}

router.get('/', async (req, res, next) => {
    try {
        const products = await db.any(`SELECT ${PRODUCT_COLUMNS} FROM products ORDER BY name, id`);
        res.json(products);
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const productId = id(req.params.id, 'Product ID');
        const found = await db.oneOrNone(
            `SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = $1`,
            [productId]
        );
        if (!found) return res.status(404).json({ error: 'Product not found.' });
        return res.json(found);
    } catch (error) {
        return next(error);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const data = product(req.body);
        await requireSupplier(data.supplier_id);
        const created = await db.one(
            `INSERT INTO products
                (name, description, sku, quantity, unit_price, supplier_id, min_quantity, max_quantity)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING ${PRODUCT_COLUMNS}`,
            [data.name, data.description, data.sku, data.quantity, data.unit_price,
                data.supplier_id, data.min_quantity, data.max_quantity]
        );
        return res.status(201).json(created);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'SKU already exists.' });
        }
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Supplier does not exist.' });
        }
        return next(error);
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const productId = id(req.params.id, 'Product ID');
        const data = product(req.body);
        await requireSupplier(data.supplier_id);
        const updated = await db.oneOrNone(
            `UPDATE products
             SET name = $1, description = $2, sku = $3, quantity = $4,
                 unit_price = $5, supplier_id = $6, min_quantity = $7,
                 max_quantity = $8, updated_at = CURRENT_TIMESTAMP
             WHERE id = $9
             RETURNING ${PRODUCT_COLUMNS}`,
            [data.name, data.description, data.sku, data.quantity, data.unit_price,
                data.supplier_id, data.min_quantity, data.max_quantity, productId]
        );
        if (!updated) return res.status(404).json({ error: 'Product not found.' });
        return res.json(updated);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'SKU already exists.' });
        }
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Supplier does not exist.' });
        }
        return next(error);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const productId = id(req.params.id, 'Product ID');
        const result = await db.result('DELETE FROM products WHERE id = $1', [productId]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Product not found.' });
        return res.status(204).end();
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
