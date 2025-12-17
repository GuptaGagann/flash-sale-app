// src/services/inventoryServicePg.js
import { randomUUID } from "crypto";
import { withTransaction, pool } from "../db/index.js";

const makeId = (p) => `${p}_${randomUUID()}`.slice(0, 15);

/* ---------------- PRODUCTS ---------------- */

export async function addProduct(productData) {
    const {
        id, name, stock,
        brand, description, price, original_price,
        discount_percentage, currency, image_url, specs, is_flash_sale
    } = productData;

    const finalId = id || makeId("p");

    // Check if exists to prevent duplicates on seed
    const existing = await getProduct(finalId);
    if (existing) {
        return existing;
    }

    await pool.query(
        `INSERT INTO products (
        id, name, stock, initial_stock, 
        brand, description, price, original_price, 
        discount_percentage, currency, image_url, specs, is_flash_sale,
        success_count, fail_count
     )
     VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0, 0)`,
        [
            finalId, name, stock,
            brand, description, price, original_price,
            discount_percentage, currency, image_url, JSON.stringify(specs || {}), is_flash_sale
        ]
    );

    return getProduct(finalId);
}

export async function updateProduct(id, { stock }) {
    // First get current values
    const current = await getProduct(id);
    if (!current) return null;

    const stockToAdd = stock - current.stock; // Calculate the difference
    const newInitialStock = current.initial_stock + stockToAdd;

    const { rowCount } = await pool.query(
        `UPDATE products SET stock = $1, initial_stock = $2, updated_at = now() WHERE id = $3`,
        [stock, newInitialStock, id]
    );
    if (rowCount === 0) return null;
    return getProduct(id);
}

export async function getProduct(id) {
    const { rows } = await pool.query(
        `SELECT 
        id, name, stock, initial_stock, 
        brand, description, price, original_price, 
        discount_percentage, currency, 
        image_url, specs, is_flash_sale,
        success_count AS "successCount", fail_count AS "failCount",
        created_at AS "createdAt", updated_at AS "updatedAt"
     FROM products WHERE id=$1`,
        [id]
    );
    return rows[0] || null;
}

export async function listProducts() {
    const { rows } = await pool.query(
        `SELECT 
        id, name, stock, initial_stock, 
        brand, description, price, original_price, 
        discount_percentage, currency, 
        image_url, specs, is_flash_sale,
        success_count AS "successCount", fail_count AS "failCount",
        created_at AS "createdAt", updated_at AS "updatedAt"
     FROM products ORDER BY created_at DESC`
    );
    return rows;
}

export async function listOrdersForProduct(productId) {
    const { rows } = await pool.query(
        `SELECT order_id AS "orderId",
            user_id AS "userId",
            quantity,
            status,
            created_at AS "createdAt"
     FROM orders
     WHERE product_id=$1
     ORDER BY created_at`,
        [productId]
    );
    return rows;
}

/* ---------------- ORDERS ---------------- */

export async function placeOrder({ productId, userId, quantity }) {
    // We use a transaction to ensure atomicity.
    // However, if stock is insufficient, we want to RECORD the failure (insert order 'FAILED', inc fail_count)
    // and COMMIT that change, but then THROW an error to the controller.
    // So we return a result object from inside the transaction, and check it outside.

    const result = await withTransaction(async (client) => {
        // 1. Try to deduct stock
        const update = await client.query(
            `UPDATE products
       SET stock = stock - $1,
           success_count = success_count + 1,
           updated_at = now()
       WHERE id=$2 AND stock >= $1
       RETURNING stock`,
            [quantity, productId]
        );

        const orderId = makeId("o");

        if (update.rowCount === 0) {
            // STOCK INSUFFICIENT
            await client.query(
                `UPDATE products
         SET fail_count = fail_count + 1,
             updated_at = now()
         WHERE id=$1`,
                [productId]
            );

            await client.query(
                `INSERT INTO orders (order_id, product_id, user_id, quantity, status)
         VALUES ($1, $2, $3, $4, 'FAILED')`,
                [orderId, productId, userId, quantity]
            );

            return { status: 'FAILED' };
        }

        // STOCK DEDUCTED
        await client.query(
            `INSERT INTO orders (order_id, product_id, user_id, quantity, status)
       VALUES ($1, $2, $3, $4, 'PLACED')`,
            [orderId, productId, userId, quantity]
        );

        return {
            status: 'PLACED',
            data: {
                order: { orderId, productId, userId, quantity },
                remainingStock: update.rows[0].stock,
            }
        };
    });

    if (result.status === 'FAILED') {
        throw Object.assign(new Error("Insufficient stock"), { status: 409 });
    }

    return result.data;
}

export async function cancelOrder({ productId, orderId }) {
    return withTransaction(async (client) => {
        const { rows } = await client.query(
            `SELECT quantity, status FROM orders
       WHERE order_id=$1 AND product_id=$2`,
            [orderId, productId]
        );

        if (!rows.length) {
            throw Object.assign(new Error("Order not found"), { status: 404 });
        }

        if (rows[0].status === "CANCELED") {
            throw Object.assign(new Error("Already canceled"), { status: 400 });
        }

        const qty = rows[0].quantity;

        await client.query(
            `UPDATE orders
       SET status='CANCELED', updated_at=now()
       WHERE order_id=$1`,
            [orderId]
        );

        const { rows: p } = await client.query(
            `UPDATE products
       SET stock = stock + $1,
           updated_at = now()
       WHERE id=$2
       RETURNING stock`,
            [qty, productId]
        );

        if (!p.length) {
            throw new Error("Product not found during stock restoration");
        }

        return { orderId, updatedStock: p[0].stock };
    });
}

/* ---------------- BULK RESET ---------------- */

export async function resetFromDump(productsDump) {
    return withTransaction(async (client) => {
        await client.query(`DELETE FROM orders`);
        await client.query(`DELETE FROM products`);

        if (productsDump.length > 0) {
            // Re-use addProduct logic ? No, better to do bulk insert or loop here
            // We can delegate to helper or just loop queries for simplicity
            for (const p of productsDump) {
                await client.query(
                    `INSERT INTO products (
                        id, name, stock, initial_stock, 
                        brand, description, price, original_price, 
                        discount_percentage, currency, image_url, specs, is_flash_sale,
                        success_count, fail_count
                     )
                     VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0, 0)`,
                    [
                        p.id || makeId('p'), p.name, p.stock,
                        p.brand, p.description, p.price, p.original_price,
                        p.discount_percentage, p.currency, p.image_url, JSON.stringify(p.specs || {}), p.is_flash_sale
                    ]
                );
            }
        }
    });
}

export async function clearAll() {
    return resetFromDump([]);
}
