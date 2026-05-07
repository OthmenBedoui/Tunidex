
import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { Prisma } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

const SITE_CONFIG_KEY = 'site';
const legacySiteConfigPath = path.join(process.cwd(), 'server', 'data', 'site-config.json');

type SiteConfigData = {
    logoUrl: string;
    siteName: string;
    faviconUrl: string;
    primaryColor: string;
    heroSlides: unknown[];
    heroSlideHeight: number;
    accentColor: string;
    accentHoverColor: string;
    accentSoftColor: string;
    accentTextColor: string;
    headerAnnouncement: string;
    headerSearchPlaceholder: string;
    headerCtaLabel: string;
    footerTagline: string;
    footerDescription: string;
    footerEmail: string;
    footerPhone: string;
    footerWhatsapp: string;
    footerAddress: string;
    footerCopyright: string;
    smtpMailerName: string;
    smtpHost: string;
    smtpDriver: string;
    smtpPort: string;
    smtpUsername: string;
    smtpEmailId: string;
    smtpEncryption: string;
    smtpPassword: string;
    click2payEnabled: boolean;
    click2payMerchantId: string;
    click2payApiKey: string;
};

const defaultSiteConfig: SiteConfigData = {
    logoUrl: '',
    siteName: 'Tunidex',
    faviconUrl: '',
    primaryColor: '',
    heroSlides: [],
    heroSlideHeight: 440,
    accentColor: '#4f46e5',
    accentHoverColor: '#4338ca',
    accentSoftColor: '#e0e7ff',
    accentTextColor: '#312e81',
    headerAnnouncement: 'Bienvenue sur la première plateforme digitale en Tunisie !',
    headerSearchPlaceholder: 'Rechercher jeux, items, comptes...',
    headerCtaLabel: "S'inscrire",
    footerTagline: 'Marketplace digitale premium',
    footerDescription: 'La destination premium pour vos comptes, licences, abonnements, outils IA et services digitaux en Tunisie.',
    footerEmail: 'support@tunidex.tn',
    footerPhone: '+216 00 000 000',
    footerWhatsapp: '+216 00 000 000',
    footerAddress: 'Tunis, Tunisie',
    footerCopyright: 'Tous droits réservés.',
    smtpMailerName: '',
    smtpHost: '',
    smtpDriver: 'smtp',
    smtpPort: '',
    smtpUsername: '',
    smtpEmailId: '',
    smtpEncryption: 'tls',
    smtpPassword: '',
    click2payEnabled: false,
    click2payMerchantId: '',
    click2payApiKey: ''
};

const asInputJson = (value: SiteConfigData): Prisma.InputJsonValue => {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
};

const mergeSiteConfig = (value: unknown): SiteConfigData => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return { ...defaultSiteConfig };
    }

    return {
        ...defaultSiteConfig,
        ...(value as Partial<SiteConfigData>)
    };
};

const loadInitialSiteConfig = async () => {
    try {
        const raw = await fs.readFile(legacySiteConfigPath, 'utf8');
        return mergeSiteConfig(JSON.parse(raw));
    } catch {
        return { ...defaultSiteConfig };
    }
};

const estimateBase64Size = (value: unknown) => {
    if (typeof value !== 'string' || !value.startsWith('data:')) return 0;
    const base64 = value.split(',')[1] || '';
    return Math.floor((base64.length * 3) / 4);
};

const readSiteConfig = async () => {
    const record = await prisma.siteConfig.findUnique({ where: { key: SITE_CONFIG_KEY } });

    if (record) {
        return mergeSiteConfig(record.data);
    }

    const initialConfig = await loadInitialSiteConfig();
    const created = await prisma.siteConfig.create({
        data: {
            key: SITE_CONFIG_KEY,
            data: asInputJson(initialConfig)
        }
    });

    return mergeSiteConfig(created.data);
};

const writeSiteConfig = async (config: SiteConfigData) => {
    await prisma.siteConfig.upsert({
        where: { key: SITE_CONFIG_KEY },
        create: {
            key: SITE_CONFIG_KEY,
            data: asInputJson(config)
        },
        update: {
            data: asInputJson(config)
        }
    });
};

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Administrative functions
 *   - name: Users
 *     description: User management
 *   - name: Config
 *     description: Site configuration
 */

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard statistics
 */
