import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Protect all product routes with JWT verification middleware
router.use(authMiddleware);

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
