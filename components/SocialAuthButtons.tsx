import React, { useEffect, useState } from 'react';
import { Apple, Chrome, Facebook, Github, Loader2, LucideIcon, MonitorSmartphone, MessageCircleMore } from 'lucide-react';
import { api } from '../services/api';
import { PublicAuthProvider } from '../types';

interface SocialAuthButtonsProps {
  compact?: boolean;
  onProviderClick?: (provider: PublicAuthProvider) => void;
  className?: string;
  nextPath?: string;
}

const providerIcons: Record<string, LucideIcon> = {
  google: Chrome,
  facebook: Facebook,
  apple: Apple,
  discord: MessageCircleMore,
  github: Github,
  microsoft: MonitorSmartphone
};

const providerButtonStyles: Record<string, string> = {
  google: 'border-slate-300 bg-white text-slate-900 shadow-sm hover:border-slate-400 hover:bg-slate-50 hover:shadow-md',
  facebook: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
  apple: 'border-slate-900 bg-slate-950 text-white hover:bg-slate-800',
  discord: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
  github: 'border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200',
  microsoft: 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
};

const GoogleLogo = () => (
  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm">
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.3-1.9 3.1l3 2.3c1.8-1.6 2.8-4 2.8-6.8 0-.7-.1-1.4-.2-2H12z" />
      <path fill="#34A853" d="M12 21c2.6 0 4.8-.9 6.4-2.5l-3-2.3c-.8.6-1.9 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2l-3.1 2.4C4.9 18.8 8.1 21 12 21z" />
      <path fill="#FBBC05" d="M6.4 13c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2L3.3 6.6C2.5 8.1 2 9.5 2 11s.5 2.9 1.3 4.4L6.4 13z" />
      <path fill="#4285F4" d="M12 4.8c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.8 1.9 14.6 1 12 1 8.1 1 4.9 3.2 3.3 6.6L6.4 9C7.2 6.6 9.4 4.8 12 4.8z" />
    </svg>
  </span>
);

const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({ compact = false, onProviderClick, className = '', nextPath }) => {
  const [providers, setProviders] = useState<PublicAuthProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.getPublicAuthProviders()
      .then((data) => {
        if (mounted) setProviders(data);
      })
      .catch(() => {
        if (mounted) setProviders([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-4 text-slate-400 ${className}`}>
        <Loader2 size={18} className="animate-spin" />
      </div>
    );
  }

  if (providers.length === 0) return null;

  const launchProvider = (provider: PublicAuthProvider) => {
    onProviderClick?.(provider);
    if (provider.authUrl) {
      const target = new URL(provider.authUrl, window.location.origin);
      target.searchParams.set('next', nextPath || `${window.location.pathname}${window.location.search}`);
      window.location.href = target.toString();
    }
  };

  return (
    <div className={className}>
      <div className="mb-3 text-center text-xs font-black uppercase tracking-[0.22em] text-slate-400">
        Continue with an enabled provider
      </div>
      <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {providers.map((provider) => {
          const Icon = providerIcons[provider.key] || Chrome;
          const isGoogle = provider.key === 'google';
          return (
            <button
              key={provider.key}
              type="button"
              onClick={() => launchProvider(provider)}
              className={`inline-flex items-center justify-center gap-3 rounded-2xl border px-4 py-3 text-sm font-black transition ${providerButtonStyles[provider.key] || providerButtonStyles.google}`}
            >
              {isGoogle ? <GoogleLogo /> : <Icon size={18} />}
              {provider.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SocialAuthButtons;
