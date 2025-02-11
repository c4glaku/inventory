-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sku VARCHAR(50) UNIQUE,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2),
    supplier_id INTEGER REFERENCES suppliers(id),
    min_quantity INTEGER DEFAULT 0,
    max_quantity INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for frequently accessed columns
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);