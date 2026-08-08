import { Router } from 'express';
import { billsController } from '../controllers/bills.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', billsController.getBills);
router.get('/search', billsController.searchBills);
router.get('/:id', billsController.getBillById);
router.post('/', authorize('admin', 'cashier', 'collector'), billsController.createBill);
router.put('/:id/status', authorize('admin', 'cashier', 'collector'), billsController.updateBillStatus);
router.put('/:id/confirm', authorize('admin', 'collector'), billsController.confirmBill);

export default router;
