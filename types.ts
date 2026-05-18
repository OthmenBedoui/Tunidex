export enum UserRole {
  GUEST = 'GUEST',
  CLIENT = 'CLIENT',
  SELLER = 'SELLER',
  SUB_ADMIN = 'SUB_ADMIN',
  ADMIN = 'ADMIN'
}

export enum SubscriptionTier {
  FREE = 'Free',
  PRO = 'Pro',
  ELITE = 'Elite'
}

export enum OrderStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  DELIVERED = 'DELIVERED',
  REGISTERED = 'REGISTERED',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum ProductType {
  STANDARD = 'STANDARD',
  LOGIN_CREDENTIALS = 'LOGIN_CREDENTIALS',
  KEY = 'KEY'
}

export enum DiscountType {
  NONE = 'NONE',
  PERCENT = 'PERCENT',
  AMOUNT = 'AMOUNT'
}

export interface LoginCredential {
  id: string;
  username: string;
  password?: string;
  isUsed: boolean;
  assignedToOrderId?: string;
  createdAt: string;
}

export interface PackageItem {
  id?: string;
  packageListingId?: string;
  includedListingId: string;
  quantity: number;
  includedListing?: Listing;
}

export interface ProductVariant {
  id?: string;
  listingId?: string;
  name: string;
  price: number;
  order?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string; // e.g., 'software-apps'
  icon: string; // Lucide icon name string
  imageUrl?: string; // Hero background
  gradient?: string; // CSS class for hero
  description?: string;
  order?: number;
  subCategories?: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  icon?: string; // Lucide icon name, image URL, or uploaded data URL
  description?: string;
  order?: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  balance: number;
  avatarUrl: string;
  subscriptionTier: SubscriptionTier;
  emailVerified?: boolean;
  // Profile Fields
  fullName?: string;
  address?: string;
  phone?: string;
  paymentMethod?: string;
  whatsappNumber?: string;
  whatsappBotId?: string;
  whatsappOptIn?: boolean;
  whatsappWelcomeStatus?: 'NOT_REQUESTED' | 'PENDING' | 'PENDING_CONFIGURATION' | 'SENT' | 'FAILED';
  whatsappWelcomeSentAt?: string;
  whatsappWelcomeError?: string;
  createdAt?: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  isArchived?: boolean;
  isPackage?: boolean;
  variantLabel?: string;
  discountPercent?: number;
  discountType?: DiscountType;
  discountValue?: number;
  
  // Relations
  categoryId: string;
  category?: Category;
  subCategoryId?: string;
  subCategory?: SubCategory;

  // Images
  logoUrl?: string; // The specific brand logo (e.g. Netflix logo)
  imageUrl?: string; // The main thumbnail. Packages can use included product images.
  cardTemplate?: string;
  gallery: string[]; // Array of image URLs

  // Meta
  game?: string; // Keep for legacy/search (e.g. "Valorant")
  platform?: string;
  region?: string;
  activationCountry?: string;
  source?: string;
  activationGuideTitle?: string;
  activationGuideContent?: string;
  restrictionsTitle?: string;
  restrictionsContent?: string;
  regionTitle?: string;
  regionContent?: string;
  systemRequirementsEnabled?: boolean;
  systemRequirementsPlatform?: string;
  minimumOs?: string;
  minimumMemory?: string;
  minimumStorage?: string;
  minimumProcessor?: string;
  minimumGraphics?: string;
  recommendedOs?: string;
  recommendedMemory?: string;
  recommendedStorage?: string;
  recommendedProcessor?: string;
  recommendedGraphics?: string;
  stock: number;
  deliveryTimeHours: number;
  isInstant: boolean;
  preparationTime?: string;
  metaTitle?: string;
  metaDesc?: string;
  keywords?: string;
  salesCount?: number;

  // Product Key Management
  productType: ProductType;
  credentials?: LoginCredential[]; // Pool of logins/passwords
  staticKey?: string; // A single key for all buyers
  packageItems?: PackageItem[];
  variants?: ProductVariant[];
}

