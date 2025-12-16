// src/model/productSchema.js
import { pool } from "../db/index.js";

export async function initProductSchema() {
  // Since we are changing schema in dev, we drop to ensuring new columns are added.
  // In prod we would use migrations.
  await pool.query('DROP TABLE IF EXISTS orders');
  await pool.query('DROP TABLE IF EXISTS products');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT,
      description TEXT,
      price NUMERIC(10, 2),
      original_price NUMERIC(10, 2),
      discount_percentage INTEGER,
      currency TEXT,
      stock INTEGER NOT NULL CHECK (stock >= 0),
      initial_stock INTEGER NOT NULL CHECK (initial_stock >= 0),
      image_url TEXT,
      specs JSONB,
      is_flash_sale BOOLEAN DEFAULT false,
      success_count INTEGER NOT NULL DEFAULT 0,
      fail_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id),
      user_id TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      status TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_orders_product
    ON orders(product_id);
  `);
}
