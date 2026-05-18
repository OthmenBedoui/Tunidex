import nodemailer from 'nodemailer';
import prisma from '../prisma.js';

const SITE_CONFIG_KEY = 'site';

type SendEmailOptions = {
    text?: string;
    replyTo?: string;
    messageType?: 'transactional' | 'generic';
};

export const DEFAULT_EMAIL_TEMPLATES: Record<string, { subject: string; html: string }> = {
    registrationOtp: {
        subject: 'Code de verification TuniBots',
        html: `
          <div style="font-family:Arial,sans-serif;padding:24px;color:#0f172a">
            <h2 style="margin:0 0 16px">Confirmez votre inscription</h2>
            <p>Bonjour {{username}},</p>
            <p>Utilisez ce code OTP pour confirmer votre adresse email sur TuniBots :</p>
            <div style="font-size:32px;font-weight:800;letter-spacing:8px;margin:24px 0;color:#4f46e5">{{otpCode}}</div>
            <p>Ce code expire dans {{otpExpiryMinutes}} minutes.</p>
          </div>
        `
    },
    orderInvoice: {
        subject: 'Facture TuniBots {{orderNumber}}',
        html: `
          <div style="background:#f8fafc;padding:32px 16px;font-family:Arial,sans-serif;color:#0f172a;">
            <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid #e2e8f0;">
              <div style="font-size:26px;font-weight:900;color:#0f172a;margin-bottom:10px;">TuniBots</div>
              <div style="display:inline-block;padding:6px 10px;border-radius:999px;background:#e0e7ff;color:#4338ca;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Facture de commande</div>
              <h1 style="margin:18px 0 12px;font-size:28px;line-height:1.2;">Votre commande est en cours</h1>
              <p style="margin:0 0 18px;color:#475569;font-size:15px;">Bonjour {{customerName}}, votre facture TuniBots est générée. Un de nos services support vous guidera dans votre commande et les prochaines étapes.</p>
              <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:24px 0;">
                <div style="padding:16px;border:1px solid #cbd5e1;border-radius:16px;background:#f8fafc;">
                  <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#475569;">Numéro de commande</div>
                  <div style="font-size:20px;font-weight:800;color:#0f172a;margin-top:6px;">{{orderNumber}}</div>
                </div>
                <div style="padding:16px;border:1px solid #cbd5e1;border-radius:16px;background:#f8fafc;">
                  <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#475569;">Montant total</div>
                  <div style="font-size:20px;font-weight:800;color:#0f172a;margin-top:6px;">{{totalAmount}}</div>
                </div>
              </div>
              <div style="margin-top:16px;padding:16px;border:1px solid #cbd5e1;border-radius:16px;background:#f8fafc;">
                <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#475569;">Facture TuniBots</div>
                <div style="font-size:20px;font-weight:800;color:#0f172a;margin-top:6px;">{{invoiceNumber}}</div>
                <div style="font-size:14px;color:#475569;margin-top:6px;">Date: {{invoiceDate}}</div>
                <div style="font-size:14px;color:#475569;">Statut: En cours</div>
              </div>
              <div style="margin-top:16px;padding:16px;border:1px solid #cbd5e1;border-radius:16px;background:#f8fafc;">
                <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#475569;margin-bottom:10px;">Coordonnées client</div>
                <div style="font-size:14px;color:#0f172a;line-height:1.7;">
                  <div><strong>Nom:</strong> {{customerName}}</div>
                  <div><strong>Email:</strong> {{customerEmail}}</div>
                  <div><strong>Téléphone:</strong> {{customerPhone}}</div>
                  <div><strong>Méthode de paiement choisie:</strong> {{paymentMethod}}</div>
                </div>
              </div>
              <div style="margin-top:24px;">
                <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#475569;margin-bottom:12px;">Produits achetés</div>
                <table style="width:100%;border-collapse:collapse;"><tbody>{{itemsRows}}</tbody></table>
              </div>
              <div style="margin-top:24px;padding:18px;border-radius:18px;background:#fff7ed;border:1px solid #fdba74;">
                <div style="font-weight:700;color:#9a3412;margin-bottom:8px;">Accompagnement support</div>
                <div style="font-size:14px;color:#7c2d12;">Votre facture a été générée. Un membre de notre support TuniBots vous guidera dans votre commande au {{customerPhone}}.</div>
              </div>
            </div>
          </div>
        `
    },
    testEmail: {
        subject: 'Test email TuniBots',
        html: `
          <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:28px;color:#0f172a;">
            <div style="max-width:620px;margin:auto;background:white;border:1px solid #e2e8f0;border-radius:20px;padding:28px;">
              <div style="font-size:24px;font-weight:900;margin-bottom:10px;">TuniBots</div>
              <h1 style="margin:0 0 12px;font-size:22px;">Configuration email valide</h1>
              <p style="margin:0;color:#475569;line-height:1.6;">Ce message confirme que le SMTP configuré dans le dashboard admin peut envoyer des emails.</p>
            </div>
          </div>
        `
    }
};

