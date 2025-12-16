// src/controllers/productController.js
import * as inventory from '../services/inventoryService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// POST /product
export async function createProduct(req, res) {
    const { name, stock } = req.body;
    if (!name || typeof stock !== 'number' || stock < 0) {
        return res.status(400).json({ error: 'Invalid name or stock (stock must be a non-negative integer)' });
    }
    const product = await inventory.addProduct({ name, stock });
    res.status(201).json(product);
}

// GET /product/:id
export async function getProduct(req, res) {
    const { id } = req.params;
    const product = await inventory.getProduct(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
}

// GET /product
export async function listProducts(req, res) {
    const products = await inventory.listProducts();
    res.json(products);
}

// POST /product/seed
export async function seedProducts(req, res) {
    try {
        const dataPath = path.join(__dirname, '../data/products.json');
        const rawData = fs.readFileSync(dataPath, 'utf-8');
        const products = JSON.parse(rawData);

        const created = await Promise.all(products.map(p => inventory.addProduct(p)));
        res.status(201).json({ message: 'Seeded successfully', count: created.length, products: created });
    } catch (err) {
        console.error('Seed error:', err);
        res.status(500).json({ error: 'Failed to seed products' });
    }
}

// POST /product/reset
export async function resetProducts(req, res) {
    try {
        // Clear all data
        await inventory.clearAll();

        // Re-seed
        const dataPath = path.join(__dirname, '../data/products.json');
        const rawData = fs.readFileSync(dataPath, 'utf-8');
        const products = JSON.parse(rawData);

        const created = await Promise.all(products.map(p => inventory.addProduct(p)));
        res.status(200).json({ message: 'Reset successfully', count: created.length, products: created });
    } catch (err) {
        console.error('Reset error:', err);
        res.status(500).json({ error: 'Failed to reset products' });
    }
}

// GET /product/:id/orders
export async function getProductOrders(req, res) {
    const { id } = req.params;
    if (!await inventory.getProduct(id)) return res.status(404).json({ error: 'Product not found' });
    const orders = await inventory.listOrdersForProduct(id);
    res.json(orders);
}

// POST /product/:id/order
export async function placeOrder(req, res) {
    const { id } = req.params;
    const { userId, quantity } = req.body;
    try {
        const result = await inventory.placeOrder({ productId: id, userId, quantity });
        res.status(201).json({
            orderId: result.order.orderId,
            productId: id,
            userId: result.order.userId,
            quantity: result.order.quantity,
            remainingStock: result.remainingStock,
        });
    } catch (err) {
        const status = err.status || 500;
        res.status(status).json({ error: err.message });
    }
}

// POST /product/:id/cancel/:orderId
export async function cancelOrder(req, res) {
    const { id, orderId } = req.params;
    try {
        const result = await inventory.cancelOrder({ productId: id, orderId });
        res.json({
            productId: id,
            orderId: result.order.orderId,
            updatedStock: result.updatedStock,
        });
    } catch (err) {
        const status = err.status || 500;
        res.status(status).json({ error: err.message });
    }
}
