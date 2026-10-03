const express = require('express');
const { db } = require('../config/database');
const { id, supplier } = require('../lib/validation');

const router = express.Router();
const SUPPLIER_COLUMNS = `id, name, contact_name, email, phone, address, created_at, updated_at`;

router.get('/', async (req, res, next) => {
    try {
        const suppliers = await db.any(`SELECT ${SUPPLIER_COLUMNS} FROM suppliers ORDER BY name, id`);
        res.json(suppliers);
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const supplierId = id(req.params.id, 'Supplier ID');
        const found = await db.oneOrNone(
            `SELECT ${SUPPLIER_COLUMNS} FROM suppliers WHERE id = $1`,
            [supplierId]
        );
        if (!found) return res.status(404).json({ error: 'Supplier not found.' });
        return res.json(found);
    } catch (error) {
        return next(error);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const data = supplier(req.body);
        const created = await db.one(
            `INSERT INTO suppliers (name, contact_name, email, phone, address)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING ${SUPPLIER_COLUMNS}`,
            [data.name, data.contact_name, data.email, data.phone, data.address]
        );
        return res.status(201).json(created);
    } catch (error) {
        return next(error);
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const supplierId = id(req.params.id, 'Supplier ID');
        const data = supplier(req.body);
        const updated = await db.oneOrNone(
            `UPDATE suppliers
             SET name = $1, contact_name = $2, email = $3,
                 phone = $4, address = $5, updated_at = CURRENT_TIMESTAMP
             WHERE id = $6
             RETURNING ${SUPPLIER_COLUMNS}`,
            [data.name, data.contact_name, data.email, data.phone, data.address, supplierId]
        );
        if (!updated) return res.status(404).json({ error: 'Supplier not found.' });
        return res.json(updated);
    } catch (error) {
        return next(error);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const supplierId = id(req.params.id, 'Supplier ID');
        const deleted = await db.tx(async transaction => {
            const existing = await transaction.oneOrNone(
                'SELECT id FROM suppliers WHERE id = $1 FOR UPDATE',
                [supplierId]
            );
            if (!existing) return { missing: true };

            const products = await transaction.one(
                'SELECT EXISTS (SELECT 1 FROM products WHERE supplier_id = $1) AS found',
                [supplierId]
            );
            if (products.found) return { hasProducts: true };

            await transaction.none('DELETE FROM suppliers WHERE id = $1', [supplierId]);
            return { deleted: true };
        });

        if (deleted.missing) return res.status(404).json({ error: 'Supplier not found.' });
        if (deleted.hasProducts) {
            return res.status(409).json({ error: 'Cannot delete a supplier with associated products.' });
        }
        return res.status(204).end();
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
