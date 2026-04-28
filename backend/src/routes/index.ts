import { Router } from 'express';
import * as authRoutesModule from './auth.routes';
import * as oauthRoutesModule from './oauth.routes';
import * as billsRoutesModule from './bills.routes';
import * as paymentsRoutesModule from './payments.routes';
import * as dashboardRoutesModule from './dashboard.routes';
import * as reportsRoutesModule from './reports.routes';
import * as adminRoutesModule from './admin.routes';

// Support both default and named exports from route modules
const authRoutes = (authRoutesModule as any).default ?? authRoutesModule;
const oauthRoutes = (oauthRoutesModule as any).default ?? oauthRoutesModule;
const billsRoutes = (billsRoutesModule as any).default ?? billsRoutesModule;
const paymentsRoutes = (paymentsRoutesModule as any).default ?? paymentsRoutesModule;
const dashboardRoutes = (dashboardRoutesModule as any).default ?? dashboardRoutesModule;
const reportsRoutes = (reportsRoutesModule as any).default ?? reportsRoutesModule;
const adminRoutes = (adminRoutesModule as any).default ?? adminRoutesModule;

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Majayjay Digital Payment System API is running', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/oauth', oauthRoutes);
router.use('/bills', billsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportsRoutes);
router.use('/admin', adminRoutes);

export default router;
