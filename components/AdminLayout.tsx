import React from 'react';
import { AlertCircle, Bell, CheckCircle2, ClipboardList, LayoutDashboard, LogOut, Moon, Shield, Store, Sun, UserPlus, UserRoundX, WalletCards, Settings2, X } from 'lucide-react';
import { SiteConfig, User } from '../types';
import type { AdminNotificationItem } from '../App';
import { useThemeMode } from '../utils/themeMode';

interface AdminLayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  onOpenStore: () => void;
  siteConfig: SiteConfig;
  notification?: { show: boolean; message: string; type: 'success' | 'error' };
  onCloseNotification?: () => void;
  adminNotifications?: AdminNotificationItem[];
  isNotificationCenterOpen?: boolean;
  blockingOrderNotification?: AdminNotificationItem | null;
  onToggleNotificationCenter?: () => void;
  onCloseNotificationCenter?: () => void;
  onMarkAllNotificationsRead?: () => void;
  onOpenAdminNotification?: (item: AdminNotificationItem) => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  user,
  onLogout,
  onOpenStore,
  siteConfig,
  notification,
  onCloseNotification,
  adminNotifications = [],
  isNotificationCenterOpen = false,
  blockingOrderNotification,
  onToggleNotificationCenter,
  onCloseNotificationCenter,
  onMarkAllNotificationsRead,
  onOpenAdminNotification
}) => {
  const { themeMode, toggleThemeMode } = useThemeMode();
  const unreadCount = adminNotifications.filter((item) => !item.read).length;
  const getNotificationAppearance = (item: AdminNotificationItem) => {
    if (item.type === 'user') {
      return {
        icon: UserPlus,
        unreadIconClass: 'bg-emerald-100 text-emerald-700',
        readIconClass: 'bg-emerald-50 text-emerald-500'
      };
    }
    if (item.type === 'account') {
      return {
        icon: UserRoundX,
        unreadIconClass: 'bg-rose-100 text-rose-700',
        readIconClass: 'bg-rose-50 text-rose-500'
      };
    }
    if (item.type === 'subscription') {
      return {
        icon: WalletCards,
        unreadIconClass: 'bg-cyan-100 text-cyan-700',
        readIconClass: 'bg-cyan-50 text-cyan-500'
      };
    }
    if (item.type === 'system') {
      return {
        icon: Settings2,
        unreadIconClass: 'bg-violet-100 text-violet-700',
        readIconClass: 'bg-violet-50 text-violet-500'
      };
    }
    return {
      icon: Bell,
      unreadIconClass: 'bg-amber-100 text-amber-700',
      readIconClass: 'bg-slate-100 text-slate-500'
    };
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {blockingOrderNotification && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-amber-500 px-6 py-3 text-xs font-black uppercase tracking-[0.24em] text-white">
              Nouvelle commande à traiter
            </div>
            <div className="p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <Bell size={34} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-950">{blockingOrderNotification.orderNumber || 'Commande reçue'}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Une commande vient d'arriver. Cette alerte reste bloquante jusqu'à consultation dans le dashboard.
                  </p>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">
                    {blockingOrderNotification.message}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenAdminNotification?.(blockingOrderNotification)}
                className="mt-7 flex w-full items-center justify-center rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black uppercase tracking-wider text-white hover:bg-amber-600"
              >
                <ClipboardList size={18} className="mr-2" />
                Consulter la commande
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && notification.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md overflow-hidden rounded-3xl border bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-3 duration-300 ${
            notification.type === 'error' ? 'border-red-100' : 'border-emerald-100'
          }`}>
            <div className={`h-1.5 ${notification.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`} />
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                  notification.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {notification.type === 'error' ? <AlertCircle size={28} /> : <CheckCircle2 size={28} className="animate-[notification-check_450ms_ease-out]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-black text-slate-900">{notification.type === 'error' ? 'Erreur' : 'Succès'}</div>
                  <div className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</div>
                </div>
                {notification.type === 'error' && (
                  <button
                    type="button"
                    onClick={onCloseNotification}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Fermer la notification"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-slate-950 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 border border-white/10">
              <LayoutDashboard size={22} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Admin Access</div>
              <div className="text-lg font-black">{siteConfig.siteName} Dashboard</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={onToggleNotificationCenter}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white hover:bg-white/15"
                aria-label="Notifications admin"
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-white ring-2 ring-slate-950">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {isNotificationCenterOpen && (
                <div className="absolute right-0 top-12 z-50 w-[min(92vw,420px)] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Centre admin</div>
                      <div className="font-black">Notifications</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {adminNotifications.length > 0 && (
                        <button type="button" onClick={onMarkAllNotificationsRead} className="rounded-lg bg-slate-100 px-3 py-2 text-[11px] font-black text-slate-600 hover:bg-slate-200">
                          Tout lu
                        </button>
                      )}
                      <button type="button" onClick={onCloseNotificationCenter} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[430px] overflow-y-auto p-2">
                    {adminNotifications.length === 0 && (
                      <div className="px-4 py-10 text-center text-sm text-slate-400">Aucune notification pour le moment.</div>
                    )}
                    {adminNotifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onOpenAdminNotification?.(item)}
                        className={`w-full rounded-xl p-3 text-left transition hover:bg-slate-50 ${item.read ? 'bg-white' : 'bg-amber-50'}`}
                      >
                        {(() => {
                          const appearance = getNotificationAppearance(item);
                          const Icon = appearance.icon;
                          return (
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.read ? appearance.readIconClass : appearance.unreadIconClass}`}>
                                <Icon size={17} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="truncate text-sm font-black text-slate-900">{item.title}</div>
                                  {!item.read && <span className="h-2 w-2 rounded-full bg-amber-500" />}
                                </div>
                                <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.message}</div>
                                <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  {new Date(item.createdAt).toLocaleString('fr-FR')}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={toggleThemeMode}
              className="theme-mode-toggle border-white/10 bg-white/10 text-white hover:bg-white/15"
              aria-label={themeMode === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}
              title={themeMode === 'dark' ? 'Mode clair' : 'Mode sombre'}
            >
              {themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 md:block">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Connecté en tant que</div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <Shield size={14} className="text-emerald-400" />
                {user.username}
              </div>
            </div>
            <button onClick={onOpenStore} className="inline-flex items-center rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15">
              <Store size={16} className="mr-2" />
              Accéder au store
            </button>
            <button onClick={onLogout} className="inline-flex items-center rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">
              <LogOut size={16} className="mr-2" />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
