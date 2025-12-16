import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';
    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <nav className="navbar">
            <div className="container navbar-container">
                <Link to="/" className="nav-brand" onClick={() => setIsOpen(false)}>
                    FlashStore
                </Link>

                <button className="hamburger" onClick={toggleMenu} aria-label="Toggle navigation">
                    <span className="bar"></span>
                    <span className="bar"></span>
                    <span className="bar"></span>
                </button>

                <div className={`nav-links ${isOpen ? "open" : ""}`}>
                    <Link to="/" className={isActive('/')} onClick={() => setIsOpen(false)}>Products</Link>
                    <Link to="/dashboard" className={isActive('/dashboard')} onClick={() => setIsOpen(false)}>Dashboard</Link>
                </div>
            </div>
        </nav>
    );
}
