// src/routes/productRoutes.js
import express from 'express';
import * as productController from '../controllers/productController.js';
import { validate } from '../middleware/validate.js';
import { createProductSchema, placeOrderSchema } from '../validators/productValidators.js';

const router = express.Router();

router.get('/', productController.listProducts);
router.post('/seed', productController.seedProducts);
router.post('/reset', productController.resetProducts);
router.post('/', validate(createProductSchema), productController.createProduct);
router.put('/:id', productController.updateProduct);
router.get('/:id', productController.getProduct);
router.get('/:id/orders', productController.getProductOrders);
router.post('/:id/order', validate(placeOrderSchema), productController.placeOrder);
router.post('/:id/cancel/:orderId', productController.cancelOrder);

export default router;
