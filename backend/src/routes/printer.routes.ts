import { Router } from 'express';
import {
  getAllPrinters,
  getPrinterById,
  createPrinter,
  updatePrinter,
  deletePrinter,
  updatePrinterStatus,
} from '../controllers/printer.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Protect all printer endpoints with JWT auth
router.use(authMiddleware);

router.get('/', getAllPrinters);
router.get('/:id', getPrinterById);
router.post('/', createPrinter);
router.put('/:id', updatePrinter);
router.delete('/:id', deletePrinter);
router.put('/:id/status', updatePrinterStatus);

export default router;
