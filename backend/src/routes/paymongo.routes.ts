import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { paymongoController } from '../controllers/paymongo.controller';

const router = Router();

// Initiate online payment (residents, admins, cashiers)
router.post('/initiate', authenticate, authorize('resident', 'admin', 'cashier'), paymongoController.initiatePayment);

// Check source/payment status
router.get('/status/:sourceId', authenticate, paymongoController.getPaymentStatus);

export default router;
