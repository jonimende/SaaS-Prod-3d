import { Router } from 'express';
import {
  getOrders,
  createOrder,
  deleteOrder,
  updatePieceStatus,
  updateOrderItemStatus,
} from '../controllers/order.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Protect all order-related API endpoints with authMiddleware
router.use(authMiddleware);

router.get('/', getOrders);
router.post('/', createOrder);
router.delete('/:id', deleteOrder);
router.put('/pieces/:id', updatePieceStatus);
router.put('/items/:id', updateOrderItemStatus);

export default router;
