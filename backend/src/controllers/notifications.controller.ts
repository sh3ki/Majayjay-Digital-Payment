import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';

export const notificationsController = {
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub;
      const notifications = await prisma.notification.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      // Normalize for frontend
      const normalized = notifications.map((n) => ({
        id: n.id,
        type: n.notificationType,
        title: n.title ?? n.notificationType,
        message: n.message,
        isRead: !!n.readAt,
        createdAt: n.createdAt,
      }));
      sendSuccess(res, normalized, 'Notifications retrieved');
    } catch (err) {
      next(err);
    }
  },

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub;
      const count = await prisma.notification.count({
        where: { recipientId: userId, readAt: null },
      });
      sendSuccess(res, { count }, 'Unread count retrieved');
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub;
      const notifId = parseInt(req.params.id);
      const notif = await prisma.notification.findUnique({ where: { id: notifId } });
      if (!notif || notif.recipientId !== userId) return sendError(res, 'Notification not found', 404);
      await prisma.notification.update({ where: { id: notifId }, data: { readAt: new Date() } });
      sendSuccess(res, null, 'Marked as read');
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub;
      await prisma.notification.updateMany({
        where: { recipientId: userId, readAt: null },
        data: { readAt: new Date() },
      });
      sendSuccess(res, null, 'All notifications marked as read');
    } catch (err) {
      next(err);
    }
  },
};
