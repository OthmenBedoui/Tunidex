import prisma from '../prisma.js';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

const SITE_CONFIG_KEY = 'site';
const legacySiteConfigPath = path.join(process.cwd(), 'server', 'data', 'site-config.json');

const defaultSiteConfig = {
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

const asInputJson = (value: unknown): Prisma.InputJsonValue => {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
};

const seedSiteConfig = async () => {
  const existing = await prisma.siteConfig.findUnique({ where: { key: SITE_CONFIG_KEY } });
  if (existing) return;

  let config: unknown = defaultSiteConfig;

  try {
    const raw = await fs.readFile(legacySiteConfigPath, 'utf8');
    config = {
      ...defaultSiteConfig,
      ...JSON.parse(raw)
    };
    console.log('⚙️ Migration configuration site JSON -> PostgreSQL...');
  } catch {
    console.log('⚙️ Création configuration site par défaut...');
  }

  await prisma.siteConfig.create({
    data: {
      key: SITE_CONFIG_KEY,
      data: asInputJson(config)
    }
  });
};

export const seedDatabase = async () => {
  try {
    await seedSiteConfig();

    const hashedPwd = await bcrypt.hash("123456", 10);
    const ensureStaffAccount = async ({
      email,
      username,
      role,
      subscriptionTier,
      avatarUrl
    }: {
      email: string;
      username: string;
      role: string;
      subscriptionTier: string;
      avatarUrl: string;
    }) => {
      const existing = await prisma.user.findUnique({ where: { email } });

      if (!existing) {
        console.log(`🛠️ Création ${role} (${email})...`);
        await prisma.user.create({
          data: {
            email,
            username,
            password: hashedPwd,
            role,
            subscriptionTier,
            avatarUrl,
            emailVerified: true,
            emailVerificationCode: null,
            emailVerificationExpiresAt: null
          }
        });
        return;
      }

      // Staff accounts must remain usable even when SMTP/OTP is not configured yet.
      await prisma.user.update({
        where: { email },
        data: {
          username,
          role,
          subscriptionTier,
          avatarUrl,
          emailVerified: true,
          emailVerificationCode: null,
          emailVerificationExpiresAt: null
        }
      });
    };

    // 1. Users (Admin & Agent)
    await ensureStaffAccount({
      email: "johnson67377@gmail.com",
      username: "UserAdmin",
      role: "ADMIN",
      subscriptionTier: "Elite",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=User"
    });
    await ensureStaffAccount({
      email: "admin@tunidex.tn",
      username: "SuperAdmin",
      role: "ADMIN",
      subscriptionTier: "Elite",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
    });
    await ensureStaffAccount({
      email: "agent@tunidex.tn",
      username: "SupportAgent",
      role: "AGENT",
      subscriptionTier: "Pro",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Agent"
    });

    // 2. Categories & SubCategories
    if (await prisma.category.count() === 0) {
        console.log("📦 Création Catégories & Sous-catégories...");
        const categoriesData = [
            { name: 'Monnaie Jeu', slug: 'game-coins', icon: 'Coins', gradient: 'bg-gradient-to-r from-yellow-500 to-amber-600', imageUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&q=80', description: 'Gold, Credits, Coins & Tokens', order: 1 },
            { name: 'Comptes', slug: 'accounts', icon: 'User', gradient: 'bg-gradient-to-r from-blue-600 to-indigo-700', imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80', description: 'Comptes Haut Niveau & Smurfs', order: 2 },
            { name: 'Software & Apps', slug: 'software', icon: 'MonitorPlay', gradient: 'bg-gradient-to-r from-cyan-600 to-blue-700', imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80', description: 'Windows, Office, Adobe, VPNs', order: 3 },
            { name: 'IA & Tools', slug: 'ai-tools', icon: 'Bot', gradient: 'bg-gradient-to-r from-violet-600 to-purple-700', imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80', description: 'ChatGPT, Gemini, Midjourney', order: 4 },
            { name: 'Streaming', slug: 'streaming', icon: 'PlayCircle', gradient: 'bg-gradient-to-r from-red-600 to-rose-700', imageUrl: 'https://images.unsplash.com/photo-1522869635100-1f4d0684d91f?auto=format&fit=crop&q=80', description: 'Netflix, Spotify, IPTV', order: 5 }
        ];
        
        for (const cat of categoriesData) { await prisma.category.create({ data: cat }); }
        
        // --- SEEDING SUB-CATEGORIES ---
        
        // 1. Software
        const softCat = await prisma.category.findUnique({ where: { slug: 'software' } });
        if(softCat) {
            await prisma.subCategory.createMany({ 
                data: [
                    {name:'Comptes & Sécurité', slug:'comptes', categoryId:softCat.id, icon: 'Shield', description: 'VPN, Antivirus et Comptes sécurisés', order: 1}, 
                    {name:'Licences Officielles', slug:'licences', categoryId:softCat.id, icon: 'Key', description: 'Clés Windows, Office, IDM', order: 2}, 
                    {name:'Boost Réseaux Sociaux', slug:'platforme', categoryId:softCat.id, icon: 'Globe', description: 'Followers, Likes, Vues', order: 3}
                ] 
            });
        }

        // 2. AI & Tools
        const aiCat = await prisma.category.findUnique({ where: { slug: 'ai-tools' } });
        if(aiCat) {
            await prisma.subCategory.createMany({ 
                data: [
                    {name:'Chatbots & Assistants', slug:'chatbots', categoryId:aiCat.id, icon: 'Bot', description: 'ChatGPT Plus, Gemini Advanced, Claude', order: 1}, 
                    {name:'Génération d\'Images', slug:'image-gen', categoryId:aiCat.id, icon: 'Sparkles', description: 'Midjourney, DALL-E, Leonardo AI', order: 2}, 
                    {name:'Outils Développeurs', slug:'dev-tools', categoryId:aiCat.id, icon: 'Code', description: 'GitHub Copilot, JetBrains AI', order: 3}, 
                    {name:'Productivité', slug:'productivity', categoryId:aiCat.id, icon: 'BrainCircuit', description: 'Notion AI, Jasper, Copy.ai', order: 4}
                ] 
            });
        }
    }

    // 3. Listings (Produits) - Removed for clean state
    console.log("🚀 Catalogue prêt pour nouveaux produits.");

    // 4. Analytics - Removed for clean state
    console.log('✅ Base de données prête !');
  } catch (e) { console.error("❌ Erreur seeding:", e); }
};
