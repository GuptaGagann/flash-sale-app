# Flash Sale App

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