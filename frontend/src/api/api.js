const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export async function createProduct(name, stock) {
    const res = await fetch(`${BASE_URL}/product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, stock })
    });
    return res.json();
}

export async function getProductById(id) {
    const res = await fetch(`${BASE_URL}/product/${id}`);
    return res.json();
}

export async function getProducts() {
    const res = await fetch(`${BASE_URL}/product`);
    return res.json();
}

export async function placeOrder(productId, userId, quantity) {
    const res = await fetch(`${BASE_URL}/product/${productId}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, quantity })
    });
    return res.json();
}

export async function cancelOrder(productId, orderId) {
    const res = await fetch(`${BASE_URL}/product/${productId}/cancel/${orderId}`, {
        method: "POST"
    });
    return res.json();
}


export async function getProductOrders(productId) {
    const res = await fetch(`${BASE_URL}/product/${productId}/orders`);
    return res.json();
}

export async function getAllProducts() {
    const res = await fetch(`${BASE_URL}/product`);
    return res.json();
}

export async function seedProducts(productsData = null) {
    const options = {
        method: "POST"
    };
    if (productsData) {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify(productsData);
    }
    const res = await fetch(`${BASE_URL}/product/seed`, options);
    return res.json();
}

export async function runLoadTest(concurrency = 50, stock = 20, orderQty = 1, productId = null) {
    const res = await fetch(`${BASE_URL}/load-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concurrency, stock, orderQty, productId })
    });
    return res.json();
}

export async function resetProducts() {
    const res = await fetch(`${BASE_URL}/product/reset`, {
        method: "POST"
    });
    return res.json();
}

/**
 * Runs a frontend-driven flash sale simulation with mixed traffic (Orders + Cancels).
 * @param {string} productId - Target product ID
 * @param {number} buyers - Number of concurrent buyers to simulate
 * @param {number} quantity - Quantity per order
 * @param {Function} [onProgress] - Optional callback to run after each batch
 * @returns {Promise<Object>} Summary of results { success, conflict, error, cancelled }
 */
export async function simulateFlashSale(productId, buyers = 50, quantity = 1, onProgress) {
    const tasks = Array.from({ length: buyers }, (_, i) => async () => {
        try {
            const res = await fetch(`${BASE_URL}/product/${productId}/order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: `user_sim_${Date.now()}_${i}`,
                    quantity,
                }),
            });

            const status = res.status;
            let resultStatus = status;
            let cancelled = false;

            if (status === 200 || status === 201) {
                const data = await res.json();
                // 20% chance to cancel the order immediately to simulate mixed traffic
                if (data.orderId && Math.random() < 0.2) {
                    try {
                        const cancelRes = await fetch(`${BASE_URL}/product/${productId}/order/${data.orderId}`, {
                            method: "DELETE" // Assuming standard REST, but user said "cancel reques... call... endpoints". 
                            // Looking at api.js exports: `cancelOrder` uses POST /product/:id/cancel/:orderId
                        });
                        // Wait, let's double check api.js export for cancelOrder
                        // export async function cancelOrder(productId, orderId) {
                        //     const res = await fetch(`${BASE_URL}/product/${productId}/cancel/${orderId}`, {
                        //         method: "POST"
                        //     });
                        //     return res.json();
                        // }
                        // Correcting to use the pattern from api.js export
                    } catch (ignore) { }
                }
            }

            // Re-doing the block to be cleaner and match existing API pattern
            return { status: "fulfilled", value: { status: res.status, requestBytes: 0 } }; // dummy value to match structure
        } catch (e) {
            return { status: "rejected", reason: e };
        }
    });

    // Redefining the tasks correctly with the logic 
    const advancedTasks = Array.from({ length: buyers }, (_, i) => async () => {
        try {
            const userId = `user_sim_${Date.now()}_${i}`;
            const res = await fetch(`${BASE_URL}/product/${productId}/order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, quantity }),
            });

            const status = res.status;
            let wasCancelled = false;

            if (status === 201 || status === 200) {
                const data = await res.json();
                // 25% prob to cancel
                if (data.orderId && Math.random() < 0.25) {
                    await fetch(`${BASE_URL}/product/${productId}/cancel/${data.orderId}`, {
                        method: "POST"
                    });
                    wasCancelled = true;
                }
            }

            return { status: "fulfilled", value: { status, wasCancelled } };
        } catch (e) {
            return { status: "rejected", reason: e };
        }
    });


    // Run in batches to respect browser connection limits
    const results = await runInBatches(advancedTasks, 10, onProgress); // Batch size 10

    const summary = {
        success: 0,
        conflict: 0,
        error: 0,
        cancelled: 0
    };

    results.forEach((r) => {
        if (r.status === "fulfilled") {
            const s = r.value.status;
            if (s === 200 || s === 201) {
                summary.success++;
                if (r.value.wasCancelled) summary.cancelled++;
            }
            else if (s === 409) summary.conflict++;
            else summary.error++;
        } else {
            summary.error++;
        }
    });

    return summary;
}

/**
 * Helper to run promises in batches.
 * @param {Array<Function>} taskFactories - Array of functions that return promises
 * @param {number} batchSize 
 * @param {Function} [onProgress]
 */
async function runInBatches(taskFactories, batchSize = 5, onProgress) {
    const results = [];
    for (let i = 0; i < taskFactories.length; i += batchSize) {
        const batch = taskFactories.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(t => t()));
        results.push(...batchResults);
        if (onProgress) onProgress();
    }
    return results;
}
