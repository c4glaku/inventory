class InputError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InputError';
        this.status = 400;
    }
}

function text(value, label, { required = false, max = Infinity } = {}) {
    if (value === undefined || value === null || value === '') {
        if (required) throw new InputError(`${label} is required.`);
        return null;
    }
    if (typeof value !== 'string') throw new InputError(`${label} must be text.`);

    const normalized = value.trim();
    if (required && !normalized) throw new InputError(`${label} is required.`);
    if (normalized.length > max) throw new InputError(`${label} is too long.`);
    return normalized || null;
}

function numeric(value, label, { integer = false, minimum = 0, maximum = Infinity } = {}) {
    if (value === undefined || value === null || value === '') {
        throw new InputError(`${label} must be a valid number.`);
    }
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)
        || parsed < minimum
        || parsed > maximum
        || (integer && !Number.isInteger(parsed))) {
        throw new InputError(`${label} must be a valid ${integer ? 'whole ' : ''}number.`);
    }
    return parsed;
}

function id(value, label = 'ID') {
    if (typeof value !== 'string' && typeof value !== 'number') {
        throw new InputError(`${label} is invalid.`);
    }
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 1) {
        throw new InputError(`${label} is invalid.`);
    }
    return parsed;
}

function product(input = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new InputError('Product data must be an object.');
    }
    return {
        name: text(input.name, 'Name', { required: true, max: 100 }),
        description: text(input.description, 'Description'),
        sku: text(input.sku, 'SKU', { required: true, max: 50 }),
        quantity: numeric(input.quantity, 'Quantity', { integer: true, maximum: 2_147_483_647 }),
        unit_price: numeric(input.unit_price, 'Unit price', { maximum: 99_999_999.99 }),
        supplier_id: numeric(input.supplier_id, 'Supplier ID', { integer: true, minimum: 1, maximum: 2_147_483_647 }),
        min_quantity: numeric(input.min_quantity, 'Minimum quantity', { integer: true, maximum: 2_147_483_647 }),
        max_quantity: numeric(input.max_quantity, 'Maximum quantity', { integer: true, maximum: 2_147_483_647 }),
    };
}

function supplier(input = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new InputError('Supplier data must be an object.');
    }
    const email = text(input.email, 'Email', { max: 100 });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new InputError('Email address is invalid.');
    }
    return {
        name: text(input.name, 'Name', { required: true, max: 100 }),
        contact_name: text(input.contact_name, 'Contact name', { max: 100 }),
        email,
        phone: text(input.phone, 'Phone', { max: 20 }),
        address: text(input.address, 'Address'),
    };
}

module.exports = { InputError, id, product, supplier };
