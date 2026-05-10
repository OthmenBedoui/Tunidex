
import React, { useRef, useState, useEffect } from 'react';
import AdminLayout from './components/AdminLayout';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Subscription from './pages/Subscription';
import Cart from './pages/Cart';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';
import { AdminDashboard, UserDashboard } from './pages/Dashboards';
import { User, UserRole, Listing, Order, OrderStatus, SubscriptionTier, Category, SiteConfig } from './types';
import { api } from './services/api';
import * as LucideIcons from 'lucide-react';
import { addGuestCartItem, getGuestCartCount } from './utils/guestCart';

const INITIAL_GUEST: User = { id: 'guest', username: 'Invité', email: '', role: UserRole.GUEST, balance: 0, avatarUrl: 'https://via.placeholder.com/150', subscriptionTier: SubscriptionTier.FREE };

// --- APP COMPONENT ---
import Profile from './pages/Profile';

type NotificationState = {
  show: boolean;
  message: string;
  type: 'success' | 'error';
};

type PendingNavigation = {
  page: string;
  slug?: string;
} | null;

const isAdminRole = (role: UserRole) =>
  role === UserRole.ADMIN || role === UserRole.SUB_ADMIN || role === UserRole.SELLER;

const resolveRouteFromPath = (pathname: string): { page: string; slug?: string } => {
  if (pathname === '/admin' || pathname === '/admin/') {
    return { page: 'admin-dashboard' };
  }
  if (pathname === '/admin/login') {
    return { page: 'admin-login' };
  }
  if (pathname === '/login') {
    return { page: 'login' };
  }
  if (pathname === '/register') {
    return { page: 'register' };
  }
  if (pathname === '/cart') {
    return { page: 'cart' };
  }
  if (pathname === '/subscription') {
    return { page: 'subscription' };
  }
  if (pathname === '/profile') {
    return { page: 'profile' };
  }
  if (pathname === '/dashboard') {
    return { page: 'user-dashboard' };
  }
  if (pathname.startsWith('/category/')) {
    return { page: 'category', slug: decodeURIComponent(pathname.replace('/category/', '')) };
  }
  if (pathname === '/product') {
    return { page: 'product' };
  }
  return { page: 'home' };
};

const getPathForPage = (page: string, slug?: string) => {
  switch (page) {
    case 'admin-dashboard':
      return '/admin';
    case 'admin-login':
      return '/admin/login';
    case 'login':
      return '/login';
    case 'register':
      return '/register';
    case 'cart':
      return '/cart';
    case 'subscription':
      return '/subscription';
    case 'profile':
      return '/profile';
    case 'user-dashboard':
      return '/dashboard';
    case 'category':
      return slug ? `/category/${encodeURIComponent(slug)}` : '/';
    case 'product':
      return '/product';
    case 'home':
    default:
      return '/';
  }
};