export const getStats = async (_req: Request, res: Response) => {
    const dailyStats = await prisma.dailyStat.findMany({ orderBy: { date: 'asc' }, take: 30 });
    const topProducts = await prisma.listing.findMany({ orderBy: { salesCount: 'desc' }, take: 5 });
    res.json({
        totalSales: (await prisma.order.aggregate({ _sum: { amount: true } }))._sum.amount || 0,
        totalOrders: await prisma.order.count(),
        totalUsers: await prisma.user.count(),
        dailyStats, topProducts
    });
};

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
export const getAllUsers = async (_req: Request, res: Response) => {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(users.map((u: { password?: string }) => { const r = { ...u }; delete r.password; return r; }));
};

/**
 * @swagger
 * /api/config:
 *   get:
 *     summary: Get site configuration
 *     tags: [Config]
 *     responses:
 *       200:
 *         description: Site configuration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SiteConfig'
 */
export const getSiteConfig = async (_req: Request, res: Response) => {
    console.log('[site-config] GET /api/config');
    res.json(await readSiteConfig());
};

/**
 * @swagger
 * /api/config:
 *   patch:
 *     summary: Update site configuration
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SiteConfig'
 *     responses:
 *       200:
 *         description: Site configuration updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SiteConfig'
 */
export const updateSiteConfig = async (req: Request, res: Response) => {
    const logoBytes = estimateBase64Size(req.body.logoUrl);
    const faviconBytes = estimateBase64Size(req.body.faviconUrl);
    console.log(
        `[site-config] PATCH /api/config keys=${Object.keys(req.body || {}).join(',')} logoBytes=${logoBytes} faviconBytes=${faviconBytes} siteName=${req.body.siteName || ''}`
    );

    const currentConfig = await readSiteConfig();
    const nextConfig = {
        ...currentConfig,
        ...req.body,
        click2payEnabled: Boolean(req.body.click2payEnabled ?? currentConfig.click2payEnabled)
    };

    await writeSiteConfig(nextConfig);
    console.log('[site-config] PATCH /api/config success');
    res.json(nextConfig);
};

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Update user role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: User role updated
 */
const sanitizeUser = <T extends { password?: string }>(user: T) => {
    const result = { ...user };
    delete result.password;
    return result;
};

export const updateUserRole = async (req: Request, res: Response) => {
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { role: req.body.role } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(sanitizeUser(user));
};

export const updateUserBalance = async (req: Request, res: Response) => {
    const balance = Number(req.body.balance);
    if (!Number.isFinite(balance)) return res.status(400).json({ error: 'Balance invalide' });

    const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { balance }
    });

    res.json(sanitizeUser(user));
};

export const getAllOrders = async (_req: Request, res: Response) => {
    const orders = await prisma.order.findMany({
        include: {
            items: true,
            invoice: true,
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

    res.json(orders.map((order) => ({
        ...order,
        buyerId: order.userId || order.id,
        buyer: order.user,
        buyerDisplayName: `${order.customerFirstName} ${order.customerLastName}`.trim()
    })));
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    const order = await prisma.order.update({
        where: { id: req.params.id },
        data: {
            status: req.body.status,
            paymentConfirmedAt: req.body.status === 'PAYMENT_RECEIVED' ? new Date() : undefined
        },
        include: {
            items: true,
            invoice: true,
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    avatarUrl: true
                }
            }
        }
    });

    res.json({
        ...order,
        buyerId: order.userId || order.id,
        buyer: order.user,
        buyerDisplayName: `${order.customerFirstName} ${order.customerLastName}`.trim()
    });
};

const variantString = (variants: Array<{ name: string; price: number; order: number }>) =>
    variants.map((variant) => `${variant.name}|${variant.price}|${variant.order}`).join('; ');

const parseVariantString = (value: unknown) => {
    if (typeof value !== 'string' || !value.trim()) return [];
    return value.split(';')
        .map((entry, index) => {
            const [name, price, order] = entry.split('|').map((part) => part?.trim());
            const parsedPrice = Number(price);
            const parsedOrder = Number(order);
            if (!name || !Number.isFinite(parsedPrice)) return null;
            return { name, price: parsedPrice, order: Number.isInteger(parsedOrder) ? parsedOrder : index + 1 };
        })
        .filter((entry): entry is { name: string; price: number; order: number } => Boolean(entry));
};

const cellText = (value: ExcelJS.CellValue) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object' && 'text' in value) return String(value.text || '').trim();
    if (typeof value === 'object' && 'result' in value) return String(value.result || '').trim();
    return String(value).trim();
};

