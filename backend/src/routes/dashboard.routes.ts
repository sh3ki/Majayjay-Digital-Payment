import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'cashier', 'department_viewer', 'resident'));

router.get('/analytics', dashboardController.getAnalytics);
router.get('/revenue-summary', dashboardController.getRevenueSummary);
router.get('/payment-methods-breakdown', dashboardController.getPaymentMethodBreakdown);

export default router;
