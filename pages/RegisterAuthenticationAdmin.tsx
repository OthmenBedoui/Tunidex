import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Apple, CheckCircle2, Chrome, Facebook, Gamepad2, Github, KeyRound, Loader2, Mail, RefreshCw, Save, Settings2, ShieldCheck, Sparkles, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../services/api';
import { AuthProviderConfig, AuthProviderField, AuthProviderKey } from '../types';
import { AdminPanelCard, AdminWorkspace } from '../components/AdminWorkspace';

interface RegisterAuthenticationAdminProps {
  navigateTo: (page: string, slug?: string) => void;
  onNotify: (message: string, type?: 'success' | 'error') => void;
}

type DraftState = Record<AuthProviderKey, Record<string, string>>;

const providerIcons: Record<AuthProviderKey, React.ComponentType<{ size?: string | number; className?: string }>> = {
  'email-password': Mail,
  google: Chrome,
  facebook: Facebook,
  apple: Apple,
  discord: Gamepad2,
  github: Github,
  microsoft: Settings2
};

const buildDrafts = (providers: AuthProviderConfig[]): DraftState => (
  providers.reduce((acc, provider) => {
    acc[provider.key] = provider.fields.reduce<Record<string, string>>((fieldAcc, field) => {
      fieldAcc[field.envName] = field.secret ? '' : field.displayValue;
      return fieldAcc;
    }, {});
    return acc;
  }, {} as DraftState)
);

