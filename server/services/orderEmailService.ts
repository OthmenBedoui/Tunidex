import prisma from '../prisma.js';
import { getEmailTemplate, renderTemplate, sendEmail } from '../utils/email.js';

type CheckoutOrderEmailPayload = {
  id: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod?: string | null;
  items: Array<{
    id: string;
    titleSnapshot: string;
    quantity: number;
    priceSnapshot: number;
  }>;
  invoice?: {
    id: string;
    invoiceNumber: string;
    issueDate: Date;
    status: string;
  } | null;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatMoney = (amount: number, currency: string) => `${amount.toFixed(2)} ${currency}`;
const formatPaymentMethod = (method?: string | null) => {
  const labels: Record<string, string> = {
    whatsapp: 'WhatsApp / support',
    edinar: 'EDINAR',
    flouci: 'Flouci',
    click2pay: 'Click2Pay',
    carte: 'Carte bancaire'
  };
  return method ? labels[method.toLowerCase()] || method : 'A confirmer';
};

const formatOrderDate = (value?: Date | null) => value ? new Date(value).toLocaleDateString('fr-FR') : '';

const buildItemsRows = (order: CheckoutOrderEmailPayload) =>
  order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;">
            ${escapeHtml(item.titleSnapshot)}
            <div style="color:#64748b;font-size:12px;margin-top:4px;">Quantité: ${item.quantity}</div>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;text-align:right;">
            ${formatMoney(item.priceSnapshot * item.quantity, order.currency)}
          </td>
        </tr>
      `
    )
    .join('');

const buildItemsText = (order: CheckoutOrderEmailPayload) =>
  order.items
    .map((item) => `- ${item.titleSnapshot} x${item.quantity}: ${formatMoney(item.priceSnapshot * item.quantity, order.currency)}`)
    .join('\n');

const buildOrderConfirmationEmail = (order: CheckoutOrderEmailPayload) => {
  const customerName = `${order.customerFirstName} ${order.customerLastName}`.trim();
  const invoiceNumber = order.invoice?.invoiceNumber || 'En attente';
  const invoiceDate = formatOrderDate(order.invoice?.issueDate);
  const paymentMethod = formatPaymentMethod(order.paymentMethod);

  return `
    <div style="margin:0;padding:24px 12px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;">
        <tr>
          <td style="padding:28px 28px 20px 28px;border-bottom:1px solid #e2e8f0;">
            <div style="font-size:24px;font-weight:700;color:#0f172a;">TuniBots</div>
            <div style="font-size:12px;color:#475569;margin-top:4px;">Facture de commande</div>
            <h1 style="margin:16px 0 8px 0;font-size:24px;line-height:1.3;color:#0f172a;">Confirmation de votre commande</h1>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#475569;">Bonjour ${escapeHtml(customerName || order.customerFirstName)}, votre facture a bien ete generee. Conservez cet email pour le suivi de votre commande.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
              <tr>
                <td width="50%" valign="top" style="padding:0 10px 14px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;">
                    <tr><td style="padding:14px;">
                      <div style="font-size:12px;color:#64748b;text-transform:uppercase;">Commande</div>
                      <div style="font-size:18px;font-weight:700;color:#0f172a;margin-top:6px;">${escapeHtml(order.orderNumber)}</div>
                    </td></tr>
                  </table>
                </td>
                <td width="50%" valign="top" style="padding:0 0 14px 10px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;">
                    <tr><td style="padding:14px;">
                      <div style="font-size:12px;color:#64748b;text-transform:uppercase;">Montant total</div>
                      <div style="font-size:18px;font-weight:700;color:#0f172a;margin-top:6px;">${formatMoney(order.amount, order.currency)}</div>
                    </td></tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td width="50%" valign="top" style="padding:0 10px 0 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;">
                    <tr><td style="padding:14px;">
                      <div style="font-size:12px;color:#64748b;text-transform:uppercase;">Facture</div>
                      <div style="font-size:18px;font-weight:700;color:#0f172a;margin-top:6px;">${escapeHtml(invoiceNumber)}</div>
                      <div style="font-size:13px;color:#475569;margin-top:6px;">Date: ${escapeHtml(invoiceDate || 'A confirmer')}</div>
                    </td></tr>
                  </table>
                </td>
                <td width="50%" valign="top" style="padding:0 0 0 10px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;">
                    <tr><td style="padding:14px;">
                      <div style="font-size:12px;color:#64748b;text-transform:uppercase;">Paiement</div>
                      <div style="font-size:18px;font-weight:700;color:#0f172a;margin-top:6px;">${escapeHtml(paymentMethod)}</div>
                      <div style="font-size:13px;color:#475569;margin-top:6px;">Statut: En cours</div>
                    </td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 20px 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e2e8f0;border-radius:12px;border-collapse:collapse;">
              <tr>
                <td colspan="2" style="padding:14px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#334155;">Coordonnees client</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:14px;color:#475569;">Nom</td>
                <td style="padding:12px 16px;font-size:14px;color:#0f172a;">${escapeHtml(customerName || order.customerFirstName)}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:14px;color:#475569;border-top:1px solid #e2e8f0;">Email</td>
                <td style="padding:12px 16px;font-size:14px;color:#0f172a;border-top:1px solid #e2e8f0;">${escapeHtml(order.customerEmail)}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:14px;color:#475569;border-top:1px solid #e2e8f0;">Telephone</td>
                <td style="padding:12px 16px;font-size:14px;color:#0f172a;border-top:1px solid #e2e8f0;">${escapeHtml(order.customerPhone)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 20px 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e2e8f0;border-radius:12px;border-collapse:collapse;">
              <tr>
                <td colspan="2" style="padding:14px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#334155;">Produits</td>
              </tr>
              ${buildItemsRows(order)}
              <tr>
                <td style="padding:14px 16px;font-size:14px;font-weight:700;color:#0f172a;border-top:1px solid #e2e8f0;">Total</td>
                <td style="padding:14px 16px;font-size:14px;font-weight:700;color:#0f172a;text-align:right;border-top:1px solid #e2e8f0;">${formatMoney(order.amount, order.currency)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 28px 28px;">
            <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b;">Cet email est un message transactionnel envoye automatiquement apres validation de votre commande. Si vous avez besoin d'aide, repondez simplement a cet email.</p>
          </td>
        </tr>
      </table>
    </div>
  `;
};

const buildOrderConfirmationText = (order: CheckoutOrderEmailPayload) => {
  const customerName = `${order.customerFirstName} ${order.customerLastName}`.trim() || order.customerFirstName;
  const invoiceNumber = order.invoice?.invoiceNumber || 'En attente';
  const invoiceDate = formatOrderDate(order.invoice?.issueDate) || 'A confirmer';

  return [
    `Bonjour ${customerName},`,
    '',
    'Votre facture TuniBots a ete generee.',
    `Commande: ${order.orderNumber}`,
    `Facture: ${invoiceNumber}`,
    `Date: ${invoiceDate}`,
    `Montant total: ${formatMoney(order.amount, order.currency)}`,
    `Paiement: ${formatPaymentMethod(order.paymentMethod)}`,
    '',
    'Produits:',
    buildItemsText(order),
    '',
    `Email client: ${order.customerEmail}`,
    `Telephone client: ${order.customerPhone}`,
    '',
    'Conservez cet email pour le suivi de votre commande.'
  ].join('\n');
};

const buildOrderTemplateVariables = (order: CheckoutOrderEmailPayload) => {
  const customerName = `${order.customerFirstName} ${order.customerLastName}`.trim() || order.customerFirstName;
  return {
    orderNumber: order.orderNumber,
    invoiceNumber: order.invoice?.invoiceNumber || '',
    invoiceDate: order.invoice?.issueDate ? new Date(order.invoice.issueDate).toLocaleDateString('fr-FR') : '',
    customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    paymentMethod: formatPaymentMethod(order.paymentMethod),
    totalAmount: formatMoney(order.amount, order.currency),
    amount: order.amount.toFixed(2),
    currency: order.currency,
    itemsRows: buildItemsRows(order)
  };
};

export const sendOrderConfirmationEmail = async (order: CheckoutOrderEmailPayload) => {
  try {
    const template = await getEmailTemplate('orderInvoice');
    const variables = buildOrderTemplateVariables(order);
    const html = buildOrderConfirmationEmail(order);
    await sendEmail(
      order.customerEmail,
      renderTemplate(template.subject, variables),
      html,
      {
        text: buildOrderConfirmationText(order),
        messageType: 'transactional'
      }
    );

    const now = new Date();
    await prisma.order.update({
      where: { id: order.id },
      data: {
        emailStatus: 'SENT',
        emailSentAt: now,
        emailError: null
      }
    });

    if (order.invoice?.id) {
      await prisma.invoice.update({
        where: { id: order.invoice.id },
        data: {
          emailSentAt: now,
          emailError: null
        }
      });
    }
    return { status: 'SENT', error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SMTP send failed';
    await prisma.order.update({
      where: { id: order.id },
      data: {
        emailStatus: 'FAILED',
        emailError: message
      }
    });

    if (order.invoice?.id) {
      await prisma.invoice.update({
        where: { id: order.invoice.id },
        data: { emailError: message }
      });
    }

    console.error('[checkout-email] send failed', { orderId: order.id, message });
    return { status: 'FAILED', error: message };
  }
};

export const resendOrderConfirmationEmail = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      invoice: true
    }
  });

  if (!order) {
    throw new Error('Commande introuvable.');
  }

  return sendOrderConfirmationEmail(order);
};
