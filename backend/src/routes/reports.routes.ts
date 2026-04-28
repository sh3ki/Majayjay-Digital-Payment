import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'cashier', 'department_viewer'));

router.get('/collection', reportsController.getCollectionReport);
router.get('/daily-summary', reportsController.getDailySummary);

export default router;
