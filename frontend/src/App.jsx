import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import ProductList from "./pages/ProductList/ProductList";
import ProductDetails from "./pages/ProductDetails/ProductDetails";
import Dashboard from "./pages/Dashboard/Dashboard";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />

        <main className="main-content container">
          <Routes>
            <Route path="/" element={<ProductList />} />   {/* PLP */}
            <Route path="/product" element={<ProductDetails />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
