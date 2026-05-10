import { SiteConfig, StoreSectionConfig } from '../types';

export type StoreSectionDefinition = {
  id: string;
  label: string;
  description: string;
  icon: string;
  defaultEnabled: boolean;
  order: number;
  phase: 'active' | 'ready';
};

export const STORE_SECTION_DEFINITIONS: StoreSectionDefinition[] = [
  {
    id: 'store-cover',
    label: 'Store cover',
    description: 'Grande cover produit juste sous le menu principal.',
    icon: 'PanelTop',
    defaultEnabled: true,
    order: 10,
    phase: 'active'
  },
  {
    id: 'hero-slider',
    label: 'Hero slider',
    description: 'Bannière principale avec slides, CTA, image ou vidéo.',
    icon: 'Images',
    defaultEnabled: true,
    order: 20,
    phase: 'active'
  },
  {
    id: 'floating-brand-cards',
    label: 'Cartes flottantes',
    description: 'Cartes partenaires flottantes sous le hero carousel.',
    icon: 'Badge',
    defaultEnabled: true,
    order: 25,
    phase: 'active'
  },
  {
    id: 'collections',
    label: 'Collections',
    description: 'Grille des catégories principales du store.',
    icon: 'LayoutGrid',
    defaultEnabled: true,
    order: 30,
    phase: 'active'
  },
  {
    id: 'packages',
    label: 'Packages',
    description: 'Rail horizontal des offres bundle/package.',
    icon: 'Package',
    defaultEnabled: true,
    order: 40,
    phase: 'active'
  },
  {
    id: 'top-products',
    label: 'Top products',
    description: 'Rail des produits les plus vendus ou les plus importants.',
    icon: 'Trophy',
    defaultEnabled: true,
    order: 50,
    phase: 'ready'
  },
  {
    id: 'gift-cards',
    label: 'Gift cards',
    description: 'Section dédiée aux cartes cadeau et crédits prépayés.',
    icon: 'Gift',
    defaultEnabled: true,
    order: 60,
    phase: 'ready'
  },
  {
    id: 'trending',
    label: 'Tendances',
    description: 'Rail horizontal des offres mises en avant.',
    icon: 'Flame',
    defaultEnabled: true,
    order: 70,
    phase: 'active'
  },
  {
    id: 'discounts',
    label: 'Promotions',
    description: 'Section des produits avec remise active.',
    icon: 'BadgePercent',
    defaultEnabled: true,
    order: 80,
    phase: 'active'
  },
  {
    id: 'trust-badges',
    label: 'Trust badges',
    description: 'Bloc rassurance: livraison, paiement sécurisé, support.',
    icon: 'ShieldCheck',
    defaultEnabled: true,
    order: 90,
    phase: 'active'
  }
];

export const buildDefaultStoreSections = (): StoreSectionConfig[] =>
  STORE_SECTION_DEFINITIONS.map((section) => ({
    id: section.id,
    enabled: section.defaultEnabled,
    order: section.order
  }));

export const getMergedStoreSections = (siteConfig: Pick<SiteConfig, 'storeSections'>): StoreSectionConfig[] => {
  const configured = Array.isArray(siteConfig.storeSections) ? siteConfig.storeSections : [];

  return STORE_SECTION_DEFINITIONS.map((definition) => {
    const saved = configured.find((section) => section.id === definition.id);
    return {
      id: definition.id,
      enabled: saved?.enabled ?? definition.defaultEnabled,
      order: saved?.order ?? definition.order
    };
  }).sort((a, b) => (a.order || 0) - (b.order || 0));
};

export const isStoreSectionEnabled = (siteConfig: Pick<SiteConfig, 'storeSections'>, sectionId: string) => {
  const section = getMergedStoreSections(siteConfig).find((item) => item.id === sectionId);
  return section?.enabled ?? true;
};