const formatDateTime = (value?: string) => {
  if (!value) return 'Never updated';
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const RegisterAuthenticationAdmin: React.FC<RegisterAuthenticationAdminProps> = ({ navigateTo, onNotify }) => {
  const [providers, setProviders] = useState<AuthProviderConfig[]>([]);
  const [drafts, setDrafts] = useState<DraftState>({} as DraftState);
  const [loading, setLoading] = useState(true);
  const [savingProvider, setSavingProvider] = useState<AuthProviderKey | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AuthProviderKey>('email-password');

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await api.getAuthProviders();
      setProviders(data);
      setDrafts(buildDrafts(data));
      if (!data.some((provider) => provider.key === selectedProvider) && data[0]) {
        setSelectedProvider(data[0].key);
      }
    } catch (error) {
      onNotify(error instanceof Error ? error.message : 'Unable to load authentication providers.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProviders();
  }, []);

  const selected = useMemo(
    () => providers.find((provider) => provider.key === selectedProvider) || providers[0],
    [providers, selectedProvider]
  );

  const summary = useMemo(() => {
    const active = providers.filter((provider) => provider.enabled).length;
    const configured = providers.filter((provider) => provider.configured).length;
    return { active, configured, total: providers.length };
  }, [providers]);

  const updateFieldDraft = (providerKey: AuthProviderKey, field: AuthProviderField, value: string) => {
    setDrafts((current) => ({
      ...current,
      [providerKey]: {
        ...(current[providerKey] || {}),
        [field.envName]: value
      }
    }));
  };

  const saveProvider = async (provider: AuthProviderConfig, enabled?: boolean) => {
    try {
      setSavingProvider(provider.key);
      const providerDraft = drafts[provider.key] || {};
      const updates = provider.fields.reduce<Record<string, string>>((acc, field) => {
        const nextValue = providerDraft[field.envName] ?? '';
        if (field.secret) {
          if (nextValue.trim().length > 0) acc[field.envName] = nextValue;
        } else {
          acc[field.envName] = nextValue;
        }
        return acc;
      }, {});

      const updated = await api.updateAuthProvider(provider.key, {
        enabled: typeof enabled === 'boolean' ? enabled : provider.enabled,
        updates
      });

      const nextProviders = providers.map((item) => item.key === updated.key ? updated : item);
      setProviders(nextProviders);
      setDrafts(buildDrafts(nextProviders));
      onNotify(`${updated.name} saved successfully.`);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : 'Unable to save provider.', 'error');
    } finally {
      setSavingProvider(null);
    }
  };

  const clearField = async (provider: AuthProviderConfig, field: AuthProviderField) => {
    try {
      setSavingProvider(provider.key);
      const updated = await api.updateAuthProvider(provider.key, {
        enabled: provider.enabled,
        clearFields: [field.envName]
      });
      const nextProviders = providers.map((item) => item.key === updated.key ? updated : item);
      setProviders(nextProviders);
      setDrafts(buildDrafts(nextProviders));
      onNotify(`${field.label} cleared for ${provider.name}.`);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : 'Unable to clear the credential.', 'error');
    } finally {
      setSavingProvider(null);
    }
  };

  return (
    <AdminWorkspace
      eyebrow="Register & Authentication"
      title="Gestion des méthodes d'inscription et d'authentification"
      description="Pilote Email + Password, Google, Facebook, Apple et les futurs providers depuis une surface admin unifiée, pensée pour les équipes non techniques."
      breadcrumbs={[
        { label: 'Dashboard', onClick: () => navigateTo('admin-dashboard') },
        { label: 'Register & Authentication' }
      ]}
      actions={
        <>
          <button
            type="button"
            onClick={() => navigateTo('admin-dashboard')}
            className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/15"
          >
            Retour au dashboard
          </button>
          <button
            type="button"
            onClick={() => void loadProviders()}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-100"
          >
            <RefreshCw size={16} />
            Synchroniser l'environnement
          </button>
        </>
      }
      sidebar={
        <div className="space-y-4">
          <AdminPanelCard title="Navigation rapide" description="Revenez au centre de pilotage ou poursuivez la configuration auth.">
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => navigateTo('admin-dashboard')}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                Dashboard admin
                <ShieldCheck size={16} className="text-slate-400" />
              </button>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Les changements sont enregistrés provider par provider sans modifier les routes existantes.
              </div>
            </div>
          </AdminPanelCard>
        </div>
      }
    >
      <section className="grid gap-5 md:grid-cols-3">
        {[
          { label: 'Active providers', value: summary.active, icon: CheckCircle2 },
          { label: 'Configured environments', value: summary.configured, icon: KeyRound },
          { label: 'Available methods', value: summary.total, icon: Sparkles }
        ].map((item) => (
          <article key={item.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">{item.label}</div>
                <div className="mt-3 text-3xl font-black text-slate-950">{item.value}</div>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl theme-bg-soft theme-text-accent">
                <item.icon size={26} />
              </div>
            </div>
          </article>
        ))}
      </section>

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
          <Loader2 size={28} className="animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 px-3">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Provider management</div>
              <h2 className="mt-2 text-xl font-black text-slate-950">Authentication methods</h2>
            </div>
            <div className="space-y-3">
              {providers.map((provider) => {
                const Icon = providerIcons[provider.key];
                const isSelected = selected?.key === provider.key;
                return (
                  <button
                    key={provider.key}
                    type="button"
                    onClick={() => setSelectedProvider(provider.key)}
                    className={`w-full rounded-3xl border p-4 text-left transition ${isSelected ? 'border-slate-950 bg-slate-950 text-white shadow-xl' : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isSelected ? 'bg-white/10 text-white' : 'bg-white text-slate-950 shadow-sm'}`}>
                        <Icon size={24} />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col items-end gap-2">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${provider.enabled ? (isSelected ? 'bg-emerald-400/20 text-emerald-200' : 'bg-emerald-50 text-emerald-700') : (isSelected ? 'bg-white/10 text-slate-200' : 'bg-slate-200 text-slate-600')}`}>
                          {provider.enabled ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${provider.configured ? (isSelected ? 'bg-cyan-400/20 text-cyan-200' : 'bg-cyan-50 text-cyan-700') : (isSelected ? 'bg-amber-400/20 text-amber-100' : 'bg-amber-50 text-amber-700')}`}>
                          {provider.configured ? 'Configured' : 'Missing credentials'}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${provider.supported ? (isSelected ? 'bg-violet-400/20 text-violet-100' : 'bg-violet-50 text-violet-700') : (isSelected ? 'bg-slate-200/20 text-slate-200' : 'bg-slate-200 text-slate-600')}`}>
                          {provider.supported ? 'Live flow' : 'Config only'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className={`text-lg font-black ${isSelected ? 'text-white' : 'text-slate-950'}`}>{provider.name}</h3>
                      <p className={`mt-2 text-sm leading-6 ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>{provider.description}</p>
                      <div className={`mt-4 text-xs font-bold uppercase tracking-[0.18em] ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                        Last updated: {formatDateTime(provider.lastUpdatedAt)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {selected && (
            <section className="space-y-6">
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Provider status</div>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">{selected.name}</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{selected.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void saveProvider(selected, !selected.enabled)}
                    disabled={savingProvider === selected.key}
                    className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black ${selected.enabled ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-950 text-white hover:bg-slate-800'} disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {selected.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    {selected.enabled ? 'Disable provider' : 'Enable provider'}
                  </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Status</div>
                    <div className="mt-2 text-lg font-black text-slate-950">{selected.enabled ? 'Active' : 'Inactive'}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Environment</div>
                    <div className={`mt-2 text-lg font-black ${selected.configured ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {selected.configured ? 'Configured' : 'Missing credentials'}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Last updated</div>
                    <div className="mt-2 text-lg font-black text-slate-950">{formatDateTime(selected.lastUpdatedAt)}</div>
                  </div>
                </div>
              </article>

              {!selected.supported && selected.key !== 'email-password' && (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700 shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                    <div>
                      This provider can be stored in the admin environment now, but only Google and Apple are wired to a live OAuth customer flow at the moment.
                    </div>
                  </div>
                </div>
              )}

              {!selected.configured && (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                    <div>
                      Required credentials are still missing for this provider. Save the missing values below to move the environment to a configured state.
                    </div>
                  </div>
                </div>
              )}

              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Credentials management</div>
                    <h3 className="mt-2 text-xl font-black text-slate-950">Environment-backed settings</h3>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Synced with `.env`
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  {selected.fields.map((field) => {
                    const isSecret = field.secret;
                    const draftValue = drafts[selected.key]?.[field.envName] ?? '';
                    const commonClassName = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:bg-white';
                    return (
                      <div key={field.envName} className={field.multiline ? 'md:col-span-2' : ''}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <label className="text-sm font-black text-slate-800">{field.label}</label>
                          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                            {field.required && <span className="rounded-full bg-red-50 px-2 py-1 text-red-600">Required</span>}
                            {field.configured ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">Configured</span> : <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-500">Empty</span>}
                          </div>
                        </div>
                        <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{field.envName}</div>
                        {field.kind === 'textarea' ? (
                          <textarea
                            value={draftValue}
                            onChange={(event) => updateFieldDraft(selected.key, field, event.target.value)}
                            placeholder={isSecret ? field.maskedValue || 'Paste a new secret value' : field.displayValue || `Enter ${field.label.toLowerCase()}`}
                            className={`${commonClassName} min-h-[140px]`}
                          />
                        ) : (
                          <input
                            type={isSecret ? 'password' : field.kind === 'url' ? 'url' : 'text'}
                            value={draftValue}
                            onChange={(event) => updateFieldDraft(selected.key, field, event.target.value)}
                            placeholder={isSecret ? field.maskedValue || 'Enter a new secret value' : `Enter ${field.label.toLowerCase()}`}
                            className={commonClassName}
                          />
                        )}
                        {field.description && <p className="mt-2 text-xs leading-6 text-slate-500">{field.description}</p>}
                        {isSecret && field.maskedValue && (
                          <p className="mt-2 text-xs leading-6 text-slate-500">Stored secret: {field.maskedValue}</p>
                        )}
                        {field.displayValue && !isSecret && (
                          <p className="mt-2 truncate text-xs leading-6 text-slate-500">Current value: {field.displayValue}</p>
                        )}
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => void clearField(selected, field)}
                            disabled={savingProvider === selected.key || !field.configured}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Clear stored value
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDrafts(buildDrafts(providers))}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                  >
                    Reset form
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveProvider(selected)}
                    disabled={savingProvider === selected.key}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {savingProvider === selected.key ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save provider
                  </button>
                </div>
              </article>
            </section>
          )}
        </div>
      )}
    </AdminWorkspace>
  );
};

export default RegisterAuthenticationAdmin;
