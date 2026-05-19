
import express from 'express';
import { approveOrderPayment, cleanSiteData, createOrderDelivery, exportSiteData, getStats, getAllUsers, getAllOrders, getSiteConfig, importSiteData, rejectOrderPayment, resendOrderDeliveryEmail, resendOrderInvoiceEmail, sendClientNotification, sendOrderDelivery, sendTestEmail, updateSiteConfig, updateUserRole, updateUserBalance, updateOrderStatus } from '../controllers/adminController.js';
import { getAuthProviders, updateAuthProvider } from '../controllers/authProviderController.js';
import { getSeoAnalytics, trackSiteVisit } from '../controllers/seoController.js';
import { confirmEmailChange, deleteAccount, requestEmailChange, updateProfile, updateSubscription } from '../controllers/authController.js';
import { authenticate, isStaff, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/admin/stats', authenticate, isStaff, getStats);
router.get('/admin/seo/analytics', authenticate, isStaff, getSeoAnalytics);
router.post('/analytics/visit', trackSiteVisit);
router.get('/orders/admin', authenticate, isStaff, getAllOrders);
router.patch('/orders/:id/status', authenticate, isStaff, updateOrderStatus);
router.post('/orders/:id/email/resend', authenticate, isStaff, resendOrderInvoiceEmail);
router.post('/admin/orders/:id/payment/approve', authenticate, isStaff, approveOrderPayment);
router.post('/admin/orders/:id/payment/reject', authenticate, isStaff, rejectOrderPayment);
router.post('/admin/orders/:id/delivery', authenticate, isStaff, createOrderDelivery);
router.post('/admin/orders/:id/delivery/send', authenticate, isStaff, sendOrderDelivery);
router.post('/admin/orders/:id/emails/resend-invoice', authenticate, isStaff, resendOrderInvoiceEmail);
router.post('/admin/orders/:id/emails/resend-delivery', authenticate, isStaff, resendOrderDeliveryEmail);
router.patch('/users/profile', authenticate, updateProfile);
router.post('/users/subscribe', authenticate, updateSubscription);
router.post('/users/email-change/request', authenticate, requestEmailChange);
router.post('/users/email-change/confirm', authenticate, confirmEmailChange);
router.delete('/users/me', authenticate, deleteAccount);
router.get('/users', authenticate, isAdmin, getAllUsers);
router.patch('/users/:id/role', authenticate, isAdmin, updateUserRole);
router.patch('/users/:id/balance', authenticate, isAdmin, updateUserBalance);
router.get('/config', getSiteConfig);
router.patch('/config', authenticate, isAdmin, updateSiteConfig);
router.get('/admin/auth-providers', authenticate, isAdmin, getAuthProviders);
router.patch('/admin/auth-providers/:providerKey', authenticate, isAdmin, updateAuthProvider);
router.post('/admin/email/test', authenticate, isAdmin, sendTestEmail);
router.post('/admin/notifications/clients', authenticate, isAdmin, sendClientNotification);
router.get('/admin/data/export', authenticate, isAdmin, exportSiteData);
router.post('/admin/data/import', authenticate, isAdmin, importSiteData);
router.post('/admin/data/clean', authenticate, isAdmin, cleanSiteData);

export default router;
