// src/db/index.js
import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

export const pool = new Pool({
    host: config.db.host,
    port: 5432,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
    max: 10,
    idleTimeoutMillis: 30000,
});

export async function withTransaction(fn) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

export async function initDb() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS products (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                stock INTEGER NOT NULL,
                initial_stock INTEGER NOT NULL,
                success_count INTEGER DEFAULT 0,
                fail_count INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS orders (
                order_id VARCHAR(50) PRIMARY KEY,
                product_id VARCHAR(50) REFERENCES products(id),
                user_id VARCHAR(50) NOT NULL,
                quantity INTEGER NOT NULL,
                status VARCHAR(20) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Error initializing database:', err);
        throw err;
    } finally {
        client.release();
    }
}

