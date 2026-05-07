import nodemailer from 'nodemailer';
import prisma from '../prisma.js';

const SITE_CONFIG_KEY = 'site';

const fallbackTransport = {
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: 'johathan.muller46@ethereal.email', pass: 'Hj7X5X1X1X1X1X1X1X' },
    from: '"Tunidex" <noreply@tunidex.tn>'
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
                from: `"${config.smtpMailerName || 'Tunidex'}" <${config.smtpEmailId}>`
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

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        const config = await readMailerConfig();
        const transporter = await createTransporter();
        const info = await transporter.sendMail({ from: config.from, to, subject, html });
        console.log("📧 Preview Email:", nodemailer.getTestMessageUrl(info));
        return info;
    } catch (e) {
        console.error("Email error:", e);
        throw e;
    }
};
