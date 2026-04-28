import { Router } from 'express';
import { billsController } from '../controllers/bills.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', billsController.getBills);
router.get('/search', billsController.searchBills);
router.get('/:id', billsController.getBillById);
router.post('/', authorize('admin', 'cashier'), billsController.createBill);
router.put('/:id/status', authorize('admin', 'cashier'), billsController.updateBillStatus);

export default router;
