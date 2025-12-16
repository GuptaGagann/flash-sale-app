import "./InventoryTile.css";

export default function InventoryTile({ product, style, className }) {
    const { name, stock, initial_stock } = product;

    // detailed safety check
    const safeStock = stock ?? 0;
    const safeInitial = initial_stock ?? (stock > 0 ? stock : 100);

    const sold = safeInitial - safeStock;
    const soldPercent = Math.min((sold / safeInitial) * 100, 100);
    const remainingPercent = 100 - soldPercent;

    const getTheme = (p) => {
        if (p > 75) return { fill: "#a5d6a7", border: "#2e7d32" }; // Pastel Green / Dark Green
        if (p > 50) return { fill: "#c8e6c9", border: "#388e3c" }; // Lighter Green / Green
        if (p > 25) return { fill: "#fff9c4", border: "#fbc02d" }; // Pastel Yellow / Dark Yellow
        if (p > 10) return { fill: "#ffe0b2", border: "#f57c00" }; // Pastel Orange / Dark Orange
        return { fill: "#ffcdd2", border: "#c62828" }; // Pastel Red / Dark Red
    };

    const theme = getTheme(remainingPercent);

    return (
        <div
            className={`inventory-tile ${className || ''}`}
            style={{
                ...style,
                borderColor: theme.border,
                borderWidth: 2,
                borderStyle: 'solid'
            }}
        >
            {/* Fill represents remaining stock */}
            <div
                className="inventory-tile-fill"
                style={{
                    height: `${remainingPercent}%`,
                    background: theme.fill,
                    transition: "height 0.5s ease, background-color 0.5s ease"
                }}
            />

            {/* Content */}
            <div className="inventory-tile-content">
                <strong>{name}</strong>
                <div style={{ marginTop: 10 }}>
                    {Math.round(soldPercent)}% SOLD
                </div>
                <div style={{ fontSize: 12 }}>
                    {safeStock} / {safeInitial} left
                </div>
                <div className="inventory-tile-stats">
                    Success: <span style={{ color: 'green' }}>{product.successCount || 0}</span> |
                    Fail: <span style={{ color: 'red' }}>{product.failCount || 0}</span>
                </div>
            </div>
        </div>
    );
}
