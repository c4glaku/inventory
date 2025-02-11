const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

// GET /api/products
router.get('/', async (req, res, next) => {
    try {
        const products = await db.any('SELECT * FROM products');
        res.json(products);
    } catch (error) {
        next(error);
    }
});


// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
    try {
        const product = await db.one('SELECT * FROM products WHERE id = $1', [req.params.id]);
        res.json(product);
    } catch (error) {
        if (error.code === 0) {
            res.status(404).json({ error: 'Product not found' });
        } else {
            next(error);
        }
    }
});

// POST /api/products
router.post('/', async (req, res, next) => {
    try {
        const { name, description, sku, quantity, unit_price, supplier_id, min_quantity, max_quantity } = req.body;

        if (!name || !sku) {
            return res.status(400).json({ error: 'Name and SKU are required' });
        }

        const newProduct = await db.one(
            `INSERT INTO products
            (name, description, sku, quantity, unit_price, supplier_id, min_quantity, max_quantity)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [name, description, sku, quantity, unit_price, supplier_id, min_quantity, max_quantity]
        );
        
        res.status(201).json(newProduct);
    } catch (error) {
        if (error.code === '23505') {
            res.status(400).json({ error: 'SKU already exists' });
        } else {
            next(error);
        }
    }
});

// PUT /api/products/:id
router.put('/:id', async (req, res, next) => {
    try {
        const { name, description, sku, quantity, unit_price, supplier_id, min_quantity, max_quantity } = req.body;

        const updatedProduct = await db.one(
            `UPDATE products
            SET name = $1, description = $2, sku = $3, quantity = $4,
                unit_price = $5, supplier_id = $6, min_quantity = $7,
                max_quantity = $8, updated_at = CURRENT_TIMESTAMP
            WHERE id = $9
            RETURNING *`,
            [name, description, sku, quantity, unit_price, supplier_id, min_quantity, max_quantity, req.params.id]
        );

        res.json(updatedProduct);
    } catch (error) {
        if (error.code === 0) {
            res.status(404).json({ error: 'Product not found' });
        } else {
            next(error);
        }
    }
});

// Delete /api/products/:id
router.delete('/:id', async (req, res, next) => {
    try {
        await db.none('DELETE FROM products WHERE id = $1', [req.params.id]);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

module.exports = router;