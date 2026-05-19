
import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../prisma.js';
import { clearUserCart, createCheckoutOrder } from '../services/checkoutService.js';
import { notifyClientOrderStatus, serializeClientNotification } from '../services/clientNotificationService.js';
import { sendOrderConfirmationEmail } from '../services/orderEmailService.js';
import { notifyNewOrder } from '../services/orderNotificationService.js';
import { decryptDeliveryContent } from '../services/deliverySecurityService.js';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const serializeOrder = <T extends {
    id: string;
    userId: string | null;
    user?: { id: string; username: string; email: string; avatarUrl: string } | null;
    items: Array<{
        id: string;
        listingId: string;
        quantity: number;
        priceSnapshot: number;
        titleSnapshot: string;
    }>;
    invoice?: {
        id: string;
        invoiceNumber: string;
        type: string;
        status: string;
        issueDate: Date;
        totalAmount: number;
    } | null;
    payments?: Array<Record<string, unknown>>;
    deliveries?: Array<Record<string, unknown>>;
    actionLogs?: Array<Record<string, unknown>>;
    [key: string]: unknown;
}>(order: T) => {
    const buyerName = [order.customerFirstName, order.customerLastName].filter(Boolean).join(' ').trim();
    return {
        ...order,
        buyerId: order.userId || order.id,
        buyer: order.user || null,
        buyerDisplayName: buyerName,
        invoice: order.invoice || null,
        deliveries: (order.deliveries || []).map(({ deliveryContentEncrypted, ...delivery }) => delivery),
        actionLogs: order.actionLogs || []
    };
};

const requestMeta = (req: Request) => ({
    ipAddress: (req.headers['x-forwarded-for']?.toString().split(',')[0] || req.ip || req.socket.remoteAddress || '').trim(),
    userAgent: req.headers['user-agent'] || ''
});

const hashToken = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

/**
 * @swagger
 * tags:
 *   - name: Cart
 *     description: Shopping cart operations
 *   - name: Orders
 *     description: Order processing
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get current user cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CartItem'
 */
export const getCart = async (req: AuthRequest, res: Response) => {
    const cart = await prisma.cart.findUnique({
        where: { userId: req.user?.id },
        include: {
            items: {
                include: {
                    variant: true,
                    listing: {
                        include: {
                            variants: { orderBy: [{ order: 'asc' }, { price: 'asc' }] }
                        }
                    }
                }
            }
        }
    });
    res.json(cart?.items || []);
};

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Add a product to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [listingId]
 *             properties:
 *               listingId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Added to cart
 */
export const addToCart = async (req: AuthRequest, res: Response) => {
    const { listingId, variantId } = req.body;
    const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        include: { variants: true }
    });
    if (!listing || listing.isArchived) return res.status(404).json({ error: 'Produit introuvable.' });
    if (listing.variants.length > 0) {
        const selectedVariant = listing.variants.find((variant) => variant.id === variantId);
        if (!selectedVariant) return res.status(400).json({ error: 'Veuillez choisir une variante.' });
    }
    let cart = await prisma.cart.findUnique({ where: { userId: req.user?.id } });
    if (!cart) cart = await prisma.cart.create({ data: { userId: req.user?.id } });
    const existing = await prisma.cartItem.findFirst({ where: { cartId: cart.id, listingId, variantId: variantId || null } });
    if (existing) await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + 1 } });
    else await prisma.cartItem.create({ data: { cartId: cart.id, listingId, variantId: variantId || null, quantity: 1 } });
    res.json({ success: true });
};

/**
 * @swagger
 * /api/cart/{itemId}:
 *   delete:
 *     summary: Remove an item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cart item removed
 */
export const removeFromCart = async (req: Request, res: Response) => { 
    await prisma.cartItem.delete({ where: { id: req.params.itemId } }); 
    res.json({ success: true }); 
};

/**
 * @swagger
 * /api/checkout:
 *   post:
 *     summary: Checkout current cart
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order created
 */
