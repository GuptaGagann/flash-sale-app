import "./ProductCard.css";

export default function ProductCard({ product, onOrder, onView }) {
    const isOutOfStock = product.stock === 0;

    return (
        <div className="card product-card">
            <div className="product-image-container">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="product-image"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.parentNode.classList.add('image-error');
                        }}
                    />
                ) : (
                    <div className="product-image-placeholder">No Image</div>
                )}
            </div>

            <div className="product-info">
                <h3>{product.name}</h3>
                <p>ID: {product.id}</p>
            </div>

            <div className="product-meta">
                <p>
                    <strong>Stock:</strong>{" "}
                    <span style={{ color: isOutOfStock ? "var(--error-color)" : "var(--success-color)" }}>
                        {product.stock}
                    </span>
                </p>

                {isOutOfStock && <span className="badge badge-error">Out of Stock</span>}
            </div>

            <div className="product-actions">

                <button
                    className="secondary"
                    onClick={() => onView(product.id)}
                >
                    Details
                </button>
            </div>
        </div>
    );
}
