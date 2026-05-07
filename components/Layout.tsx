
import React, { useState } from 'react';
import { ShoppingCart, Search, Menu, User as UserIcon, LogOut, LayoutDashboard, LogIn, CheckCircle, AlertCircle, X, Moon, Sun } from 'lucide-react';
import { User, UserRole, Category, SiteConfig } from '../types';
import * as LucideIcons from 'lucide-react';
import { useThemeMode } from '../utils/themeMode';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  cartCount: number;
  navigateTo: (page: string, slug?: string) => void;
  currentPage: string;
  categories: Category[];
  notification?: { show: boolean; message: string; type: 'success' | 'error' }; // New prop for popup
  onCloseNotification?: () => void; // New prop to close popup
  siteConfig: SiteConfig;
}

// Helper to render icon by string name with robust lookup
const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
  const icons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>;
  // Fallback to CircleHelp if icon name is invalid or not found
  const IconComponent = icons[name] || icons[name.trim()] || icons.HelpCircle;
  return <IconComponent size={16} className={className} />;
};

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  user, 
  onLogout, 
  cartCount, 
  navigateTo, 
  currentPage, 
  categories,
  notification,
  onCloseNotification,
  siteConfig
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { themeMode, toggleThemeMode } = useThemeMode();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Toast Notification Popup */}
      {notification && notification.show && (
        <div className="fixed top-24 right-4 z-[100] animate-in slide-in-from-right duration-300 fade-in">
          <div className={`bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-4 border-l-4 ${
            notification.type === 'error' ? 'border-red-500' : 'border-green-500'
          }`}>
            <div className={`p-2 rounded-full ${
              notification.type === 'error' ? 'bg-red-500/20' : 'bg-green-500/20'
            }`}>
              {notification.type === 'error' ? (
                <AlertCircle size={20} className="text-red-400" />
              ) : (
                <CheckCircle size={20} className="text-green-400" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-sm">{notification.type === 'error' ? 'Erreur' : 'Succès !'}</h4>
              <p className="text-xs text-slate-300">{notification.message}</p>
            </div>
            <button onClick={onCloseNotification} className="text-slate-400 hover:text-white pl-4">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="theme-bg-accent text-white text-xs py-2 px-4 text-center font-black tracking-wide">
        {siteConfig.headerAnnouncement || 'Bienvenue sur la première plateforme digitale en Tunisie !'}
      </div>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button 
                className="p-2 -ml-2 mr-2 md:hidden text-slate-500 hover:text-slate-700"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu size={24} />
              </button>
              <div className="flex items-center cursor-pointer" onClick={() => navigateTo('home')}>
                {siteConfig.logoUrl ? (
                  <img src={siteConfig.logoUrl} alt={siteConfig.siteName} className="h-8 w-auto mr-2" />
                ) : (
                  <div className="theme-bg-accent text-white p-1.5 rounded mr-2 font-bold text-xl">
                    {siteConfig.siteName.charAt(0)}
                  </div>
                )}
                <span className="font-bold text-xl tracking-tight text-slate-900">{siteConfig.siteName}</span>
              </div>
            </div>

            <div className="hidden md:flex flex-1 mx-8 max-w-2xl">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-slate-50 placeholder-slate-500 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                  placeholder={siteConfig.headerSearchPlaceholder || 'Rechercher jeux, items, comptes...'}
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={toggleThemeMode}
                className="theme-mode-toggle"
                aria-label={themeMode === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}
                title={themeMode === 'dark' ? 'Mode clair' : 'Mode sombre'}
              >
                {themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Cart Button with Bubble */}
              <button className="p-2 text-slate-500 relative transition-transform active:scale-95 theme-text-accent" onClick={() => navigateTo('cart')}>
                <ShoppingCart size={24} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 theme-bg-accent text-white text-xs flex items-center justify-center rounded-full font-bold animate-in zoom-in duration-200 border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </button>

              {user.role === UserRole.GUEST ? (
                <div className="flex items-center space-x-2 ml-2">
                  <button onClick={() => navigateTo('login')} className="theme-text-accent font-medium px-3 py-2 text-sm flex items-center"><LogIn size={16} className="mr-1" /> Connexion</button>
                  <button onClick={() => navigateTo('register')} className="theme-btn px-4 py-2 rounded-lg text-sm font-bold shadow-sm">{siteConfig.headerCtaLabel || "S'inscrire"}</button>
                </div>
              ) : (
                <div className="relative ml-2">
                   <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center space-x-2 focus:outline-none">
                      <div className="h-9 w-9 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                         <img src={user.avatarUrl} alt="User" className="h-full w-full object-cover" />
                      </div>
                   </button>
                   {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-50">
                           <div className="px-4 py-3 border-b border-slate-100">
                             <p className="text-sm font-bold text-slate-900">{user.username}</p>
                             <p className="text-xs text-slate-500 truncate">{user.email}</p>
                           </div>
                           <button onClick={() => { navigateTo('profile'); setIsProfileOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"><UserIcon size={16} className="mr-2" /> Mon Profil</button>
                           {(user.role === UserRole.ADMIN || user.role === UserRole.SUB_ADMIN || user.role === UserRole.SELLER) && <button onClick={() => { navigateTo('admin-dashboard'); setIsProfileOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"><LayoutDashboard size={16} className="mr-2" /> Admin Panel</button>}
                           {user.role === UserRole.CLIENT && <button onClick={() => { navigateTo('user-dashboard'); setIsProfileOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"><LucideIcons.History size={16} className="mr-2" /> Mes Commandes</button>}
                           <button onClick={() => { onLogout(); setIsProfileOpen(false); }} className="w-full text-left px-4 py-2 text-sm flex items-center" style={{ color: 'var(--theme-accent)', backgroundColor: 'transparent' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--theme-accent-soft)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}><LogOut size={16} className="mr-2" /> Déconnexion</button>
                        </div>
                   )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="flex space-x-6 text-sm font-medium py-3 overflow-x-auto no-scrollbar">
                <button onClick={() => navigateTo('home')} className={`whitespace-nowrap flex items-center ${currentPage === 'home' ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}>
                  Tout Voir
                </button>
                {categories.map((cat) => (
                   <button 
                    key={cat.id}
                    onClick={() => navigateTo('category', cat.slug)}
                    className={`whitespace-nowrap flex items-center transition-colors text-slate-600 hover:text-indigo-600`}
                  >
                    <DynamicIcon name={cat.icon} className="mr-1" />
                    {cat.name}
                   </button>
                ))}
             </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="relative mt-auto overflow-hidden border-t border-slate-800 bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.18),transparent_30%)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-14">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
            <div>
              <div className="flex items-center gap-3 mb-5">
                {siteConfig.logoUrl ? (
                  <img src={siteConfig.logoUrl} alt={siteConfig.siteName} className="h-10 w-auto rounded-lg bg-white/5 p-1" />
                ) : (
                  <div className="theme-bg-accent h-11 w-11 rounded-2xl flex items-center justify-center font-black text-white shadow-lg">
                    {siteConfig.siteName.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="text-2xl font-black tracking-tight">{siteConfig.siteName}</div>
                  <div className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">{siteConfig.footerTagline || 'Marketplace digitale premium'}</div>
                </div>
              </div>
              <p className="max-w-md text-sm leading-7 text-slate-300">
                {siteConfig.footerDescription || 'La destination premium pour vos comptes, licences, abonnements, outils IA et services digitaux en Tunisie.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['Paiement sécurisé', 'Livraison rapide', 'Support local'].map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-slate-200">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-black uppercase tracking-widest text-white">Navigation</h4>
              <div className="space-y-3 text-sm text-slate-300">
                <button onClick={() => navigateTo('home')} className="block hover:text-white">Accueil</button>
                <button onClick={() => navigateTo('cart')} className="block hover:text-white">Panier</button>
                <button onClick={() => navigateTo('login')} className="block hover:text-white">Connexion</button>
                <button onClick={() => navigateTo('register')} className="block hover:text-white">{siteConfig.headerCtaLabel || "S'inscrire"}</button>
              </div>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-black uppercase tracking-widest text-white">Catégories</h4>
              <div className="space-y-3 text-sm text-slate-300">
                {categories.slice(0, 5).map((cat) => (
                  <button key={cat.id} onClick={() => navigateTo('category', cat.slug)} className="flex items-center gap-2 hover:text-white">
                    <DynamicIcon name={cat.icon} />
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-black uppercase tracking-widest text-white">Contact</h4>
              <div className="space-y-3 text-sm text-slate-300">
                {siteConfig.footerEmail && (
                  <a href={`mailto:${siteConfig.footerEmail}`} className="flex items-center gap-2 hover:text-white">
                    <LucideIcons.Mail size={16} className="theme-text-accent" />
                    {siteConfig.footerEmail}
                  </a>
                )}
                {siteConfig.footerPhone && (
                  <a href={`tel:${siteConfig.footerPhone.replace(/\s+/g, '')}`} className="flex items-center gap-2 hover:text-white">
                    <LucideIcons.Phone size={16} className="theme-text-accent" />
                    {siteConfig.footerPhone}
                  </a>
                )}
                {siteConfig.footerWhatsapp && (
                  <a href={`https://wa.me/${siteConfig.footerWhatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white">
                    <LucideIcons.MessageCircle size={16} className="theme-text-accent" />
                    WhatsApp
                  </a>
                )}
                {siteConfig.footerAddress && (
                  <div className="flex items-center gap-2">
                    <LucideIcons.MapPin size={16} className="theme-text-accent" />
                    {siteConfig.footerAddress}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
            <div>© {new Date().getFullYear()} {siteConfig.siteName}. {siteConfig.footerCopyright || 'Tous droits réservés.'}</div>
            <div className="font-bold uppercase tracking-[0.24em] text-slate-600">Tunidex Premium Platform</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