export const renderTemplate = (template: string, variables: Record<string, string | number | null | undefined>) =>
    template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => String(variables[key] ?? ''));

const ensureHtmlDocument = (html: string) => {
    if (/<html[\s>]/i.test(html)) {
        return html;
    }

    return [
        '<!doctype html>',
        '<html lang="fr">',
        '<head>',
        '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
        '<meta name="color-scheme" content="light only" />',
        '<meta name="supported-color-schemes" content="light only" />',
        '<title>TuniBots</title>',
        '</head>',
        `<body style="margin:0;padding:0;background:#f8fafc;">${html}</body>`,
        '</html>'
    ].join('');
};

const htmlToText = (html: string) =>
    html
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<\/(p|div|h[1-6]|tr|table|li)>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s+/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

export const getEmailTemplate = async (key: string) => {
    const record = await prisma.siteConfig.findUnique({ where: { key: SITE_CONFIG_KEY } });
    const config = record?.data as { emailTemplates?: Record<string, { subject?: string; html?: string }> } | undefined;
    const saved = config?.emailTemplates?.[key];
    const fallback = DEFAULT_EMAIL_TEMPLATES[key] || { subject: '', html: '' };
    return {
        subject: saved?.subject || fallback.subject,
        html: saved?.html || fallback.html
    };
};

const fallbackTransport = {
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: 'johathan.muller46@ethereal.email', pass: 'Hj7X5X1X1X1X1X1X1X' },
    from: '"TuniBots" <noreply@tunibots.tn>'
};

const extractEmailAddress = (value: string) => {
    const match = value.match(/<([^>]+)>/);
    return (match?.[1] || value).trim();
};

const readMailerConfig = async () => {
    try {
        const record = await prisma.siteConfig.findUnique({ where: { key: SITE_CONFIG_KEY } });
        const config = record?.data as {
            smtpHost?: string;
            smtpPort?: string;
            smtpEmailId?: string;
            smtpEncryption?: string;
            smtpUsername?: string;
            smtpPassword?: string;
            smtpMailerName?: string;
        } | undefined;

        if (config?.smtpHost && config?.smtpPort && config?.smtpEmailId) {
            return {
                host: config.smtpHost,
                port: Number(config.smtpPort),
                secure: config.smtpEncryption === 'ssl',
                auth: config.smtpUsername || config.smtpPassword ? {
                    user: config.smtpUsername || config.smtpEmailId,
                    pass: config.smtpPassword || ''
                } : undefined,
                from: `"${config.smtpMailerName || 'TuniBots'}" <${config.smtpEmailId}>`
            };
        }
    } catch (error) {
        console.warn('[email] fallback transport in use', error);
    }

    return fallbackTransport;
};

const createTransporter = async () => {
    const config = await readMailerConfig();
    return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
    });
};

export const sendEmail = async (to: string, subject: string, html: string, options: SendEmailOptions = {}) => {
    try {
        const config = await readMailerConfig();
        const transporter = await createTransporter();
        const htmlDocument = ensureHtmlDocument(html);
        const fromAddress = extractEmailAddress(config.from);
        const fromDomain = fromAddress.includes('@') ? fromAddress.split('@')[1] : 'localhost';
        const headers = options.messageType === 'transactional'
            ? {
                'X-Auto-Response-Suppress': 'All',
                'Auto-Submitted': 'auto-generated'
            }
            : undefined;
        const info = await transporter.sendMail({
            from: config.from,
            to,
            subject,
            html: htmlDocument,
            text: options.text || htmlToText(htmlDocument),
            replyTo: options.replyTo || fromAddress,
            envelope: {
                from: fromAddress,
                to
            },
            headers,
            date: new Date(),
            messageId: `<${Date.now()}.${Math.random().toString(36).slice(2)}@${fromDomain}>`
        });
        console.log('[email] sent', {
            to,
            subject,
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected,
            response: info.response,
            previewUrl: nodemailer.getTestMessageUrl(info)
        });
        return info;
    } catch (e) {
        console.error("Email error:", e);
        throw e;
    }
};
