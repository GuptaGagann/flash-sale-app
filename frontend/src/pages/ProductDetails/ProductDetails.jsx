import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getProductById, getProductOrders, updateProduct } from "../../api/api";
import "./ProductDetails.css";

export default function ProductDetails() {
    const [productId, setProductId] = useState("");
    const [product, setProduct] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const pid = searchParams.get("productId");
        if (pid) {
            setProductId(pid);
            // Automatically fetch if ID is present
            fetchDetails(pid);
        }
    }, [searchParams]);

    async function fetchDetails(idOverride) {
        const id = idOverride || productId;
        if (!id) return;

        setLoading(true);
        try {
            const p = await getProductById(id);
            const o = await getProductOrders(id);
            setProduct(p);
            setOrders(o);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handleUpdateStock = async () => {
        const newStock = prompt("Enter new stock value:", product.stock);
        if (newStock !== null) {
            const stockVal = parseInt(newStock, 10);
            if (isNaN(stockVal) || stockVal < 0) {
                alert("Invalid stock value");
                return;
            }
            try {
                await updateProduct(product.id, stockVal);
                fetchDetails(); // refresh
            } catch (e) {
                console.error(e);
                alert("Failed to update stock");
            }
        }
    };

    return (
        <div className="product-details-container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2>Product Analytics</h2>
                <button className="secondary" onClick={() => navigate('/')}>Back to List</button>
            </div>

            <div className="card" style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                        <label>Fetch by Product ID</label>
                        <input
                            placeholder="Enter Product ID"
                            value={productId}
                            onChange={e => setProductId(e.target.value)}
                            style={{ marginBottom: 0, height: "42px" }}
                        />
                    </div>
                    <button
                        onClick={() => fetchDetails()}
                        disabled={loading}
                        style={{ height: "42px", marginTop: "0" }}
                    >
                        {loading ? "Loading..." : "Fetch Data"}
                    </button>
                </div>
            </div>

            {product && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                    {/* Left Column: Image and Basic Info */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        <div className="card">
                            <img
                                src={product.image_url}
                                alt={product.name}
                                style={{ width: "100%", height: "auto", borderRadius: "8px", marginBottom: "16px", objectFit: "cover", maxHeight: "400px" }}
                            />
                            <h3 style={{ marginBottom: "8px" }}>{product.name}</h3>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <span style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--primary-color)" }}>
                                    {product.currency} {product.price}
                                </span>
                                {product.discount_percentage > 0 && (
                                    <span style={{ textDecoration: "line-through", color: "var(--text-secondary)" }}>
                                        {product.currency} {product.original_price}
                                    </span>
                                )}
                            </div>
                            {product.discount_percentage > 0 && (
                                <div style={{ color: "var(--success-color)", fontWeight: "bold", marginBottom: "8px" }}>
                                    {product.discount_percentage}% OFF
                                </div>
                            )}
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5" }}>
                                {product.description}
                            </p>
                            <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                <span className="badge" style={{ background: "#eee", color: "#333" }}>{product.brand}</span>
                                {product.is_flash_sale && (
                                    <span className="badge badge-error">Flash Sale!</span>
                                )}
                            </div>
                        </div>

                        <div className="card">
                            <h4 style={{ borderBottom: "1px solid #eee", paddingBottom: "10px" }}>Technical Specs</h4>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px", fontSize: "0.9rem" }}>
                                {product.specs && Object.entries(product.specs).map(([key, value]) => (
                                    <div key={key}>
                                        <div style={{ color: "var(--text-secondary)", textTransform: "capitalize" }}>{key}</div>
                                        <div style={{ fontWeight: "600" }}>{value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Key Metrics and Orders */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        <div className="card">
                            <h4 style={{ borderBottom: "1px solid #eee", paddingBottom: "10px" }}>Stock & ID</h4>
                            <div style={{ marginTop: "15px" }}>
                                <div style={{ marginBottom: "10px" }}>
                                    <label style={{ fontSize: "0.8rem" }}>Stock Level</label>
                                    <div style={{ fontWeight: "bold", fontSize: "1.5rem", color: product.stock > 0 ? "var(--success-color)" : "var(--error-color)" }}>
                                        {product.stock}
                                    </div>
                                    <button onClick={handleUpdateStock} style={{ marginTop: "5px", fontSize: "0.8rem", padding: "4px 8px" }}>
                                        Edit Stock
                                    </button>
                                </div>
                                <div>
                                    <label style={{ fontSize: "0.8rem" }}>Product ID</label>
                                    <div style={{ fontFamily: "monospace", background: "#f5f5f5", padding: "4px 8px", borderRadius: "4px", display: "inline-block" }}>
                                        {product.id}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ flex: 1 }}>
                            <h4 style={{ borderBottom: "1px solid #eee", paddingBottom: "10px", display: "flex", justifyContent: "space-between" }}>
                                Recent Orders
                                <span className="badge badge-success">{orders.length}</span>
                            </h4>

                            <div style={{ maxHeight: "500px", overflowY: "auto", marginTop: "15px" }}>
                                {orders.length === 0 ? (
                                    <p style={{ color: "#aaa", textAlign: "center", fontStyle: "italic" }}>No orders yet.</p>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        {orders.map((o, index) => {
                                            let statusColor = "#4caf50"; // PLACED
                                            if (o.status === 'CANCELED') statusColor = "#9e9e9e";
                                            if (o.status === 'FAILED') statusColor = "#f44336";

                                            return (
                                                <div key={index} style={{ padding: "10px", background: "#f9f9f9", borderRadius: "6px", fontSize: "0.9rem", borderLeft: `4px solid ${statusColor}` }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                        <div><strong>User:</strong> {o.userId}</div>
                                                        <span style={{
                                                            fontSize: "0.75rem",
                                                            fontWeight: "bold",
                                                            color: "white",
                                                            background: statusColor,
                                                            padding: "2px 6px",
                                                            borderRadius: "4px"
                                                        }}>
                                                            {o.status || 'PLACED'}
                                                        </span>
                                                    </div>
                                                    <div><strong>Qty:</strong> {o.quantity}</div>
                                                    <div style={{ fontSize: "0.8rem", color: "#777", marginTop: "4px" }}>
                                                        Order ID: {o.orderId || "N/A"} <br />
                                                        <span style={{ fontSize: '0.75em' }}>{new Date(o.createdAt).toLocaleTimeString()}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
