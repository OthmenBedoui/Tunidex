
import express from 'express';
import { getCart, addToCart, removeFromCart, checkout, guestCheckout, getMyOrders } from '../controllers/cartController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/checkout/guest', guestCheckout);

router.get('/cart', authenticate, getCart);
router.post('/cart', authenticate, addToCart);
router.delete('/cart/:itemId', authenticate, removeFromCart);
router.post('/checkout', authenticate, checkout);
router.get('/orders/my', authenticate, getMyOrders);

export default router;
