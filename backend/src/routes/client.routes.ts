import { Router } from 'express';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from '../controllers/client.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Protect all client CRM routes with JWT auth
router.use(authMiddleware);

router.get('/', getAllClients);
router.get('/:id', getClientById);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

export default router;
