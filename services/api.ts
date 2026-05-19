import { Listing, Order, OrderStatus, User, UserRole, SubscriptionTier, Category, SubCategory, CartItem, SiteConfig, GuestCheckoutPayload, AuthProviderConfig, AuthProviderKey, PublicAuthProvider, ClientNotification } from '../types';

const API_URL = '/api';

async function fetchWithFallback<T>(input: RequestInfo, init?: RequestInit, fallbackData?: T): Promise<T> {
  try {
    const res = await fetch(input, init);
    if (!res.ok) {
      let message = res.statusText;
      try {
        const errorBody = await res.json();
        message = errorBody.error || errorBody.message || message;
      } catch {
        // Keep the HTTP status text when the response is not JSON.
      }
      throw new Error(message);
    }
    return await res.json();
  } catch (error) {
    console.warn(`API Fail: ${input}`, error);
    if (fallbackData) return fallbackData;
    throw error;
  }
}

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export type SeoAnalytics = {
  totalVisits: number;
  uniqueVisitors: number;
  dailyVisits: Array<{ date: string; visits: number; productViews: number; categoryViews: number }>;
  topCategories: Array<{ id: string | null; name: string; slug: string; views: number }>;
  topProducts: Array<{ id: string | null; title: string; imageUrl: string; categoryName: string; views: number }>;
};

