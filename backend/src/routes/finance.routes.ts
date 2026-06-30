import { Router } from 'express';
import { getFinancialSummary } from '../controllers/finance.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Protect all finance endpoints with JWT auth
router.use(authMiddleware);

router.get('/summary', getFinancialSummary);

export default router;
