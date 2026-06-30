import { Router } from 'express';
import {
  getAllMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  consumeMaterial,
} from '../controllers/material.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Protect all material endpoints with JWT auth
router.use(authMiddleware);

router.get('/', getAllMaterials);
router.get('/:id', getMaterialById);
router.post('/', createMaterial);
router.put('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);
router.put('/:id/consume', consumeMaterial);

export default router;
