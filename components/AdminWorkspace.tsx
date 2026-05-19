import React from 'react';
import { ChevronRight, Home, PanelLeftOpen } from 'lucide-react';

export interface AdminWorkspaceCrumb {
  label: string;
  onClick?: () => void;
}

interface AdminWorkspaceProps {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: AdminWorkspaceCrumb[];
  actions?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}

export const AdminWorkspace: React.FC<AdminWorkspaceProps> = ({
  eyebrow,
  title,
  description,
  breadcrumbs = [],
  actions,
  sidebar,
  children
}) => (
  <div className="space-y-6">
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.96),rgba(15,23,42,0.88)_34%,rgba(30,41,59,0.9)_60%,rgba(203,213,225,0.3)_100%),linear-gradient(135deg,rgba(249,250,251,0.85),rgba(241,245,249,0.72))] p-6 text-white sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            {eyebrow && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-white/85">
                <PanelLeftOpen size={14} />
                {eyebrow}
              </div>
            )}
            {breadcrumbs.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
                <Home size={13} />
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={`${crumb.label}-${index}`}>
                    <ChevronRight size={12} className="text-slate-500" />
                    {crumb.onClick ? (
                      <button type="button" onClick={crumb.onClick} className="text-left text-slate-200 transition hover:text-white">
                        {crumb.label}
                      </button>
                    ) : (
                      <span className="text-white">{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
            <h1 className="text-3xl font-black leading-tight sm:text-4xl">{title}</h1>
            {description && (
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap gap-3 xl:justify-end">
              {actions}
            </div>
          )}
        </div>
      </div>
    </section>

    <div className="grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
      {sidebar && (
        <aside className="xl:sticky xl:top-28 xl:self-start">
          {sidebar}
        </aside>
      )}
      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  </div>
);

export const AdminPanelCard: React.FC<{
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, description, action, children, className = '' }) => (
  <section className={`overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm ${className}`.trim()}>
    {(title || description || action) && (
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          {title && <h2 className="text-lg font-black text-slate-950">{title}</h2>}
          {description && <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
    )}
    <div className="p-5 sm:p-6">{children}</div>
  </section>
);

export const AdminStickyActionBar: React.FC<{
  actions: React.ReactNode;
  note?: string;
}> = ({ actions, note }) => (
  <div className="sticky bottom-4 z-30 mt-6 rounded-[1.5rem] border border-slate-200 bg-white/95 p-3 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.45)] backdrop-blur">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Actions rapides</div>
        {note && <p className="mt-1 text-sm text-slate-500">{note}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  </div>
);

export const AdminEmptyState: React.FC<{
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
    <div className="mx-auto max-w-md">
      <h3 className="text-xl font-black text-slate-900">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  </div>
);
