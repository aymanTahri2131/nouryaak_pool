// ============================================
// Products Routes (read-only, synced from Aronium)
// ============================================

import { Router } from 'express';
import * as productsController from '../controllers/products.controller.js';
import { authenticateToken, adminOnly } from '../middleware/index.js';
import { validateParams } from '../middleware/validate.middleware.js';
import { idParamSchema } from '../validators/index.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Categories
router.get('/categories', productsController.getCategories);
router.post('/categories', adminOnly, productsController.createCategory);
router.put('/categories/:id', adminOnly, validateParams(idParamSchema), productsController.updateCategory);
router.delete('/categories/:id', adminOnly, validateParams(idParamSchema), productsController.deleteCategory);
router.get('/categories/:id', validateParams(idParamSchema), productsController.getCategoryById);

// Products
router.get('/', productsController.getProducts);
router.post('/', adminOnly, productsController.createProduct);
router.put('/:id', adminOnly, validateParams(idParamSchema), productsController.updateProduct);
router.delete('/:id', adminOnly, validateParams(idParamSchema), productsController.deleteProduct);
router.get('/available', productsController.getAvailableProducts);
router.get('/:id', validateParams(idParamSchema), productsController.getProductById);

// Admin only - toggle availability
router.patch('/:id/availability', adminOnly, validateParams(idParamSchema), productsController.toggleAvailability);

export default router;
