import React from 'react';
import { AlertCircle, CheckCircle2, LayoutDashboard, LogOut, Moon, Shield, Store, Sun, X } from 'lucide-react';
import { SiteConfig, User } from '../types';
import { useThemeMode } from '../utils/themeMode';

interface AdminLayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  onOpenStore: () => void;
  siteConfig: SiteConfig;
  notification?: { show: boolean; message: string; type: 'success' | 'error' };
  onCloseNotification?: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  user,
  onLogout,
  onOpenStore,
  siteConfig,
  notification,
  onCloseNotification
}) => {
  const { themeMode, toggleThemeMode } = useThemeMode();

  return (
    <div className="min-h-screen bg-slate-100">
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
