
import express from 'express';
import { cleanSiteData, exportSiteData, getStats, getAllUsers, getAllOrders, getSiteConfig, importSiteData, updateSiteConfig, updateUserRole, updateUserBalance, updateOrderStatus } from '../controllers/adminController.js';
import { updateProfile, updateSubscription } from '../controllers/authController.js';
import { authenticate, isStaff, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/admin/stats', authenticate, isStaff, getStats);
router.get('/orders/admin', authenticate, isStaff, getAllOrders);
router.patch('/orders/:id/status', authenticate, isStaff, updateOrderStatus);
router.patch('/users/profile', authenticate, updateProfile);
router.post('/users/subscribe', authenticate, updateSubscription);
router.get('/users', authenticate, isAdmin, getAllUsers);
router.patch('/users/:id/role', authenticate, isAdmin, updateUserRole);
router.patch('/users/:id/balance', authenticate, isAdmin, updateUserBalance);
router.get('/config', getSiteConfig);
router.patch('/config', authenticate, isAdmin, updateSiteConfig);
router.get('/admin/data/export', authenticate, isAdmin, exportSiteData);
router.post('/admin/data/import', authenticate, isAdmin, importSiteData);
router.post('/admin/data/clean', authenticate, isAdmin, cleanSiteData);

export default router;