export const api = {
  // Auth
  login: (email: string, password: string) => fetchWithFallback(`${API_URL}/auth/login`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email, password}) }),
  register: (data: {
    email: string;
    password: string;
    username: string;
    fullName: string;
    address: string;
    phone: string;
    paymentMethod?: string;
    whatsappNumber?: string;
    whatsappBotId?: string;
    whatsappOptIn?: boolean;
  }) => fetchWithFallback<{ verificationRequired: boolean; email: string; message: string }>(`${API_URL}/auth/register`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }),
  verifyRegistrationOtp: (email: string, otp: string) => fetchWithFallback<{ token: string; user: User }>(`${API_URL}/auth/register/verify-otp`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email, otp }) }),
  resendRegistrationOtp: (email: string) => fetchWithFallback<{ success: boolean; message: string }>(`${API_URL}/auth/register/resend-otp`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email }) }),
  getCurrentUser: () => fetchWithFallback<User>(`${API_URL}/auth/me`, { headers: getHeaders() }),
  getPublicAuthProviders: () => fetchWithFallback<PublicAuthProvider[]>(`${API_URL}/auth/providers`, undefined, []),
  
  // Profile & Subscription
  updateProfile: (data: { username: string, avatarUrl?: string, password?: string, fullName?: string, address?: string, phone?: string, paymentMethod?: string, whatsappNumber?: string }) => 
      fetchWithFallback<User>(`${API_URL}/users/profile`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data) }),
  requestEmailChange: (newEmail: string) =>
      fetchWithFallback<{ success: boolean; message: string }>(`${API_URL}/users/email-change/request`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ newEmail }) }),
  confirmEmailChange: (newEmail: string, otp: string) =>
      fetchWithFallback<User>(`${API_URL}/users/email-change/confirm`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ newEmail, otp }) }),
  deleteAccount: (confirmation: string) =>
      fetchWithFallback<{ success: boolean }>(`${API_URL}/users/me`, { method: 'DELETE', headers: getHeaders(), body: JSON.stringify({ confirmation }) }),
  sendVerificationEmail: () => fetchWithFallback(`${API_URL}/auth/verify-email`, { method: 'POST', headers: getHeaders() }),
  updateSubscription: (data: {
    tier: SubscriptionTier;
    fullName: string;
    address: string;
    phone: string;
    paymentMethod: string;
  }) => fetchWithFallback<User>(`${API_URL}/users/subscribe`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }),

  // Cart & Checkout
  getCart: () => fetchWithFallback<CartItem[]>(`${API_URL}/cart`, { headers: getHeaders() }, []),
  addToCart: (listingId: string, variantId?: string) => fetchWithFallback(`${API_URL}/cart`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({listingId, variantId}) }),
  removeFromCart: (itemId: string) => fetchWithFallback(`${API_URL}/cart/${itemId}`, { method: 'DELETE', headers: getHeaders() }),
  checkout: (data?: { paymentMethod?: string; phone?: string }) => fetchWithFallback<Order>(`${API_URL}/checkout`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data || {}) }),
  guestCheckout: (data: GuestCheckoutPayload) => fetchWithFallback<Order>(`${API_URL}/checkout/guest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  confirmCheckout: (data: GuestCheckoutPayload | (Partial<GuestCheckoutPayload> & { phone?: string }), idempotencyKey: string) => fetchWithFallback<Order>(`${API_URL}/checkout/confirm`, {
    method: 'POST',
    headers: { ...getHeaders(), 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ ...data, idempotencyKey })
  }),

  // Categories
  getCategories: () => fetchWithFallback<Category[]>(`${API_URL}/categories`, undefined, []),
  createCategory: (data: Partial<Category>) => fetchWithFallback(`${API_URL}/categories`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }),
  updateCategory: (id: string, data: Partial<Category>) => fetchWithFallback(`${API_URL}/categories/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data) }),
  deleteCategory: (id: string) => fetchWithFallback(`${API_URL}/categories/${id}`, { method: 'DELETE', headers: getHeaders() }),
  
  createSubCategory: (data: Partial<SubCategory>) => fetchWithFallback(`${API_URL}/subcategories`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }),
  updateSubCategory: (id: string, data: Partial<SubCategory>) => fetchWithFallback(`${API_URL}/subcategories/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data) }),
  deleteSubCategory: (id: string) => fetchWithFallback(`${API_URL}/subcategories/${id}`, { method: 'DELETE', headers: getHeaders() }),
  
  // Listings
  getListings: () => fetchWithFallback<Listing[]>(`${API_URL}/listings`, { headers: getHeaders() }, []),
  createListing: (listing: Partial<Listing>) => fetchWithFallback(`${API_URL}/listings`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(listing) }),
  updateListing: (id: string, listing: Partial<Listing>) => fetchWithFallback(`${API_URL}/listings/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(listing) }),
  deleteListing: (id: string) => fetchWithFallback<{ success: boolean; archived?: boolean; message?: string }>(`${API_URL}/listings/${id}`, { method: 'DELETE', headers: getHeaders() }),

  // Orders
  getMyOrders: () => fetchWithFallback<Order[]>(`${API_URL}/orders/my`, { headers: getHeaders() }, []),
  getMyNotifications: () => fetchWithFallback<ClientNotification[]>(`${API_URL}/users/me/notifications`, { headers: getHeaders() }, []),
  markNotificationRead: (notificationId: string) => fetchWithFallback<ClientNotification>(`${API_URL}/users/me/notifications/${notificationId}/read`, { method: 'PATCH', headers: getHeaders() }),
  markAllNotificationsRead: () => fetchWithFallback<{ success: boolean }>(`${API_URL}/users/me/notifications/read-all`, { method: 'POST', headers: getHeaders() }),
  getAllOrders: () => fetchWithFallback<Order[]>(`${API_URL}/orders/admin`, { headers: getHeaders() }, []),
  trackOrder: (orderNumber: string, params?: { token?: string; email?: string }) => {
    const query = new URLSearchParams();
    if (params?.token) query.set('token', params.token);
    if (params?.email) query.set('email', params.email);
    return fetchWithFallback<Order>(`${API_URL}/orders/${encodeURIComponent(orderNumber)}/track${query.toString() ? `?${query}` : ''}`, { headers: getHeaders() });
  },
  getOrderDelivery: (orderNumber: string, token?: string) => {
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    return fetchWithFallback<{ orderNumber: string; deliveries: Array<{ id: string; deliveryContent: string; deliveryType: string; activationGuide?: string; restrictions?: string; region?: string }> }>(`${API_URL}/orders/${encodeURIComponent(orderNumber)}/delivery${query}`, { headers: getHeaders() });
  },
  updateOrderStatus: (orderId: string, status: OrderStatus) => fetchWithFallback(`${API_URL}/orders/${orderId}/status`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({status}) }),
  resendOrderInvoiceEmail: (orderId: string) => fetchWithFallback<Order>(`${API_URL}/orders/${orderId}/email/resend`, { method: 'POST', headers: getHeaders() }),
  approveOrderPayment: (orderId: string) => fetchWithFallback<Order>(`${API_URL}/admin/orders/${orderId}/payment/approve`, { method: 'POST', headers: getHeaders() }),
  rejectOrderPayment: (orderId: string, reason: string) => fetchWithFallback<Order>(`${API_URL}/admin/orders/${orderId}/payment/reject`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ reason }) }),
  createOrderDelivery: (orderId: string, data: { orderItemId?: string; deliveryType: string; deliveryContent: string; activationGuide?: string; restrictions?: string; region?: string }) =>
    fetchWithFallback<Order>(`${API_URL}/admin/orders/${orderId}/delivery`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }),
  sendOrderDelivery: (orderId: string) => fetchWithFallback<Order>(`${API_URL}/admin/orders/${orderId}/delivery/send`, { method: 'POST', headers: getHeaders() }),
  resendOrderDeliveryEmail: (orderId: string) => fetchWithFallback<Order>(`${API_URL}/admin/orders/${orderId}/emails/resend-delivery`, { method: 'POST', headers: getHeaders() }),
  
  // Admin Users
  getAllUsers: () => fetchWithFallback<User[]>(`${API_URL}/users`, { headers: getHeaders() }, []),
  updateUserRole: (userId: string, role: UserRole) => fetchWithFallback(`${API_URL}/users/${userId}/role`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({role}) }),
  updateUserBalance: (userId: string, balance: number) => fetchWithFallback(`${API_URL}/users/${userId}/balance`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({balance}) }),

  // Site Config
  getSiteConfig: () => fetchWithFallback<SiteConfig>(`${API_URL}/config`, undefined, { logoUrl: 'https://via.placeholder.com/150', siteName: 'TuniBots', logoSize: 32, heroPromoBanners: [], floatingBrandCards: [], storeSections: [] }),
  updateSiteConfig: (config: Partial<SiteConfig>) => fetchWithFallback<SiteConfig>(`${API_URL}/config`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(config) }),
  testEmailConfig: (to: string) => fetchWithFallback<{ success: boolean; message: string; messageId?: string }>(
    `${API_URL}/admin/email/test`,
    { method: 'POST', headers: getHeaders(), body: JSON.stringify({ to }) }
  ),
  sendClientNotification: (data: { title: string; message: string; targetUserIds?: string[] }) =>
    fetchWithFallback<{ success: boolean; recipients: number; message: string }>(`${API_URL}/admin/notifications/clients`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }),
  getAuthProviders: () => fetchWithFallback<AuthProviderConfig[]>(`${API_URL}/admin/auth-providers`, { headers: getHeaders() }, []),
  updateAuthProvider: (
    providerKey: AuthProviderKey,
    data: { enabled?: boolean; updates?: Record<string, string>; clearFields?: string[] }
  ) => fetchWithFallback<AuthProviderConfig>(`${API_URL}/admin/auth-providers/${providerKey}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data)
  }),

  // Analytics
  getDailyStats: () => fetchWithFallback<{ dailyStats: { date: string, sales: number, orders: number }[], totalSales: number, totalOrders: number, totalUsers: number, topProducts: Listing[] }>(`${API_URL}/admin/stats`, { headers: getHeaders() }, { dailyStats: [], totalSales: 0, totalOrders: 0, totalUsers: 0, topProducts: [] }),
  getSeoAnalytics: () => fetchWithFallback<SeoAnalytics>(`${API_URL}/admin/seo/analytics`, { headers: getHeaders() }, { totalVisits: 0, uniqueVisitors: 0, dailyVisits: [], topCategories: [], topProducts: [] }),
  trackVisit: (data: { path: string; pageType: string; listingId?: string; categoryId?: string; userId?: string; visitorId?: string; referrer?: string }) =>
    fetchWithFallback<{ success: boolean }>(`${API_URL}/analytics/visit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  exportSiteData: async () => {
    const res = await fetch(`${API_URL}/admin/data/export`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(res.statusText);
    return res.blob();
  },
  importSiteData: (fileBase64: string) => fetchWithFallback<{ success: boolean; categoriesImported: number; subCategoriesImported: number; productsImported: number }>(
    `${API_URL}/admin/data/import`,
    { method: 'POST', headers: getHeaders(), body: JSON.stringify({ fileBase64 }) }
  ),
  cleanSiteData: (table: string, confirmation: string) => fetchWithFallback<{ success: boolean; table: string; before: Record<string, number>; after: Record<string, number> }>(
    `${API_URL}/admin/data/clean`,
    { method: 'POST', headers: getHeaders(), body: JSON.stringify({ table, confirmation }) }
  ),

  // AI
  generateDescription: (game: string, itemType: string, keyFeatures: string) => 
    fetchWithFallback<{text: string}>(`${API_URL}/ai/generate-description`, { 
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify({ game, itemType, keyFeatures }) 
    }).then(res => res.text),
};
