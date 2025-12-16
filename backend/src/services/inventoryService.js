// src/services/inventoryService.js
import { randomUUID } from 'crypto';
import { createMutex } from './mutexFactory.js';

/**
 * Functional inventory service:
 * - module-level state (Maps)
 * - exported functions to manipulate products & orders
 * - per-product mutexes created on demand
 */

// in-memory stores
const products = new Map(); // productId -> { id, name, stock, createdAt, updatedAt }
const orders = new Map();   // orderId -> { orderId, productId, userId, quantity, status, createdAt, updatedAt }
const productMutexes = new Map(); // productId -> { lock }

// helpers
const makeId = (prefix = '') => `${prefix}${randomUUID()}`.slice(0, 15);
const now = () => new Date().toISOString();

function ensureMutex(productId) {
    if (!productMutexes.has(productId)) {
        productMutexes.set(productId, createMutex());
    }
    return productMutexes.get(productId);
}

// admin/test helper
export function clearAll() {
    products.clear();
    orders.clear();
    productMutexes.clear();
}

// product functions
export function addProduct({ id = null, name, stock, ...rest }) {
    // Create product only if it's not present
    if (id && products.has(id)) {
        // Return existing
        return products.get(id);
    }
    const finalId = id || makeId('p_');
    const createdAt = now();
    const product = { id: finalId, name, stock, initial_stock: stock, successCount: 0, failCount: 0, ...rest, createdAt, updatedAt: createdAt };
    products.set(finalId, product);
    return product;
}

export function getProduct(productId) {
    return products.get(productId) || null;
}

export function listProducts() {
    return Array.from(products.values());
}

// orders listing
export function listOrdersForProduct(productId) {
    const out = [];
    for (const o of orders.values()) {
        if (o.productId === productId) out.push(o);
    }
    out.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return out;
}

// place order (concurrency-safe)
export async function placeOrder({ productId, userId, quantity }) {
    if (!products.has(productId)) {
        const err = new Error('Product not found');
        err.status = 404;
        throw err;
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
        const err = new Error('Invalid quantity');
        err.status = 400;
        throw err;
    }

    const { lock } = ensureMutex(productId);
    const release = await lock();
    try {
        const product = products.get(productId);
        if (product.stock < quantity) {
            product.failCount = (product.failCount || 0) + 1;
            products.set(productId, product);

            // Record failed order
            const orderId = makeId('o_');
            const createdAt = now();
            const failedOrder = {
                orderId,
                productId,
                userId,
                quantity,
                status: 'FAILED',
                createdAt,
                updatedAt: createdAt,
            };
            orders.set(orderId, failedOrder);

            const err = new Error('Insufficient stock');
            err.status = 409;
            throw err;
        }
        product.stock -= quantity;
        product.successCount = (product.successCount || 0) + 1;
        product.updatedAt = now();
        products.set(productId, product);

        const orderId = makeId('o_');
        const createdAt = now();
        const order = {
            orderId,
            productId,
            userId,
            quantity,
            status: 'PLACED',
            createdAt,
            updatedAt: createdAt,
        };
        orders.set(orderId, order);

        return { order, remainingStock: product.stock };
    } finally {
        release();
    }
}

// cancel order (concurrency-safe)
export async function cancelOrder({ productId, orderId }) {
    if (!products.has(productId)) {
        const err = new Error('Product not found');
        err.status = 404;
        throw err;
    }
    if (!orders.has(orderId)) {
        const err = new Error('Order not found');
        err.status = 404;
        throw err;
    }

    const { lock } = ensureMutex(productId);
    const release = await lock();
    try {
        const order = orders.get(orderId);
        if (!order) {
            const err = new Error('Order not found');
            err.status = 404;
            throw err;
        }
        if (order.productId !== productId) {
            const err = new Error('Order does not belong to product');
            err.status = 400;
            throw err;
        }
        if (order.status === 'CANCELED') {
            const err = new Error('Order already canceled');
            err.status = 400;
            throw err;
        }

        // restore stock
        const product = products.get(productId);
        product.stock += order.quantity;
        product.updatedAt = now();
        products.set(productId, product);

        // update order
        order.status = 'CANCELED';
        order.updatedAt = now();
        orders.set(orderId, order);

        return { order, updatedStock: product.stock };
    } finally {
        release();
    }
}
