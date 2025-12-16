# Flash Sale App

**Live Demo:** [https://flash-sale-app.vercel.app/](https://flash-sale-app.vercel.app/)

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)

## Setup & Installation

### Install Dependencies
    Run the setup script to install dependencies for the root, frontend, and backend packages.
    ```bash
    npm run setup
    ```

## Running the Application

### Development Mode
To run both the frontend and backend in development mode concurrently:
```bash
npm run dev
```
- Frontend will be available at `http://localhost:5173` (default Vite port)
- Backend server will start on its configured port (check console output)

### Other Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run frontend:dev` | Run only the frontend development server |
| `npm run backend:dev` | Run only the backend development server |
| `npm run preview` | Build the frontend and run it in preview mode along with the backend |
| `npm run install-all` | Re-install dependencies for all workspaces |

## Project Structure

- **frontend/**: React application built with Vite
- **backend/**: Node.js Express server


## Flash Sale Simulation

The project includes two modes for simulations. **Both modes support:**
- **Real-time Visualization:** Dashboard tiles update live as inventory changes.
- **Concurrent Users:** Simulates multiple buyers competing for stock.
- **Mixed Traffic:** Both modes randomly cancel ~20-25% of successful orders to test inventory restoration.
- **Race Condition Testing:** Verifies the backend's ability to handle parallel requests safely.

### 1. Frontend Simulation
- **Accessible via:** Dashboard > "Simulate Sale" button.
- **Mechanism:** Browser directly fires HTTP requests (`POST /order`, `POST /cancel`).
- **Unique Benefit:** Tests the full HTTP round-trip latency and browser network stack.
- **Limit:** Throttled by browser connection limits (batch size 10).

### 2. Headless Load Test (CLI / Local set-up)
- **Accessible via:** Dashboard > "Load Test" button or Terminal command (`node src/scripts/loadTest.js`)
- **Mechanism:** Server-side script (`loadTest.js`) locally hammering the inventory service.
- **Unique Benefit:** **High Throughput**. Bypasses browser connection limits to test raw database/locking performance.
- **Use Case:** Stress testing and capacity planning.

## Architecture & Design Decisions

### Why PostgreSQL?
We chose PostgreSQL for the production inventory service due to its robust support for **ACID transactions** and **Row-Level Locking**.
- **Atomicity:** Ensures that stock deduction and order creation happen as a single, all-or-nothing unit of work.
- **Concurrency Control:** We use atomic `UPDATE` queries with `RETURNING` clauses (e.g., `UPDATE products SET stock = stock - 1 WHERE id = $1 AND stock > 0`), which effectively utilizes Postgres's native locking mechanism to prevent overselling without the performance overhead of explicit application-level locking.

### Hybrid Inventory Service
The backend implements a **Strategy Pattern** for the inventory service:
1.  **In-Memory Service (Development):** Uses JavaScript `Map` and Mutexes for rapid prototyping and zero-dependency setup.
2.  **PostgreSQL Service (Production):** Uses connection pooling and transaction management for data persistence and reliability.
This allows the application to run immediately locally (`npm run dev`) while being ready for scalable deployment.