const App: React.FC = () => {
  const initialRoute = resolveRouteFromPath(window.location.pathname);
  const [user, setUser] = useState<User>(INITIAL_GUEST);
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(initialRoute.page);
  const [currentSlug, setCurrentSlug] = useState(initialRoute.slug || '');
  const [selectedProduct, setSelectedProduct] = useState<Listing | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  
  const [cartCount, setCartCount] = useState(0);
  const [notification, setNotification] = useState<NotificationState>({ show: false, message: '', type: 'success' });
  const notificationTimerRef = useRef<number | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({ logoUrl: '', siteName: 'Tunidex', logoSize: 32, heroPromoBanners: [], floatingBrandCards: [], storeSections: [] });
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(!localStorage.getItem('token'));
  const publicListings = listings.filter((listing) => !listing.isArchived);

  useEffect(() => {
    const handlePopState = () => {
      const route = resolveRouteFromPath(window.location.pathname);
      setCurrentPage(route.page);
      setCurrentSlug(route.slug || '');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getCurrentUser()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('token');
          setUser(INITIAL_GUEST);
        })
        .finally(() => setIsAuthResolved(true));
    } else {
      setIsAuthResolved(true);
    }
    
    api.getListings().then(setListings).catch(console.error);
    api.getCategories().then(setCategories).catch(console.error);
    api.getSiteConfig().then(setSiteConfig).catch(console.error);
    
    if (token) {
      api.getCart().then(items => { if(items.length > 0) setCartCount(items.reduce((acc, item) => acc + item.quantity, 0)); else setCartCount(0); }).catch(() => {});
    } else {
      setCartCount(getGuestCartCount());
    }
    
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUB_ADMIN || user.role === UserRole.SELLER) {
        api.getAllOrders().then(setOrders).catch(console.error);
    } else if (user.id !== 'guest') {
        api.getMyOrders().then(setOrders).catch(console.error);
    }
  }, [user.id, user.role]);

  useEffect(() => {
    if (siteConfig.siteName) {
        document.title = siteConfig.siteName;
    }
    if (siteConfig.faviconUrl) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = siteConfig.faviconUrl;
    }
    const root = document.documentElement;
    root.style.setProperty('--theme-accent', siteConfig.accentColor || '#4f46e5');
    root.style.setProperty('--theme-accent-hover', siteConfig.accentHoverColor || '#4338ca');
    root.style.setProperty('--theme-accent-soft', siteConfig.accentSoftColor || '#e0e7ff');
    root.style.setProperty('--theme-accent-text', siteConfig.accentTextColor || '#312e81');
  }, [siteConfig]);

  useEffect(() => {
    if (!selectedProduct) return;
    const freshSelectedProduct = listings.find((listing) => listing.id === selectedProduct.id);
    if (freshSelectedProduct) {
      setSelectedProduct(freshSelectedProduct);
      if (freshSelectedProduct.variants?.length && !freshSelectedProduct.variants.some((variant) => variant.id === selectedVariantId)) {
        setSelectedVariantId(freshSelectedProduct.variants[0].id || '');
      }
    }
  }, [listings, selectedProduct, selectedVariantId]);

  const refreshData = () => {
      api.getListings().then(setListings).catch(console.error);
      api.getCategories().then(setCategories).catch(console.error);
  };

  const navigateTo = (page: string, slug?: string, replace = false) => {
    setCurrentPage(page);
    setCurrentSlug(slug || '');
    const nextPath = getPathForPage(page, slug);
    if (window.location.pathname !== nextPath) {
      if (replace) {
        window.history.replaceState({}, '', nextPath);
      } else {
        window.history.pushState({}, '', nextPath);
      }
    }
    window.scrollTo(0, 0);
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    if (notificationTimerRef.current) {
      window.clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
    setNotification({ show: true, message, type });
    if (type === 'success') {
      notificationTimerRef.current = window.setTimeout(() => {
        setNotification({ show: false, message: '', type: 'success' });
        notificationTimerRef.current = null;
      }, 1500);
    }
  };

  const handleLoginSuccess = (token: string, user: User) => {
    localStorage.setItem('token', token);
    setIsAuthResolved(true);
    setUser(user);
    if (isAdminRole(user.role)) {
      setPendingNavigation(null);
      navigateTo('admin-dashboard');
      return;
    }
    if (pendingNavigation) {
      const nextRoute = pendingNavigation;
      setPendingNavigation(null);
      navigateTo(nextRoute.page, nextRoute.slug);
      return;
    }
    navigateTo('home');
  };
  const handleLogout = () => {
    const shouldReturnToAdminLogin = currentPage === 'admin-dashboard' || currentPage === 'admin-login';
    localStorage.removeItem('token');
    setUser(INITIAL_GUEST);
    setPendingNavigation(null);
    navigateTo(shouldReturnToAdminLogin ? 'admin-login' : 'home');
  };
  const requireLoginFor = (page: string, slug?: string) => {
    setPendingNavigation({ page, slug });
    navigateTo('login');
  };

  useEffect(() => {
    if (!isAuthResolved) {
      return;
    }

    if (currentPage === 'admin-dashboard' && !isAdminRole(user.role)) {
      navigateTo('admin-login', undefined, true);
      return;
    }

    if (currentPage === 'admin-login') {
      if (isAdminRole(user.role)) {
        navigateTo('admin-dashboard', undefined, true);
        return;
      }

      if (user.id !== 'guest') {
        navigateTo('home', undefined, true);
      }
    }
  }, [currentPage, isAuthResolved, user.id, user.role]);
  
  const handleAddToCart = async (listing: Listing) => {
    const variants = listing.variants || [];
    const variantId = variants.length > 0 ? selectedVariantId : undefined;
    const selectedVariant = variantId ? variants.find((variant) => variant.id === variantId) : undefined;

    if (variants.length > 0 && !selectedVariant) {
        showNotification('Veuillez choisir une variante avant d’ajouter au panier', 'error');
        return;
    }

    if (user.id === 'guest') {
        addGuestCartItem(listing.id, variantId);
        setCartCount(getGuestCartCount());
        showNotification(`${listing.title}${selectedVariant ? ` - ${selectedVariant.name}` : ''} ajouté au panier`);
        return;
    }

    try {
        await api.addToCart(listing.id, variantId);
        setCartCount(prev => prev + 1);
        showNotification(`${listing.title}${selectedVariant ? ` - ${selectedVariant.name}` : ''} ajouté au panier`);
    } catch (error) {
        showNotification(error instanceof Error ? error.message : "Impossible d'ajouter ce produit au panier", 'error');
    }
  };

  const updateCartCount = (count: number) => {
    setCartCount(count);
  };

  const handleCreateListing = async (listing: Partial<Listing>) => {
    try {
      await api.createListing(listing);
      refreshData();
      showNotification("Produit créé avec succès !");
    } catch (error) {
      showNotification(error instanceof Error ? error.message : "Erreur", 'error');
      throw error;
    }
  };
  const handleUpdateListing = async (listingId: string, listing: Partial<Listing>) => {
    try {
      await api.updateListing(listingId, listing);
      refreshData();
      showNotification("Produit mis à jour avec succès !");
    } catch (error) {
      showNotification(error instanceof Error ? error.message : "Erreur", 'error');
      throw error;
    }
  };
  const handleDeleteListing = async (listingId: string) => {
    try {
      const result = await api.deleteListing(listingId);
      if (selectedProduct?.id === listingId) {
        setSelectedProduct(null);
        navigateTo('home');
      }
      refreshData();
      showNotification(result.archived ? (result.message || "Produit archivé avec succès !") : "Produit supprimé avec succès !");
    } catch (error) {
      showNotification(error instanceof Error ? error.message : "Erreur", 'error');
      throw error;
    }
  };
  const handleViewProduct = (l: Listing) => {
    setSelectedProduct(l);
    setSelectedVariantId(l.variants?.[0]?.id || '');
    navigateTo('product');
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
        await api.updateOrderStatus(orderId, status);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        showNotification("Statut de la commande mis à jour");
    } catch (err) {
        console.error(err);
        showNotification("Erreur lors de la mise à jour", 'error');
    }
  };

  const handleUpdateSiteConfig = async (config: Partial<SiteConfig>) => {
    try {
        const nextConfig = await api.updateSiteConfig(config);
        setSiteConfig(nextConfig);
        showNotification("Configuration du site mise à jour");
    } catch (err) {
        console.error(err);
        showNotification(err instanceof Error ? err.message : "Erreur lors de la mise à jour", 'error');
        throw err;
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'home': return <Home listings={publicListings} categories={categories} onViewProduct={handleViewProduct} navigateTo={navigateTo} siteConfig={siteConfig} />;
      case 'login': return <Login onLoginSuccess={handleLoginSuccess} navigateTo={navigateTo} siteConfig={siteConfig} initialMode="login" />;
      case 'register': return <Login onLoginSuccess={handleLoginSuccess} navigateTo={navigateTo} siteConfig={siteConfig} initialMode="register" />;
      case 'admin-login': return <Login onLoginSuccess={handleLoginSuccess} navigateTo={navigateTo} siteConfig={siteConfig} initialMode="login" audience="admin" />;
      case 'cart': return <Cart navigateTo={navigateTo} onCartUpdate={updateCartCount} siteConfig={siteConfig} listings={publicListings} user={user} />;
      case 'subscription': return <Subscription user={user} onSubscribe={() => refreshData()} navigateTo={navigateTo} onRequireLogin={() => requireLoginFor('subscription')} />;
      
      case 'category': {
        const cat = categories.find(c => c.slug === currentSlug);
        if(!cat) return <div className="p-8 text-center text-indigo-500">Catégorie introuvable</div>;
        
        // Robust icon lookup
        const icons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>;
        const IconComponent = icons[cat.icon] || icons[cat.icon.trim()] || icons.Package;
        
        return <CategoryPage 
            type={cat.id} 
            categoryId={cat.id}
            title={cat.name}
            subtitle={cat.description || ''}
            heroGradient={cat.gradient || 'bg-slate-900'}
            heroImage={cat.imageUrl || ''}
            icon={<IconComponent size={32} className="text-white" />}
            listings={publicListings}
            onViewProduct={handleViewProduct}
            navigateTo={navigateTo}
            subCategories={cat.subCategories}
        />;
      }

      case 'product': {
        if (!selectedProduct || selectedProduct.isArchived) return <Home listings={publicListings} categories={categories} onViewProduct={handleViewProduct} navigateTo={navigateTo} siteConfig={siteConfig} />;
        return (
          <ProductPage
            product={selectedProduct}
            categories={categories}
            selectedVariantId={selectedVariantId}
            onSelectVariant={setSelectedVariantId}
            onAddToCart={() => handleAddToCart(selectedProduct)}
            onBuyNow={async () => {
              await handleAddToCart(selectedProduct);
              navigateTo('cart');
            }}
            navigateTo={navigateTo}
          />
        );
      }
      case 'admin-dashboard':
        return <AdminDashboard 
                  user={user} 
                  orders={orders} 
                  listings={listings} 
                  categories={categories} 
                  onUpdateStatus={handleUpdateOrderStatus} 
                  onCreateListing={handleCreateListing} 
                  onUpdateListing={handleUpdateListing}
                  onDeleteListing={handleDeleteListing}
                  onRefreshCategories={refreshData} 
                  siteConfig={siteConfig}
                  onUpdateSiteConfig={handleUpdateSiteConfig}
               />;
      
      case 'user-dashboard': return <UserDashboard user={user} orders={orders} navigateTo={navigateTo} />;
      case 'profile': return <Profile user={user} onUpdateUser={setUser} navigateTo={navigateTo} />;
      default: return <Home listings={publicListings} categories={categories} onViewProduct={handleViewProduct} navigateTo={navigateTo} siteConfig={siteConfig} />;
    }
  };

  if (currentPage === 'admin-login') {
    return renderContent();
  }

  if (currentPage === 'admin-dashboard') {
    return (
      <AdminLayout
        user={user}
        onLogout={handleLogout}
        onOpenStore={() => navigateTo('home')}
        siteConfig={siteConfig}
        notification={notification}
        onCloseNotification={() => setNotification({ ...notification, show: false })}
      >
        {renderContent()}
      </AdminLayout>
    );
  }

  if (currentPage === 'login' || currentPage === 'register') {
    return renderContent();
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      cartCount={cartCount} 
      navigateTo={navigateTo} 
      currentPage={currentPage} 
      categories={categories}
      notification={notification}
      onCloseNotification={() => setNotification({ ...notification, show: false })}
      siteConfig={siteConfig}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