const readSheetRows = (worksheet?: ExcelJS.Worksheet) => {
    if (!worksheet) return [];
    const headers = (worksheet.getRow(1).values as ExcelJS.CellValue[])
        .slice(1)
        .map((value) => cellText(value));
    const rows: Record<string, string>[] = [];

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const values = row.values as ExcelJS.CellValue[];
        const record: Record<string, string> = {};
        headers.forEach((header, index) => {
            record[header] = cellText(values[index + 1]);
        });
        if (Object.values(record).some(Boolean)) rows.push(record);
    });

    return rows;
};

const styleSheet = (worksheet: ExcelJS.Worksheet) => {
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } };
    worksheet.columns.forEach((column) => {
        column.width = Math.min(Math.max((column.header?.toString().length || 12) + 4, 14), 42);
    });
};

export const exportSiteData = async (_req: Request, res: Response) => {
    const [categories, subCategories, listings] = await Promise.all([
        prisma.category.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] }),
        prisma.subCategory.findMany({ include: { category: true }, orderBy: [{ order: 'asc' }, { name: 'asc' }] }),
        prisma.listing.findMany({
            include: {
                category: true,
                subCategory: true,
                variants: { orderBy: [{ order: 'asc' }, { price: 'asc' }] }
            },
            orderBy: { createdAt: 'desc' }
        })
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Tunidex Admin';
    workbook.created = new Date();

    const categorySheet = workbook.addWorksheet('Categories');
    categorySheet.columns = [
        { header: 'id', key: 'id' },
        { header: 'name', key: 'name' },
        { header: 'slug', key: 'slug' },
        { header: 'icon', key: 'icon' },
        { header: 'imageUrl', key: 'imageUrl' },
        { header: 'gradient', key: 'gradient' },
        { header: 'description', key: 'description' },
        { header: 'order', key: 'order' }
    ];
    categories.forEach((category) => categorySheet.addRow(category));
    styleSheet(categorySheet);

    const subCategorySheet = workbook.addWorksheet('SubCategories');
    subCategorySheet.columns = [
        { header: 'id', key: 'id' },
        { header: 'name', key: 'name' },
        { header: 'slug', key: 'slug' },
        { header: 'categoryId', key: 'categoryId' },
        { header: 'categorySlug', key: 'categorySlug' },
        { header: 'icon', key: 'icon' },
        { header: 'description', key: 'description' },
        { header: 'order', key: 'order' }
    ];
    subCategories.forEach((subCategory) => subCategorySheet.addRow({
        ...subCategory,
        categorySlug: subCategory.category.slug
    }));
    styleSheet(subCategorySheet);

    const productSheet = workbook.addWorksheet('Products');
    productSheet.columns = [
        { header: 'id', key: 'id' },
        { header: 'title', key: 'title' },
        { header: 'description', key: 'description' },
        { header: 'price', key: 'price' },
        { header: 'categoryId', key: 'categoryId' },
        { header: 'categorySlug', key: 'categorySlug' },
        { header: 'subCategoryId', key: 'subCategoryId' },
        { header: 'subCategorySlug', key: 'subCategorySlug' },
        { header: 'game', key: 'game' },
        { header: 'imageUrl', key: 'imageUrl' },
        { header: 'logoUrl', key: 'logoUrl' },
        { header: 'gallery', key: 'gallery' },
        { header: 'stock', key: 'stock' },
        { header: 'isInstant', key: 'isInstant' },
        { header: 'preparationTime', key: 'preparationTime' },
        { header: 'discountType', key: 'discountType' },
        { header: 'discountValue', key: 'discountValue' },
        { header: 'variantLabel', key: 'variantLabel' },
        { header: 'variants', key: 'variants' },
        { header: 'isArchived', key: 'isArchived' },
        { header: 'metaTitle', key: 'metaTitle' },
        { header: 'metaDesc', key: 'metaDesc' },
        { header: 'keywords', key: 'keywords' }
    ];
    listings.forEach((listing) => productSheet.addRow({
        ...listing,
        categorySlug: listing.category.slug,
        subCategorySlug: listing.subCategory?.slug || '',
        gallery: listing.gallery,
        variants: variantString(listing.variants)
    }));
    styleSheet(productSheet);

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="tunidex-data-${new Date().toISOString().slice(0, 10)}.xlsx"`);
    res.send(Buffer.from(buffer));
};

export const importSiteData = async (req: Request, res: Response) => {
    const rawFile = typeof req.body.fileBase64 === 'string' ? req.body.fileBase64 : '';
    if (!rawFile) return res.status(400).json({ error: 'Fichier Excel manquant.' });

    const base64 = rawFile.includes(',') ? rawFile.split(',').pop() || '' : rawFile;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(base64, 'base64'));

    const categoryRows = readSheetRows(workbook.getWorksheet('Categories'));
    const subCategoryRows = readSheetRows(workbook.getWorksheet('SubCategories'));
    const productRows = readSheetRows(workbook.getWorksheet('Products'));

    let categoriesImported = 0;
    let subCategoriesImported = 0;
    let productsImported = 0;

    for (const row of categoryRows) {
        if (!row.name || !row.slug) continue;
        await prisma.category.upsert({
            where: { slug: row.slug },
            create: {
                name: row.name,
                slug: row.slug,
                icon: row.icon || 'Package',
                imageUrl: row.imageUrl || null,
                gradient: row.gradient || null,
                description: row.description || null,
                order: Number(row.order) || 0
            },
            update: {
                name: row.name,
                icon: row.icon || 'Package',
                imageUrl: row.imageUrl || null,
                gradient: row.gradient || null,
                description: row.description || null,
                order: Number(row.order) || 0
            }
        });
        categoriesImported += 1;
    }

    for (const row of subCategoryRows) {
        if (!row.name || !row.slug) continue;
        const category = await prisma.category.findFirst({
            where: {
                OR: [
                    ...(row.categoryId ? [{ id: row.categoryId }] : []),
                    ...(row.categorySlug ? [{ slug: row.categorySlug }] : [])
                ]
            }
        });
        if (!category) continue;
        await prisma.subCategory.upsert({
            where: { slug: row.slug },
            create: {
                name: row.name,
                slug: row.slug,
                categoryId: category.id,
                icon: row.icon || 'Package',
                description: row.description || '',
                order: Number(row.order) || 0
            },
            update: {
                name: row.name,
                categoryId: category.id,
                icon: row.icon || 'Package',
                description: row.description || '',
                order: Number(row.order) || 0
            }
        });
        subCategoriesImported += 1;
    }

    for (const row of productRows) {
        if (!row.title) continue;
        const category = await prisma.category.findFirst({
            where: {
                OR: [
                    ...(row.categoryId ? [{ id: row.categoryId }] : []),
                    ...(row.categorySlug ? [{ slug: row.categorySlug }] : [])
                ]
            }
        });
        if (!category) continue;

        const subCategory = row.subCategoryId || row.subCategorySlug
            ? await prisma.subCategory.findFirst({
                where: {
                    OR: [
                        ...(row.subCategoryId ? [{ id: row.subCategoryId }] : []),
                        ...(row.subCategorySlug ? [{ slug: row.subCategorySlug }] : [])
                    ]
                }
            })
            : null;
        const variants = parseVariantString(row.variants);
        const data = {
            title: row.title,
            description: row.description || '',
            price: Number(row.price) || 0,
            categoryId: category.id,
            subCategoryId: subCategory?.id || null,
            game: row.game || null,
            imageUrl: row.imageUrl || '',
            logoUrl: row.logoUrl || null,
            gallery: row.gallery || '[]',
            stock: Number(row.stock) || 0,
            isInstant: row.isInstant ? row.isInstant.toLowerCase() !== 'false' : true,
            preparationTime: row.preparationTime || 'Immédiat',
            deliveryTimeHours: 24,
            discountType: row.discountType || 'NONE',
            discountValue: Number(row.discountValue) || 0,
            discountPercent: row.discountType === 'PERCENT' ? Number(row.discountValue) || 0 : 0,
            variantLabel: variants.length > 0 ? (row.variantLabel || 'Variante') : null,
            isArchived: row.isArchived ? row.isArchived.toLowerCase() === 'true' : false,
            metaTitle: row.metaTitle || null,
            metaDesc: row.metaDesc || null,
            keywords: row.keywords || null
        };

        const existing = row.id ? await prisma.listing.findUnique({ where: { id: row.id } }) : null;
        if (existing) {
            await prisma.listing.update({
                where: { id: existing.id },
                data: {
                    ...data,
                    variants: {
                        deleteMany: {},
                        ...(variants.length > 0 ? { create: variants } : {})
                    }
                }
            });
        } else {
            await prisma.listing.create({
                data: {
                    ...data,
                    variants: variants.length > 0 ? { create: variants } : undefined
                }
            });
        }
        productsImported += 1;
    }

    res.json({ success: true, categoriesImported, subCategoriesImported, productsImported });
};

const cleanOrders = async (tx: Prisma.TransactionClient) => {
    await tx.invoiceItem.deleteMany({});
    await tx.invoice.deleteMany({});
    await tx.payment.deleteMany({});
    await tx.loyaltyPoint.deleteMany({});
    await tx.orderItem.deleteMany({});
    await tx.order.deleteMany({});
    await tx.dailyStat.deleteMany({});
};

const cleanProducts = async (tx: Prisma.TransactionClient) => {
    await cleanOrders(tx);
    await tx.cartItem.deleteMany({});
    await tx.packageItem.deleteMany({});
    await tx.productVariant.deleteMany({});
    await tx.listing.deleteMany({});
};

const cleanCategories = async (tx: Prisma.TransactionClient) => {
    await cleanProducts(tx);
    await tx.subCategory.deleteMany({});
    await tx.category.deleteMany({});
};

export const cleanSiteData = async (req: Request, res: Response) => {
    const table = String(req.body.table || '');
    const confirmation = String(req.body.confirmation || '');
    if (confirmation !== 'CONFIRM CLEAN') {
        return res.status(400).json({ error: 'Confirmation invalide. Tapez CONFIRM CLEAN.' });
    }

    const before = {
        categories: await prisma.category.count(),
        subCategories: await prisma.subCategory.count(),
        products: await prisma.listing.count(),
        orders: await prisma.order.count(),
        users: await prisma.user.count()
    };

    await prisma.$transaction(async (tx) => {
        if (table === 'orders') {
            await cleanOrders(tx);
        } else if (table === 'products') {
            await cleanProducts(tx);
        } else if (table === 'categories') {
            await cleanCategories(tx);
        } else if (table === 'users') {
            await cleanOrders(tx);
            await tx.cartItem.deleteMany({});
            await tx.cart.deleteMany({});
            await tx.user.deleteMany({ where: { role: { notIn: ['ADMIN', 'SUB_ADMIN', 'SELLER', 'AGENT'] } } });
        } else if (table === 'all') {
            await cleanCategories(tx);
            await tx.cartItem.deleteMany({});
            await tx.cart.deleteMany({});
            await tx.sequence.deleteMany({});
            await tx.user.deleteMany({ where: { role: { notIn: ['ADMIN', 'SUB_ADMIN', 'SELLER', 'AGENT'] } } });
        } else {
            throw new Error('Table non supportée.');
        }
    });

    const after = {
        categories: await prisma.category.count(),
        subCategories: await prisma.subCategory.count(),
        products: await prisma.listing.count(),
        orders: await prisma.order.count(),
        users: await prisma.user.count()
    };

    res.json({ success: true, table, before, after });
};
