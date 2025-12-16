
const BACKEND = process.env.BACKEND || 'http://localhost:4000';

async function createProduct(name, stock) {
    const res = await fetch(`${BACKEND}/product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, stock })
    });
    return res.json();
}

async function placeOrder(productId, userId, quantity) {
    const start = Date.now();
    const res = await fetch(`${BACKEND}/product/${productId}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, quantity })
    });
    const body = await res.json();
    const time = Date.now() - start;
    return { status: res.status, body, time, type: 'order' };
}

async function cancelOrder(productId, orderId) {
    const start = Date.now();
    const res = await fetch(`${BACKEND}/product/${productId}/cancel/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    const body = await res.json();
    const time = Date.now() - start;
    return { status: res.status, body, time, type: 'cancel' };
}

async function fetchProduct(id) {
    const res = await fetch(`${BACKEND}/product/${id}`);
    if (res.status === 404) return null;
    return res.json();
}

export async function runLoadTest(concurrency = 100, stock = 20, orderQty = 1, productId = null) {
    console.log(`Starting load test: concurrency=${concurrency} stock=${stock} orderQty=${orderQty} productId=${productId || 'NEW'}`);

    const timestamp = Date.now();
    let p;

    if (productId) {
        // Use existing product - fetch details to get createdAt
        p = await fetchProduct(productId);
        if (!p) {
            console.error(`Product ${productId} not found.`);
            return;
        }
        console.log('Using existing Product id:', p.id);
    } else {
        // 1. Create a fresh product for this test
        p = await createProduct(`LoadTestPhone_${timestamp}`, stock);
        console.log('Created Product id:', p.id);
    }

    const initialCreatedAt = p.createdAt;

    // 2. Fire concurrent orders in batches
    const BATCH_SIZE = 5;
    const batches = Math.ceil(concurrency / BATCH_SIZE);
    const results = [];

    console.log(`Processing in ${batches} batches...`);

    for (let b = 0; b < batches; b++) {
        // Check if product validates (same ID, same creation time)
        const currentProd = await fetchProduct(p.id);
        if (!currentProd || currentProd.createdAt !== initialCreatedAt) {
            console.log('Product not found or reset (createdAt check failed). Aborting load test.');
            break;
        }

        const batchPromises = [];
        const remaining = concurrency - (b * BATCH_SIZE);
        const currentBatchSize = Math.min(remaining, BATCH_SIZE);

        for (let i = 0; i < currentBatchSize; i++) {
            const globalIndex = b * BATCH_SIZE + i;
            batchPromises.push(placeOrder(p.id, `u_${timestamp}_${globalIndex}`, orderQty));
        }

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        if (batchResults.some(r => r.status === 404)) {
            console.log('Product not found (possibly reset). Aborting load test.');
            break;
        }

        // Random Cancellation Phase:
        // After each batch, pick some *successful* orders from THIS batch and cancel them.
        // Chance: 20% of successful orders in this batch get cancelled immediately.
        const successes = batchResults.filter(r => r.status === 201 && r.body.orderId);

        if (successes.length > 0) {
            const cancellations = [];
            for (const order of successes) {
                if (Math.random() < 0.2) { // 20% cancellation chance
                    cancellations.push(cancelOrder(p.id, order.body.orderId));
                }
            }
            if (cancellations.length > 0) {
                const cancelResults = await Promise.all(cancellations);
                results.push(...cancelResults);
                console.log(`  -> Cancelled ${cancelResults.length} orders in this batch.`);

                // Add delay after cancellations to observe stock restoration
                await new Promise(r => setTimeout(r, 2000));
            }
        }

        if (b < batches - 1) {
            const delay = Math.floor(Math.random() * 2000) + 1500; // 1.5s - 3.5s delay
            await new Promise(r => setTimeout(r, delay));
        }
    }

    // 3. Compile stats
    const stats = {
        totalOperations: results.length,
        orders: {
            total: results.filter(r => r.type === 'order').length,
            success: results.filter(r => r.type === 'order' && r.status === 201).length,
            conflict: results.filter(r => r.type === 'order' && r.status === 409).length,
            avgTimeMs: (results.filter(r => r.type === 'order').map(r => r.time).reduce((a, b) => a + b, 0) / (results.filter(r => r.type === 'order').length || 1)).toFixed(2)
        },
        cancellations: {
            total: results.filter(r => r.type === 'cancel').length,
            success: results.filter(r => r.type === 'cancel' && (r.status === 200 || r.status === 204)).length,
            avgTimeMs: (results.filter(r => r.type === 'cancel').map(r => r.time).reduce((a, b) => a + b, 0) / (results.filter(r => r.type === 'cancel').length || 1)).toFixed(2)
        },
        other: results.filter(r => (r.type === 'order' && r.status !== 201 && r.status !== 409) || (r.type === 'cancel' && r.status !== 200 && r.status !== 204)).length,
        avgTimeMs: (results.reduce((s, r) => s + (r.time || 0), 0) / results.length).toFixed(2),
        maxTimeMs: Math.max(...results.map(r => r.time || 0)),
    };

    console.log('Results:', stats);

    // 4. Verify with backend state
    const ordersRes = await fetch(`${BACKEND}/product/${p.id}/orders`);
    const orders = await ordersRes.json();
    console.log('Final Orders count:', orders.length);

    const finalProd = await (await fetch(`${BACKEND}/product/${p.id}`)).json();
    console.log('Final stock:', finalProd.stock);

    return {
        product: p,
        stats,
        finalStock: finalProd.stock,
        ordersCount: orders.length
    };
}

// Allow standalone execution: node src/scripts/loadTest.js
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const CONCURRENCY = parseInt(process.env.CONCURRENCY || '100', 10);
    const STOCK = parseInt(process.env.STOCK || '20', 10);
    const ORDER_QTY = parseInt(process.env.ORDER_QTY || '1', 10);
    runLoadTest(CONCURRENCY, STOCK, ORDER_QTY).catch(console.error);
}