export const checkout = async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    const cart = await prisma.cart.findUnique({ where: { userId: user.id }, include: { items: true } });
    if (!cart || cart.items.length === 0) return res.status(400).json({ error: 'Votre panier est vide.' });

    try {
        const order = await createCheckoutOrder({
            firstName: user.fullName?.split(' ')[0] || user.username || 'Client',
            lastName: user.fullName?.split(' ').slice(1).join(' ') || user.username || 'TuniBots',
            email: user.email,
            phone: user.phone || req.body.phone || '+216',
            paymentMethod: req.body.paymentMethod,
            customerReference: req.body.customerReference,
            paymentProof: req.body.paymentProof,
            idempotencyKey: req.body.idempotencyKey || req.headers['idempotency-key']?.toString(),
            items: cart.items.map((item) => ({ listingId: item.listingId, variantId: item.variantId || undefined, quantity: item.quantity })),
            userId: user.id,
            source: 'AUTHENTICATED',
            ...requestMeta(req)
        });

        await clearUserCart(user.id);
        await notifyNewOrder(order);
        await notifyClientOrderStatus({ orderId: order.id, status: order.status });
        const emailResult = await sendOrderConfirmationEmail(order);
        res.json(serializeOrder({ ...order, emailStatus: emailResult.status, emailError: emailResult.error }));
    } catch (error) {
        res.status(400).json({ error: error instanceof Error ? error.message : 'Impossible de créer la commande.' });
    }
};

export const guestCheckout = async (req: Request, res: Response) => {
    try {
        const order = await createCheckoutOrder({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            phone: req.body.phone,
            paymentMethod: req.body.paymentMethod,
            customerReference: req.body.customerReference,
            paymentProof: req.body.paymentProof,
            idempotencyKey: req.body.idempotencyKey || req.headers['idempotency-key']?.toString(),
            items: req.body.items,
            ...requestMeta(req)
        });

        await notifyNewOrder(order);
        await notifyClientOrderStatus({ orderId: order.id, status: order.status });
        const emailResult = await sendOrderConfirmationEmail(order);
        res.status(201).json(serializeOrder({ ...order, emailStatus: emailResult.status, emailError: emailResult.error }));
    } catch (error) {
        res.status(400).json({ error: error instanceof Error ? error.message : 'Impossible de créer la commande.' });
    }
};

export const confirmCheckout = async (req: AuthRequest, res: Response) => {
    try {
        const isAuthenticated = Boolean(req.user?.id);
        let user: Awaited<ReturnType<typeof prisma.user.findUnique>> | null = null;
        let items = req.body.items;

        if (isAuthenticated) {
            user = await prisma.user.findUnique({ where: { id: req.user?.id } });
            if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
            const cart = await prisma.cart.findUnique({ where: { userId: user.id }, include: { items: true } });
            if (!cart || cart.items.length === 0) return res.status(400).json({ error: 'Votre panier est vide.' });
            items = cart.items.map((item) => ({ listingId: item.listingId, variantId: item.variantId || undefined, quantity: item.quantity }));
        }

        const order = await createCheckoutOrder({
            firstName: req.body.firstName || user?.fullName?.split(' ')[0] || user?.username,
            lastName: req.body.lastName || user?.fullName?.split(' ').slice(1).join(' ') || user?.username,
            email: req.body.email || user?.email || '',
            phone: req.body.phone || user?.phone || '',
            paymentMethod: req.body.paymentMethod,
            customerReference: req.body.customerReference,
            paymentProof: req.body.paymentProof,
            idempotencyKey: req.body.idempotencyKey || req.headers['idempotency-key']?.toString(),
            items,
            userId: user?.id,
            source: user ? 'AUTHENTICATED' : 'GUEST',
            ...requestMeta(req)
        });

        if (user) await clearUserCart(user.id);
        await notifyNewOrder(order);
        await notifyClientOrderStatus({ orderId: order.id, status: order.status });
        const emailResult = await sendOrderConfirmationEmail(order);
        res.status(201).json(serializeOrder({ ...order, emailStatus: emailResult.status, emailError: emailResult.error }));
    } catch (error) {
        res.status(400).json({ error: error instanceof Error ? error.message : 'Impossible de créer la commande.' });
    }
};

/**
 * @swagger
 * /api/orders/my:
 *   get:
 *     summary: Get current user orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of current user orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */
export const getMyOrders = async (req: AuthRequest, res: Response) => {
    const orders = await prisma.order.findMany({
        where: { userId: req.user?.id },
        include: {
            items: true,
            invoice: true,
            payments: true,
            deliveries: true,
            actionLogs: { orderBy: { createdAt: 'asc' } },
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    avatarUrl: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
    res.json(orders.map((order) => serializeOrder(order)));
};

export const getMyNotifications = async (req: AuthRequest, res: Response) => {
    const notifications = await prisma.clientNotification.findMany({
        where: { userId: req.user?.id },
        include: {
            order: {
                select: {
                    orderNumber: true,
                    status: true
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
    });

    res.json(notifications.map(serializeClientNotification));
};

export const markMyNotificationRead = async (req: AuthRequest, res: Response) => {
    const notification = await prisma.clientNotification.findFirst({
        where: {
            id: req.params.notificationId,
            userId: req.user?.id
        }
    });

    if (!notification) {
        return res.status(404).json({ error: 'Notification introuvable.' });
    }

    const updated = await prisma.clientNotification.update({
        where: { id: notification.id },
        data: { readAt: notification.readAt || new Date() },
        include: {
            order: {
                select: {
                    orderNumber: true,
                    status: true
                }
            }
        }
    });

    res.json(serializeClientNotification(updated));
};

export const markAllMyNotificationsRead = async (req: AuthRequest, res: Response) => {
    await prisma.clientNotification.updateMany({
        where: {
            userId: req.user?.id,
            readAt: null
        },
        data: {
            readAt: new Date()
        }
    });

    res.json({ success: true });
};

export const trackOrder = async (req: AuthRequest, res: Response) => {
    const orderNumber = req.params.orderNumber;
    const token = req.query.token?.toString();
    const email = req.query.email?.toString().trim().toLowerCase();

    const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
            items: true,
            invoice: true,
            payments: true,
            deliveries: true,
            actionLogs: { orderBy: { createdAt: 'asc' } },
            user: { select: { id: true, username: true, email: true, avatarUrl: true } }
        }
    });
    if (!order) return res.status(404).json({ error: 'Commande introuvable.' });

    const ownerAllowed = req.user?.id && order.userId === req.user.id;
    const tokenAllowed = token && order.trackingTokenHash && hashToken(token) === order.trackingTokenHash;
    const emailAllowed = email && email === order.customerEmail.toLowerCase();
    if (!ownerAllowed && !tokenAllowed && !emailAllowed) {
        return res.status(403).json({ error: 'Verification requise pour consulter cette commande.' });
    }

    res.json(serializeOrder(order));
};

export const getOrderDelivery = async (req: AuthRequest, res: Response) => {
    const orderNumber = req.params.orderNumber;
    const token = req.query.token?.toString();
    const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
            items: true,
            payments: true,
            deliveries: true
        }
    });
    if (!order) return res.status(404).json({ error: 'Commande introuvable.' });

    const ownerAllowed = req.user?.id && order.userId === req.user.id;
    const tokenAllowed = token && order.trackingTokenHash && hashToken(token) === order.trackingTokenHash;
    const paymentApproved = order.payments.some((payment) => payment.status === 'APPROVED');
    const canView = paymentApproved && order.status === 'DELIVERED' && order.deliveries.some((delivery) => delivery.status === 'SENT') && (ownerAllowed || tokenAllowed);

    if (!canView) return res.status(403).json({ error: 'La livraison est verrouillee jusqu’a validation et envoi.' });

    await prisma.delivery.updateMany({
        where: { orderId: order.id, status: 'SENT', viewedAt: null },
        data: { status: 'VIEWED', viewedAt: new Date() }
    });
    await prisma.orderActionLog.create({
        data: {
            orderId: order.id,
            actorType: ownerAllowed ? 'USER' : 'GUEST',
            actorId: ownerAllowed ? req.user?.id : null,
            action: 'DELIVERY_VIEWED',
            ...requestMeta(req),
            metadata: { orderNumber }
        }
    });

    res.json({
        orderNumber: order.orderNumber,
        deliveries: order.deliveries
            .filter((delivery) => delivery.status === 'SENT' || delivery.status === 'VIEWED')
            .map((delivery) => ({
                id: delivery.id,
                orderItemId: delivery.orderItemId,
                status: delivery.status,
                deliveryType: delivery.deliveryType,
                deliveryContent: decryptDeliveryContent(delivery.deliveryContentEncrypted),
                activationGuide: delivery.activationGuide,
                restrictions: delivery.restrictions,
                region: delivery.region,
                sentAt: delivery.sentAt,
                viewedAt: delivery.viewedAt
            }))
    });
};
