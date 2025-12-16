import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config.js';
import productRouter from './routes/productRoutes.js';
import { runLoadTest } from './scripts/loadTest.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { initProductSchema } from './model/productSchema.js';

const { port: PORT } = config;

const app = express();

// logging
app.use(morgan('dev'));

// Middlewares
app.use(cors({
  // for development, restricting origin to frontend dev port
  origin: [config.allowedOrigin]
}));
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/product', productRouter);

app.post('/load-test', async (req, res) => {
  try {
    const { concurrency, stock, orderQty, productId } = req.body;
    const result = await runLoadTest(concurrency, stock, orderQty, productId);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 404 handler
app.use(notFoundHandler);

// error handler (must be last)
app.use(errorHandler);

// Server startup
(async () => {
  if (config.useDatabase) {
    try {
      await initProductSchema();
      console.log('Database schema initialized.');
    } catch (err) {
      console.error('Failed to initialize database schema:', err);
      process.exit(1);
    }
  }

  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
})();

