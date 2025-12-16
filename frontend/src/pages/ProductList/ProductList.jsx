import { useEffect, useState } from "react";
import { getProducts } from "../../api/api";
import { useNavigate } from "react-router-dom";
import ProductCard from "../../components/ProductCard/ProductCard";
import "./ProductList.css";

import { seedProducts, resetProducts } from "../../api/api";

export default function ProductList() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resetting, setResetting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    }

    const handleSeed = async () => {
        try {
            await seedProducts();
            fetchProducts();
        } catch (e) {
            console.error(e);
            alert("Failed to seed products");
        }
    };

    const handleBulkUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target.result);
                if (!Array.isArray(json)) {
                    alert("Invalid format: Expected a JSON array of products.");
                    return;
                }
                const res = await seedProducts(json);
                if (res.error) {
                    alert(res.error);
                } else {
                    alert(`Successfully added ${res.count} products!`);
                    fetchProducts();
                }
            } catch (err) {
                console.error(err);
                alert("Failed to parse JSON or upload products.");
            }
            // Reset input
            event.target.value = '';
        };
        reader.readAsText(file);
    };

    const handleOrder = (id) => {
        // Since we removed ManageOrders, navigate to details or just show alert?
        // User didn't specify replacement for order flow here, but we are removing ManageOrders.
        // Let's assume ProductDetails handles ordering or meaningful redirection.
        navigate(`/product?productId=${id}`);
    };

    const handleView = (id) => {
        navigate(`/product?productId=${id}`);
    };

    if (loading) return <div className="container" style={{ textAlign: "center", padding: "40px" }}>Loading products...</div>;

    return (
        <div className="product-list-container">
            <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", gap: "16px" }}>
                <h2 className="product-list-title">Available Products</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{products.length} Items</span>
                    <button onClick={handleSeed} style={{ padding: '8px 16px', background: '#4caf50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                        + Seed Default
                    </button>

                    <input
                        type="file"
                        id="bulk-upload-input"
                        accept=".json"
                        style={{ display: "none" }}
                        onChange={handleBulkUpload}
                    />
                    <button
                        onClick={() => document.getElementById('bulk-upload-input').click()}
                        style={{ padding: '8px 16px', background: '#2196f3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >
                        Bulk Import JSON
                    </button>
                    {products.length > 0 && (
                        <button
                            disabled={resetting}
                            onClick={async () => {
                                if (confirm("Reset all stock?")) {
                                    setResetting(true);
                                    try {
                                        await resetProducts();
                                        await fetchProducts(); // fetch fresh data
                                    } catch (e) {
                                        console.error(e);
                                    } finally {
                                        setResetting(false);
                                    }
                                }
                            }}
                            style={{ padding: '8px 16px', background: resetting ? '#ccc' : '#d32f2f', color: 'white', border: 'none', borderRadius: 4, cursor: resetting ? 'not-allowed' : 'pointer', marginLeft: 10 }}
                        >
                            {resetting ? "Resetting..." : "Reset Stock"}
                        </button>
                    )}
                </div>
            </div>

            {products.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                    <p>No products found. Add some to get started!</p>
                </div>
            ) : (
                <div className="product-grid">
                    {products.map(p => (
                        <ProductCard
                            key={p.id}
                            product={p}
                            onOrder={handleOrder}
                            onView={handleView}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
