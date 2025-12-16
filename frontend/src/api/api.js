export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
const BASE_URL = import.meta.env.INTERNAL_LOAD_TEST === "true" ? `http://127.0.0.1:${import.meta.env.VITE_BACKEND_URL || 10000}` : API_BASE_URL;

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

export async function seedProducts() {
    const res = await fetch(`${BASE_URL}/product/seed`, {
        method: "POST"
    });
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
