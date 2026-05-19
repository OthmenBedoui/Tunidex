import prisma from '../prisma.js';

const STATUS_LABELS: Record<string, string> = {
  DRAFT_CART: 'Panier brouillon',
  IN_PROGRESS: 'En cours',
  DELIVERED: 'Livree',
  REGISTERED: 'Enregistree',
  PENDING_PAYMENT: 'Paiement en attente',
  PAYMENT_UNDER_REVIEW: 'Paiement en verification',
  PAYMENT_APPROVED: 'Paiement approuve',
  PAYMENT_REJECTED: 'Paiement rejete',
  IN_DELIVERY: 'En livraison',
  PAYMENT_RECEIVED: 'Paiement recu',
  COMPLETED: 'Terminee',
  CANCELLED: 'Annulee',
  REFUNDED: 'Remboursee'
};

const buildStatusNotificationContent = (orderNumber: string, status: string, previousStatus?: string | null) => {
  const currentLabel = STATUS_LABELS[status] || status;
  const previousLabel = previousStatus ? (STATUS_LABELS[previousStatus] || previousStatus) : null;

  switch (status) {
    case 'PAYMENT_UNDER_REVIEW':
      return {
        type: 'ORDER_STATUS',
        title: 'Commande enregistree',
        message: `Votre commande ${orderNumber} a bien ete enregistree et votre paiement est en cours de verification.`
      };
    case 'PAYMENT_APPROVED':
      return {
        type: 'ORDER_STATUS',
        title: 'Paiement approuve',
        message: `Le paiement de votre commande ${orderNumber} a ete approuve. Preparation en cours.`
      };
    case 'PAYMENT_REJECTED':
      return {
        type: 'ORDER_STATUS',
        title: 'Paiement rejete',
        message: `Le paiement de votre commande ${orderNumber} a ete rejete. Veuillez verifier vos informations et recontacter le support si besoin.`
      };
    case 'IN_DELIVERY':
      return {
        type: 'ORDER_STATUS',
        title: 'Livraison en preparation',
        message: `Votre commande ${orderNumber} est en cours de preparation pour la livraison.`
      };
    case 'DELIVERED':
      return {
        type: 'ORDER_STATUS',
        title: 'Commande livree',
        message: `Votre commande ${orderNumber} a ete livree. Consultez votre espace client pour voir le contenu.`
      };
    case 'COMPLETED':
      return {
        type: 'ORDER_STATUS',
        title: 'Commande terminee',
        message: `Votre commande ${orderNumber} est terminee. Merci pour votre confiance.`
      };
    case 'CANCELLED':
      return {
        type: 'ORDER_STATUS',
        title: 'Commande annulee',
        message: `Votre commande ${orderNumber} a ete annulee.`
      };
    case 'REFUNDED':
      return {
        type: 'ORDER_STATUS',
        title: 'Commande remboursee',
        message: `Votre commande ${orderNumber} a ete remboursee.`
      };
    default:
      return {
        type: 'ORDER_STATUS',
        title: 'Statut de commande mis a jour',
        message: previousLabel
          ? `Votre commande ${orderNumber} est passee de "${previousLabel}" a "${currentLabel}".`
          : `Le statut de votre commande ${orderNumber} est maintenant "${currentLabel}".`
      };
  }
};

export const serializeClientNotification = (notification: {
  id: string;
  userId: string;
  orderId: string | null;
  type: string;
  title: string;
  message: string;
  metadata: unknown;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  order?: { orderNumber: string; status: string } | null;
}) => ({
  id: notification.id,
  userId: notification.userId,
  orderId: notification.orderId,
  orderNumber: notification.order?.orderNumber || null,
  orderStatus: notification.order?.status || null,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  metadata: notification.metadata as Record<string, unknown> | null,
  read: Boolean(notification.readAt),
  readAt: notification.readAt?.toISOString() || null,
  createdAt: notification.createdAt.toISOString(),
  updatedAt: notification.updatedAt.toISOString()
});

export const createClientNotification = async (params: {
  userId: string;
  orderId?: string | null;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}) => prisma.clientNotification.create({
  data: {
    userId: params.userId,
    orderId: params.orderId || null,
    type: params.type,
    title: params.title,
    message: params.message,
    metadata: params.metadata
  }
});

export const notifyClientOrderStatus = async (params: {
  orderId: string;
  status: string;
  previousStatus?: string | null;
}) => {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    select: {
      id: true,
      orderNumber: true,
      userId: true
    }
  });

  if (!order?.userId) return null;

  const content = buildStatusNotificationContent(order.orderNumber, params.status, params.previousStatus);
  return createClientNotification({
    userId: order.userId,
    orderId: order.id,
    type: content.type,
    title: content.title,
    message: content.message,
    metadata: {
      status: params.status,
      previousStatus: params.previousStatus || null
    }
  });
};

export const sendCustomClientNotification = async (params: {
  title: string;
  message: string;
  targetUserIds?: string[];
  actorId?: string | null;
}) => {
  const candidateUsers = params.targetUserIds?.length
    ? await prisma.user.findMany({
        where: { id: { in: params.targetUserIds } },
        select: { id: true }
      })
    : await prisma.user.findMany({
        where: { role: 'CLIENT' },
        select: { id: true }
      });

  if (candidateUsers.length === 0) {
    return { recipients: 0 };
  }

  await prisma.clientNotification.createMany({
    data: candidateUsers.map((user) => ({
      userId: user.id,
      type: 'CUSTOM',
      title: params.title,
      message: params.message,
      metadata: params.actorId ? { actorId: params.actorId } : undefined
    }))
  });

  return { recipients: candidateUsers.length };
};
