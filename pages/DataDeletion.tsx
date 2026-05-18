import React, { useEffect } from 'react';
import { AlertTriangle, ArrowRight, BadgeInfo, Database, Mail, ShieldCheck, Trash2, UserRound, WalletCards } from 'lucide-react';
import { SiteConfig } from '../types';

interface DataDeletionProps {
  siteConfig: SiteConfig;
}

const deletionItems = [
  {
    icon: UserRound,
    title: 'Account information',
    text: 'Profile details associated with your Tunibots account, including your login identity and account preferences.'
  },
  {
    icon: ShieldCheck,
    title: 'Connected social login data',
    text: 'Facebook Login or Google Login data linked to your account, where connected and eligible for deletion.'
  },
  {
    icon: Database,
    title: 'Stored personal information',
    text: 'Personal details stored to operate your account, support access, and customer service communications.'
  },
  {
    icon: WalletCards,
    title: 'Purchase-related account data',
    text: 'Order-related account data may be deleted where legally applicable, while some records may be retained when required.'
  }
];

const requestSteps = [
  {
    title: 'Send your request by email',
    content: (
      <a
        href="mailto:support@tunibots.com"
        className="inline-flex items-center gap-2 text-sm font-black theme-text-accent hover:opacity-80"
      >
        <Mail size={18} />
        support@tunibots.com
      </a>
    )
  },
  {
    title: 'Include the information below',
    content: (
      <ul className="space-y-2 text-sm leading-7 text-slate-600">
        <li>Your account email</li>
        <li>Facebook or Google email, if connected</li>
        <li>Your username, if available</li>
      </ul>
    )
  },
  {
    title: 'Processing time',
    content: (
      <p className="text-sm leading-7 text-slate-600">
        Our support team will process the request within 7 business days.
      </p>
    )
  }
];

const upsertMeta = (selector: string, attrs: Record<string, string>) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  Object.entries(attrs).forEach(([key, value]) => element?.setAttribute(key, value));
};

const ensureCanonical = (href: string) => {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
};

const DataDeletion: React.FC<DataDeletionProps> = ({ siteConfig }) => {
  const brandName = siteConfig.siteName || 'Tunibots';
  const defaultDescription = siteConfig.seoDescription || siteConfig.footerDescription || '';

  useEffect(() => {
    const pageTitle = `User Data Deletion | ${brandName}`;
    const pageDescription = 'Request deletion of your Tunibots account, connected Facebook or Google login data, and associated personal information.';
    const canonicalUrl = `${window.location.origin}/data-deletion`;

    document.title = pageTitle;
    upsertMeta('meta[name="description"]', { name: 'description', content: pageDescription });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: pageTitle });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: pageDescription });
    ensureCanonical(canonicalUrl);

    return () => {
      document.title = siteConfig.seoTitle || brandName;
      upsertMeta('meta[name="description"]', { name: 'description', content: defaultDescription });
      upsertMeta('meta[property="og:title"]', { property: 'og:title', content: siteConfig.seoTitle || brandName });
      upsertMeta('meta[property="og:description"]', { property: 'og:description', content: defaultDescription });
      ensureCanonical(siteConfig.seoCanonicalUrl || window.location.origin);
    };
  }, [brandName, defaultDescription, siteConfig.seoCanonicalUrl, siteConfig.seoTitle]);

  return (
    <div className="animate-in fade-in duration-500">
      <section className="relative left-1/2 -mt-8 w-screen -translate-x-1/2 overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.35),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.22),transparent_35%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(15,23,42,0.78))]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-white/85 backdrop-blur">
              <Trash2 size={14} />
              Privacy Request
            </div>
            <h1 className="text-4xl font-black leading-tight sm:text-6xl">User Data Deletion</h1>
            <p className="mt-6 text-base leading-8 text-slate-200 sm:text-lg">
              Request deletion of your {brandName} account and associated personal data.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl space-y-8">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm lg:p-10">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl theme-bg-soft theme-text-accent">
                <Database size={24} />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.24em] theme-text-accent">Information</div>
                <h2 className="mt-2 text-2xl font-black text-slate-950">What users may request to be deleted</h2>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {deletionItems.map((item) => (
                <section key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm">
                    <item.icon size={22} />
                  </div>
                  <h3 className="text-lg font-black text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
                </section>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm lg:p-10">
            <div className="mb-8">
              <div className="mb-3 text-xs font-black uppercase tracking-[0.24em] theme-text-accent">How To Request Deletion</div>
              <h2 className="text-2xl font-black text-slate-950">A simple support workflow for Facebook Login, Google Login, and Tunibots accounts.</h2>
            </div>

            <ol className="space-y-5">
              {requestSteps.map((step, index) => (
                <li key={step.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                    {index + 1}
                  </div>
                  <div className="min-w-0 pt-1">
                    <h3 className="text-base font-black text-slate-950">{step.title}</h3>
                    <div className="mt-3">{step.content}</div>
                  </div>
                </li>
              ))}
            </ol>
          </article>

          <aside className="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 shadow-sm lg:p-10" aria-labelledby="important-notice-title">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <AlertTriangle size={24} />
              </div>
              <div>
                <div className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-amber-800">
                  <BadgeInfo size={14} />
                  Important Notice
                </div>
                <h2 id="important-notice-title" className="text-xl font-black text-slate-950">Retention requirements may still apply.</h2>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  Certain transaction or billing records may be retained temporarily where required for fraud prevention, security, or legal compliance.
                </p>
              </div>
            </div>
          </aside>

          <section className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                  <Mail size={14} />
                  Contact
                </div>
                <h2 className="text-2xl font-black">Need to submit a deletion request?</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  Contact our support team from the email address associated with your account for faster verification.
                </p>
              </div>
              <a
                href="mailto:support@tunibots.com"
                className="theme-btn inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black"
              >
                support@tunibots.com
                <ArrowRight size={18} />
              </a>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
};

export default DataDeletion;