export interface SiteConfig {
  logoUrl: string;
  siteName: string;
  logoSize?: number;
  faviconUrl?: string;
  primaryColor?: string;
  heroSlides?: HeroSlide[];
  heroPromoBanners?: HeroPromoBanner[];
  floatingBrandCards?: FloatingBrandCard[];
  heroSlideHeight?: number;
  coverBackgroundUrl?: string;
  coverListingIds?: string[];
  storeSections?: StoreSectionConfig[];
  accentColor?: string;
  accentHoverColor?: string;
  accentSoftColor?: string;
  accentTextColor?: string;
  fontFamily?: string;
  customFonts?: CustomFont[];
  headerAnnouncement?: string;
  headerSearchPlaceholder?: string;
  headerCtaLabel?: string;
  footerTagline?: string;
  footerDescription?: string;
  footerEmail?: string;
  footerPhone?: string;
  footerWhatsapp?: string;
  footerAddress?: string;
  footerCopyright?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  seoCanonicalUrl?: string;
  seoOgImageUrl?: string;
  seoRobots?: string;
  seoSitemapEnabled?: boolean;
  seoOrganizationName?: string;
  seoGoogleAnalyticsId?: string;
  seoGoogleAdsConversionId?: string;
  seoFacebookPixelId?: string;
  // SMTP Configuration
  smtpMailerName?: string;
  smtpHost?: string;
  smtpDriver?: string;
  smtpPort?: string;
  smtpUsername?: string;
  smtpEmailId?: string;
  smtpEncryption?: string;
  smtpPassword?: string;
  emailTemplates?: Record<string, { subject: string; html: string }>;
  adminNotificationsEnabled?: boolean;
  adminNotificationSound?: boolean;
  adminNotificationPollSeconds?: number;
  whatsappNotificationsEnabled?: boolean;
  whatsappNotificationWebhookUrl?: string;
  telegramNotificationsEnabled?: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
  messengerNotificationsEnabled?: boolean;
  messengerNotificationWebhookUrl?: string;
  // Payment Gateway: Click2pay
  click2payEnabled?: boolean;
  click2payMerchantId?: string;
  click2payApiKey?: string;
  authProviders?: Record<string, { enabled: boolean; lastUpdatedAt?: string }>;
}

export type AuthProviderKey =
  | 'email-password'
  | 'google'
  | 'facebook'
  | 'apple'
  | 'discord'
  | 'github'
  | 'microsoft';

export type AuthProviderFieldKind = 'text' | 'password' | 'url' | 'textarea';

export interface AuthProviderField {
  key: string;
  envName: string;
  label: string;
  description?: string;
  value: string;
  displayValue: string;
  maskedValue?: string;
  required: boolean;
  secret: boolean;
  multiline?: boolean;
  kind: AuthProviderFieldKind;
  configured: boolean;
}

export interface AuthProviderConfig {
  key: AuthProviderKey;
  name: string;
  description: string;
  supported: boolean;
  enabled: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  configured: boolean;
  environmentStatus: 'CONFIGURED' | 'MISSING_CREDENTIALS';
  lastUpdatedAt?: string;
  fields: AuthProviderField[];
}

export interface PublicAuthProvider {
  key: AuthProviderKey;
  name: string;
  description: string;
  authUrl: string;
}

export interface CustomFont {
  id: string;
  name: string;
  family: string;
  dataUrl: string;
  format: string;
}

export interface StoreSectionConfig {
  id: string;
  enabled: boolean;
  order?: number;
}

export interface HeroSlide {
  id: string;
  imageUrl: string;
  mediaType?: 'image' | 'video';
  badge?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  linkType?: 'listing' | 'category' | 'url' | 'collections';
  linkTarget?: string;
}

export interface HeroPromoBanner {
  id: string;
  imageUrl: string;
  alt?: string;
  linkType?: 'listing' | 'category' | 'url' | 'collections';
  linkTarget?: string;
}

export interface FloatingBrandCard {
  id: string;
  name: string;
  imageUrl: string;
  linkType?: 'listing' | 'category' | 'url' | 'collections';
  linkTarget?: string;
}

export interface CartItem {
  id: string;
  listingId: string;
  variantId?: string;
  variant?: ProductVariant;
  quantity: number;
  listing: Listing;
}

export interface OrderItem {
  id: string;
  listingId: string;
  quantity: number;
  priceSnapshot: number;
  titleSnapshot: string;
  variantId?: string;
  variantSnapshot?: string;
  deliveredContent?: string; // The login/pass or key delivered to the customer
}

export interface InvoiceItem {
  id: string;
  listingId?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  titleSnapshot: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  issueDate: string;
  totalAmount: number;
  items?: InvoiceItem[];
}

export interface GuestCheckoutPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  paymentMethod?: string;
  items: Array<{
    listingId: string;
    variantId?: string;
    quantity: number;
  }>;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string; // Mapped from userId in backend
  buyer?: Pick<User, 'id' | 'username' | 'email' | 'avatarUrl'>;
  buyerDisplayName?: string;
  items: OrderItem[];
  status: OrderStatus;
  amount: number;
  currency?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod?: string;
  emailStatus?: string;
  emailError?: string | null;
  invoice?: Invoice | null;
  createdAt: string;
  updatedAt: string;
}
