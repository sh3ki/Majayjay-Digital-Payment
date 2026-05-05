import { Router } from 'express';
import { paymentsController } from '../controllers/payments.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', paymentsController.getPayments);
router.get('/receipt/:id/download', paymentsController.downloadReceiptPDF);
router.get('/receipt/:id', paymentsController.getReceipt);
router.get('/:id', paymentsController.getPaymentById);
router.post('/record-cash', authorize('admin', 'cashier'), paymentsController.recordCashPayment);
router.post('/generate-qr', authorize('admin', 'cashier'), paymentsController.generateQR);

export default router;
