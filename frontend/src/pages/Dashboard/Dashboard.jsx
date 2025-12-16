import { useEffect, useState, useRef } from "react";
import InventoryTile from "../../components/InventoryTile/InventoryTile";
import { getAllProducts, runLoadTest, resetProducts, simulateFlashSale } from "../../api/api";
import "./Dashboard.css";

export default function Dashboard() {
    const [products, setProducts] = useState([]);
    const [isSimulating, setIsSimulating] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerRef = useRef(null);
    const saleTimerRef = useRef(null);

    const fetchData = async () => {
        try {
            const data = await getAllProducts();
            if (Array.isArray(data)) {
                setProducts(data);
                checkStock(data);
            }
        } catch (err) {
            console.error("Polling error:", err);
        }
    };

    const checkStock = (currentProducts) => {
        if (currentProducts.length > 0) {
            // Stop polling if every product is sold out (stock == 0)
            const allSoldOut = currentProducts.every(p => p.stock === 0);
            if (allSoldOut && !isSimulating) {
                if (isPolling) {
                    console.log("All stock depleted. Stops polling.");
                    setIsPolling(false);
                }
                // Stop sale timer
                if (saleTimerRef.current) {
                    clearInterval(saleTimerRef.current);
                    saleTimerRef.current = null;
                }
            }
        }
    };

    // Initial load only
    useEffect(() => {
        fetchData();
    }, []);

    // Polling effect
    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (!isPolling) return;

        timerRef.current = setInterval(fetchData, 1500);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPolling]);

    // Timer effect
    useEffect(() => {
        if (isSimulating && !startTime) {
            setStartTime(Date.now());
            setElapsedTime(0);
            saleTimerRef.current = setInterval(() => {
                setElapsedTime(Date.now() - Date.now()); // placeholder, fixed in logic below
            }, 100);
        }
    }, [isSimulating]);

    // Better timer apporach: start when isSimulating becomes true, stop when isPolling becomes false (all sold out)
    useEffect(() => {
        if (isSimulating) {
            const start = Date.now();
            setStartTime(start);
            if (saleTimerRef.current) clearInterval(saleTimerRef.current);

            saleTimerRef.current = setInterval(() => {
                setElapsedTime((Date.now() - start) / 1000);
            }, 100);
        }
    }, [isSimulating]);

    const [proportional, setProportional] = useState(false);

    // ... existing refs and fetchData ...

    // ... existing checkStock ...

    // ... existing useEffects ...

    const handleFrontendSimulation = async () => {
        if (products.length === 0) {
            alert("No products to simulate. Please add products first.");
            return;
        }

        setIsSimulating(true);
        setIsPolling(true);

        // Filter valid flash sale products (is_flash_sale !== false)
        const targets = products.filter(p => p.is_flash_sale !== false);

        if (targets.length === 0) {
            alert("No products marked for flash sale.");
            setIsSimulating(false);
            return;
        }

        try {
            console.log("Starting Frontend Simulation for:", targets.map(p => p.id));

            // Create concurrent simulation tasks for each target product
            const promises = targets.map(p => {
                // Randomize buyers slightly
                const buyers = 20 + Math.floor(Math.random() * 30); // 20-50 buyers per product
                // Pass fetchData as callback to refresh UI during simulation
                return simulateFlashSale(p.id, buyers, 1, fetchData);
            });

            const results = await Promise.all(promises);
            console.log("Simulation Results:", results);

            // Simple aggregation for console/alert
            const totalSuccess = results.reduce((acc, curr) => acc + curr.success, 0);
            const totalConflict = results.reduce((acc, curr) => acc + curr.conflict, 0);
            const totalError = results.reduce((acc, curr) => acc + curr.error, 0);
            const totalCancelled = results.reduce((acc, curr) => acc + curr.cancelled, 0);

            console.log(`Simulation Complete. Success: ${totalSuccess}, Cancelled: ${totalCancelled}, Conflict: ${totalConflict}, Error: ${totalError}`);

        } catch (e) {
            console.error("Simulation failed", e);
            alert("Failed to run simulation.");
        } finally {
            setIsSimulating(false);
            setIsPolling(false);
            // Don't clear timer immediately so user can see final time, or clear if desired.
            if (saleTimerRef.current) {
                clearInterval(saleTimerRef.current);
                saleTimerRef.current = null;
            }
        }
    };

    const handleLegacyLoadTest = async () => {
        if (products.length === 0) return;
        setIsSimulating(true);
        setIsPolling(true);

        const targets = products.filter(p => p.is_flash_sale !== false);
        if (targets.length === 0) {
            setIsSimulating(false);
            return;
        }

        try {
            console.log("Starting Backend Load Test...");
            const promises = targets.map(p => {
                const concurrency = 50;
                const delayStart = Math.floor(Math.random() * 1000);
                return new Promise(resolve => {
                    setTimeout(() => {
                        runLoadTest(concurrency, p.stock, 1, p.id).then(resolve);
                    }, delayStart);
                });
            });
            await Promise.all(promises);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSimulating(false);
            setIsPolling(false);
            if (saleTimerRef.current) {
                clearInterval(saleTimerRef.current);
                saleTimerRef.current = null;
            }
        }
    };

    const formatTime = (seconds) => {
        return seconds.toFixed(1) + 's';
    };

    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="dashboard-title">Flash Sale Inventory Dashboard</h2>
                <div className="dashboard-controls">
                    <label className="dashboard-toggle-label">
                        <input
                            type="checkbox"
                            checked={proportional}
                            onChange={e => setProportional(e.target.checked)}
                            className="dashboard-toggle-input"
                        />
                        <span className="dashboard-toggle-text">Proportionate View</span>
                    </label>

                    {startTime && (
                        <span style={{ fontSize: '1.2em', fontWeight: 'bold', marginRight: 10 }}>
                            Time: {formatTime(elapsedTime)}
                        </span>
                    )}
                    {/* ... existing SOLD OUT check ... */}
                    {!isPolling && products.length > 0 && products.every(p => p.stock === 0) && (
                        <span style={{ color: 'red', fontWeight: 'bold' }}>SOLD OUT</span>
                    )}
                    <button
                        disabled={resetting}
                        onClick={async () => {
                            if (confirm("Reset all stock?")) {
                                setResetting(true);
                                setIsPolling(false); // Stop any active polling
                                setIsSimulating(false); // Stop any simulation flags
                                if (saleTimerRef.current) clearInterval(saleTimerRef.current);
                                setStartTime(null);
                                setElapsedTime(0);
                                try {
                                    await resetProducts();
                                    await fetchData();
                                } catch (e) {
                                    console.error(e);
                                } finally {
                                    setResetting(false);
                                }
                            }
                        }}
                        style={{
                            padding: '10px 20px',
                            background: resetting ? '#ccc' : '#d32f2f',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: resetting ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            marginLeft: 10
                        }}
                    >
                        {resetting ? "Resetting..." : "Reset Stock"}
                    </button>
                    <button
                        onClick={handleLegacyLoadTest}
                        disabled={isSimulating}
                        style={{
                            padding: '10px 20px',
                            background: isSimulating ? '#ccc' : '#7b1fa2', // Purple for backend test
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isSimulating ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            marginLeft: 10
                        }}
                    >
                        Load Test
                    </button>
                    <button
                        onClick={handleFrontendSimulation}
                        disabled={isSimulating}
                        style={{
                            padding: '10px 20px',
                            background: isSimulating ? '#ccc' : '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isSimulating ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            marginLeft: 10
                        }}
                    >
                        Simulate Sale
                    </button>
                </div>
            </div>

            <div className={proportional ? "dashboard-flex" : "dashboard-grid"}>
                {(() => {
                    // Pre-calculate max stock for global proportionality
                    const maxStock = products.length > 0
                        ? Math.max(...products.map(p => p.initial_stock || 100))
                        : 100;

                    const MIN_WIDTH = 120;
                    const MAX_WIDTH = 400; // Max width for largest stock item

                    return products.map(p => {
                        if (proportional) {
                            // "True" Proportionality: Size depends on stock relative to MAX stock in the entire set.
                            // Not just current row neighbors.
                            const stockVal = p.initial_stock || 100;
                            const ratio = stockVal / maxStock;
                            const widthPx = MIN_WIDTH + (ratio * (MAX_WIDTH - MIN_WIDTH));

                            return (
                                <InventoryTile
                                    key={p.id}
                                    product={p}
                                    style={{
                                        width: `${widthPx}px`,
                                        height: '180px',
                                        flexGrow: 0, // Do NOT grow, keep strict proportion
                                        flexShrink: 0
                                    }}
                                />
                            );
                        } else {
                            // Normal Grid View
                            return (
                                <InventoryTile
                                    key={p.id}
                                    product={p}
                                // grid sizing handled by CSS
                                />
                            );
                        }
                    });
                })()}
            </div>
        </div>
    );
}
