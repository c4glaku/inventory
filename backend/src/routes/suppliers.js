const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

// GET /api/suppliers
router.get('/', async (req, res, next) => {
    try {
        const suppliers = await db.any('SELECT * FROM suppliers');
        res.json(suppliers);
    } catch (error) {
        next(error);
    }
});

// GET /api/suppliers/:id
router.get('/:id', async (req, res, next) => {
    try {
        const supplier = await db.one('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
        res.json(supplier);
    } catch (error) {
        if (error.code === 0) {
            res.status(404).json({ error: 'Supplier not found' });
        } else {
            next(error);
        }
    }
});

// POST /api/suppliers
router.post('/', async (req, res, next) => {
    try {
        const { name, contact_name, email, phone, address, } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const newSupplier = await db.one(
            `INSERT INTO suppliers
            (name, contact_name, email, phone, address)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [name, contact_name, email, phone, address]
        );

        res.status(201).json(newSupplier);
    } catch (error) {
        next(error);
    }
});

// PUT /api/suppliers/:id
router.put('/:id', async (req, res, next) => {
    try {
        const { name, contact_name, email, phone, address } = req.body;

        const updatedSupplier = await db.one(
            `UPDATE suppliers
            SET name = $1, contact_name = $2, email = $3,
                phone = $4, address = $5, updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
            RETURNING *`,
            [name, contact_name, email, phone, address, req.params.id]
        );
        res.json(updatedSupplier);
    } catch (error) {
        if (error.code === 0) {
            res.status(404).json({ error: 'Supplier not found' });
        } else {
            next(error);
        }
    }
});

// DELETE /api/suppliers/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const products = await db.any('SELECT id FROM products WHERE supplier_id = $1', [req.params.id]);

        if (products.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete supplier with associated products'
            });
        }

        const result = await db.result('DELETE FROM suppliers WHERE id = $1', [req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Delete error:', error);
        next(error);
    }
});

module.exports = router;