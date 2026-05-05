import { Router } from 'express';
import { notificationsController } from '../controllers/notifications.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, notificationsController.getNotifications);
router.get('/unread-count', authenticate, notificationsController.getUnreadCount);
router.put('/:id/read', authenticate, notificationsController.markAsRead);
router.put('/read-all', authenticate, notificationsController.markAllAsRead);

export default router;
