import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Stats & System (admin only)
router.get('/system-stats', authorize('admin'), adminController.getSystemStats);
router.get('/audit-logs', authorize('admin'), adminController.getAuditLogs);

// Users (admin only)
router.get('/users', authorize('admin'), adminController.getUsers);
router.post('/users', authorize('admin'), adminController.createUser);
router.put('/users/:id', authorize('admin'), adminController.updateUser);
router.put('/users/:id/status', authorize('admin'), adminController.updateUserStatus);

// Fees (admin only)
router.get('/fees', authorize('admin', 'cashier', 'department_viewer'), adminController.getFees);
router.post('/fees', authorize('admin'), adminController.createFee);
router.put('/fees/:id', authorize('admin'), adminController.updateFee);
router.put('/fees/:id/toggle', authorize('admin'), adminController.toggleFeeStatus);

// Fee Categories
router.get('/fee-categories', adminController.getFeeCategories);

// Penalty Rules (admin only)
router.get('/penalty-rules', authorize('admin'), adminController.getPenaltyRules);
router.post('/penalty-rules', authorize('admin'), adminController.createPenaltyRule);
router.put('/penalty-rules/:id', authorize('admin'), adminController.updatePenaltyRule);
router.put('/penalty-rules/:id/toggle', authorize('admin'), adminController.togglePenaltyRuleStatus);

// Departments
router.get('/departments', adminController.getDepartments);
router.post('/departments', authorize('admin'), adminController.createDepartment);
router.put('/departments/:id', authorize('admin'), adminController.updateDepartment);

// Payment Methods
router.get('/payment-methods', adminController.getPaymentMethods);
router.put('/payment-methods/:id/toggle', authorize('admin'), adminController.togglePaymentMethod);

// Pending User Approvals
router.get('/pending-users', authorize('admin'), adminController.getPendingUsers);
router.put('/pending-users/:id/approve', authorize('admin'), adminController.approveUser);
router.put('/pending-users/:id/reject', authorize('admin'), adminController.rejectUser);

export default router;
