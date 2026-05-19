
import express from 'express';
import { getCart, addToCart, removeFromCart, checkout, guestCheckout, getMyOrders, getMyNotifications, markAllMyNotificationsRead, markMyNotificationRead, confirmCheckout, trackOrder, getOrderDelivery } from '../controllers/cartController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/checkout/guest', guestCheckout);
router.post('/checkout/confirm', optionalAuthenticate, confirmCheckout);
router.get('/orders/:orderNumber/track', optionalAuthenticate, trackOrder);
router.get('/orders/:orderNumber/delivery', optionalAuthenticate, getOrderDelivery);

router.get('/cart', authenticate, getCart);
router.post('/cart', authenticate, addToCart);
router.delete('/cart/:itemId', authenticate, removeFromCart);
router.post('/checkout', authenticate, checkout);
router.get('/orders/my', authenticate, getMyOrders);
router.get('/users/me/notifications', authenticate, getMyNotifications);
router.post('/users/me/notifications/read-all', authenticate, markAllMyNotificationsRead);
router.patch('/users/me/notifications/:notificationId/read', authenticate, markMyNotificationRead);

export default router;
