import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import bcrypt from 'bcryptjs';

export const adminController = {
  // Users
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { status, role, search } = req.query as Record<string, string>;

      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (role) where.role = { roleName: role };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, email: true, firstName: true, lastName: true,
            contactNumber: true, status: true, emailVerified: true,
            lastLoginAt: true, createdAt: true,
            role: { select: { roleName: true } },
            department: { select: { departmentName: true } },
          },
        }),
        prisma.user.count({ where }),
      ]);

      sendPaginated(res, users, total, page, limit, 'Users retrieved');
    } catch (err) {
      next(err);
    }
  },

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, contactNumber, roleId, departmentId } = req.body;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return sendError(res, 'Email already registered', 409);

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email, passwordHash, firstName, lastName, contactNumber,
          roleId: parseInt(roleId), departmentId: departmentId ? parseInt(departmentId) : null,
          status: 'ACTIVE', emailVerified: true, createdById: req.user!.sub,
        },
        select: { id: true, email: true, firstName: true, lastName: true, status: true },
      });

      sendSuccess(res, user, 'User created', 201);
    } catch (err) {
      next(err);
    }
  },

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const { firstName, lastName, contactNumber, roleId, departmentId, status } = req.body;

      const user = await prisma.user.update({
        where: { id },
        data: {
          firstName, lastName, contactNumber,
          roleId: roleId ? parseInt(roleId) : undefined,
          departmentId: departmentId ? parseInt(departmentId) : null,
          status,
          updatedById: req.user!.sub,
        },
        select: { id: true, email: true, firstName: true, lastName: true, status: true },
      });

      sendSuccess(res, user, 'User updated');
    } catch (err) {
      next(err);
    }
  },

  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const user = await prisma.user.update({
        where: { id },
        data: { status },
        select: { id: true, email: true, status: true },
      });
      sendSuccess(res, user, 'User status updated');
    } catch (err) {
      next(err);
    }
  },

  // Fees
  async getFees(req: Request, res: Response, next: NextFunction) {
    try {
      const fees = await prisma.fee.findMany({
        include: { category: true, penaltyRules: true },
        orderBy: { createdAt: 'desc' },
      });
      sendSuccess(res, fees, 'Fees retrieved');
    } catch (err) {
      next(err);
    }
  },

  async createFee(req: Request, res: Response, next: NextFunction) {
    try {
      const fee = await prisma.fee.create({
        data: { ...req.body, createdById: req.user!.sub },
        include: { category: true },
      });
      sendSuccess(res, fee, 'Fee created', 201);
    } catch (err) {
      next(err);
    }
  },

  async updateFee(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const fee = await prisma.fee.update({
        where: { id },
        data: { ...req.body, updatedById: req.user!.sub },
        include: { category: true },
      });
      sendSuccess(res, fee, 'Fee updated');
    } catch (err) {
      next(err);
    }
  },

  async toggleFeeStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const fee = await prisma.fee.findUnique({ where: { id } });
      if (!fee) return sendError(res, 'Fee not found', 404);
      const updated = await prisma.fee.update({
        where: { id },
        data: { active: !fee.active, updatedById: req.user!.sub },
      });
      sendSuccess(res, updated, `Fee ${updated.active ? 'activated' : 'deactivated'}`);
    } catch (err) {
      next(err);
    }
  },

  // Fee Categories
  async getFeeCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.feeCategory.findMany({ orderBy: { displayOrder: 'asc' } });
      sendSuccess(res, categories, 'Fee categories retrieved');
    } catch (err) {
      next(err);
    }
  },

  // Penalty Rules
  async getPenaltyRules(req: Request, res: Response, next: NextFunction) {
    try {
      const rules = await prisma.penaltyRule.findMany({
        include: { fee: { select: { feeName: true } } },
        orderBy: { createdAt: 'desc' },
      });
      sendSuccess(res, rules, 'Penalty rules retrieved');
    } catch (err) {
      next(err);
    }
  },

  async createPenaltyRule(req: Request, res: Response, next: NextFunction) {
    try {
      const rule = await prisma.penaltyRule.create({
        data: { ...req.body, createdById: req.user!.sub },
        include: { fee: { select: { feeName: true } } },
      });
      sendSuccess(res, rule, 'Penalty rule created', 201);
    } catch (err) {
      next(err);
    }
  },

  async updatePenaltyRule(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const rule = await prisma.penaltyRule.update({
        where: { id },
        data: req.body,
        include: { fee: { select: { feeName: true } } },
      });
      sendSuccess(res, rule, 'Penalty rule updated');
    } catch (err) {
      next(err);
    }
  },

  async togglePenaltyRuleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const rule = await prisma.penaltyRule.findUnique({ where: { id } });
      if (!rule) return sendError(res, 'Penalty rule not found', 404);
      const updated = await prisma.penaltyRule.update({ where: { id }, data: { active: !rule.active } });
      sendSuccess(res, updated, `Penalty rule ${updated.active ? 'enabled' : 'disabled'}`);
    } catch (err) {
      next(err);
    }
  },

  // Departments
  async getDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const departments = await prisma.department.findMany({ orderBy: { departmentName: 'asc' } });
      sendSuccess(res, departments, 'Departments retrieved');
    } catch (err) {
      next(err);
    }
  },

  async createDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const dept = await prisma.department.create({ data: req.body });
      sendSuccess(res, dept, 'Department created', 201);
    } catch (err) {
      next(err);
    }
  },

  async updateDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const dept = await prisma.department.update({ where: { id }, data: req.body });
      sendSuccess(res, dept, 'Department updated');
    } catch (err) {
      next(err);
    }
  },

  // Audit Logs
  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const { eventType, userId, startDate, endDate } = req.query as Record<string, string>;

      const where: Record<string, unknown> = {};
      if (eventType) where.eventType = { contains: eventType, mode: 'insensitive' };
      if (userId) where.userId = parseInt(userId);
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
        if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        }),
        prisma.auditLog.count({ where }),
      ]);

      sendPaginated(res, logs, total, page, limit, 'Audit logs retrieved');
    } catch (err) {
      next(err);
    }
  },

  // Payment Methods
  async getPaymentMethods(req: Request, res: Response, next: NextFunction) {
    try {
      const methods = await prisma.paymentMethod.findMany({ orderBy: { methodName: 'asc' } });
      sendSuccess(res, methods, 'Payment methods retrieved');
    } catch (err) {
      next(err);
    }
  },

  async togglePaymentMethod(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const method = await prisma.paymentMethod.findUnique({ where: { id } });
      if (!method) return sendError(res, 'Payment method not found', 404);
      const updated = await prisma.paymentMethod.update({
        where: { id },
        data: { isActive: !method.isActive },
      });
      sendSuccess(res, updated, `Payment method ${updated.isActive ? 'enabled' : 'disabled'}`);
    } catch (err) {
      next(err);
    }
  },

  async getSystemStats(req: Request, res: Response, next: NextFunction) {
    try {
      const [userCount, billCount, paymentCount, totalRevenue] = await Promise.all([
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.bill.count(),
        prisma.payment.count({ where: { status: 'PAID' } }),
        prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      ]);

      sendSuccess(res, {
        activeUsers: userCount,
        totalBills: billCount,
        totalPaidPayments: paymentCount,
        totalRevenue: parseFloat(totalRevenue._sum.amount?.toString() || '0'),
      }, 'System stats retrieved');
    } catch (err) {
      next(err);
    }
  },

  // Pending User Approvals
  async getPendingUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const [pendingUsers, total] = await Promise.all([
        prisma.user.findMany({
          where: { status: 'PENDING' },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            contactNumber: true,
            status: true,
            emailVerified: true,
            createdAt: true,
            role: { select: { roleName: true } },
          },
        }),
        prisma.user.count({ where: { status: 'PENDING' } }),
      ]);

      sendPaginated(res, pendingUsers, total, page, limit, 'Pending users retrieved');
    } catch (err) {
      next(err);
    }
  },

  async approveUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.id);

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'ACTIVE',
          updatedById: req.user!.sub,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          createdAt: true,
        },
      });

      // Log audit event
      await prisma.auditLog.create({
        data: {
          eventType: 'USER_APPROVED',
          userId: req.user!.sub,
          entityType: 'user',
          entityId: String(userId),
          action: 'APPROVE',
          status: 'SUCCESS',
          reason: `User approved by admin ${req.user!.sub}`,
        },
      });

      sendSuccess(res, user, 'User approved successfully');
    } catch (err) {
      next(err);
    }
  },

  async rejectUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.id);
      const { reason } = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'INACTIVE',
          updatedById: req.user!.sub,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
        },
      });

      // Log audit event
      await prisma.auditLog.create({
        data: {
          eventType: 'USER_REJECTED',
          userId: req.user!.sub,
          entityType: 'user',
          entityId: String(userId),
          action: 'REJECT',
          status: 'SUCCESS',
          reason: reason || 'User rejected by admin',
        },
      });

      sendSuccess(res, user, 'User rejected');
    } catch (err) {
      next(err);
    }
  },
};
