import React, { useState } from 'react';
import { CheckCircle2, ChevronRight, Eye, Gamepad2, Globe2, Heart, MonitorPlay, Star } from 'lucide-react';
import { Category, Listing, ProductVariant } from '../types';
import ProductInfoModal from '../components/ProductInfoModal';
import ProductPriceCard from '../components/ProductPriceCard';
import ProductVariations from '../components/ProductVariations';
import ProductDescriptionCard from '../components/ProductDescriptionCard';
import ProductSystemRequirements from '../components/ProductSystemRequirements';
import { getListingFinalPrice } from '../utils/pricing';

interface ProductPageProps {
  product: Listing;
  categories: Category[];
  selectedVariantId: string;
  onSelectVariant: (variantId: string) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  navigateTo: (page: string, slug?: string) => void;
}

type ModalState = { title: string; content: string } | null;

const ProductPage: React.FC<ProductPageProps> = ({ product, categories, selectedVariantId, onSelectVariant, onAddToCart, onBuyNow, navigateTo }) => {
  const [modal, setModal] = useState<ModalState>(null);
  const variants = product.variants || [];
  const selectedVariant: ProductVariant | undefined = variants.find((variant) => variant.id === selectedVariantId);
  const mobilePrice = selectedVariant?.price ?? getListingFinalPrice(product);
  const category = product.category || categories.find((item) => item.id === product.categoryId);
  const platform = product.platform || product.game || 'Digital';
  const region = product.region || 'Global';
  const activationCountry = product.activationCountry || 'Tunisia';
  const isGlobalRegion = ['global', 'globale', 'worldwide'].includes(region.trim().toLowerCase());
  const descriptionTags = [category?.name, product.game, platform].filter((tag, index, items): tag is string => Boolean(tag) && items.indexOf(tag) === index).slice(0, 3);
  const infoButtons = [
    {
      label: product.restrictionsTitle || 'Check Restrictions',
      title: product.restrictionsTitle || 'Check Restrictions',
      content: isGlobalRegion
        ? `<p><strong>${activationCountry}</strong> est compatible avec cette offre. Ce produit est disponible en région globale.</p>`
        : product.restrictionsContent || `<p>Cette offre est limitée à la région <strong>${region}</strong>.</p>`
    },
    { label: product.activationGuideTitle || 'Activation Guide', title: product.activationGuideTitle || 'Activation Guide', content: product.activationGuideContent || '<p>No activation guide has been added for this product.</p>' },
    { label: product.regionTitle || 'Region', title: product.regionTitle || 'Region', content: product.regionContent || `<p>Region: ${region}</p>` }
  ];

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 bg-[var(--surface-page)] px-4 py-6 pb-28 text-[var(--text-strong)] md:px-6 lg:pb-8">
      {modal && <ProductInfoModal title={modal.title} content={modal.content} onClose={() => setModal(null)} />}
      <div className="mx-auto max-w-[1520px]">
        <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--text-muted)]">
          <button onClick={() => navigateTo('home')} className="hover:text-[var(--text-strong)]">Home</button>
          <ChevronRight size={14} />
          {category && <button onClick={() => navigateTo('category', category.slug)} className="hover:text-[var(--text-strong)]">{category.name}</button>}
          <ChevronRight size={14} />
          <span className="line-clamp-1 max-w-[360px] text-[var(--text-body)]">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_345px]">
          <div className="min-w-0">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-[188px_minmax(0,1fr)]">
              <div className="relative h-[280px] w-full overflow-hidden rounded-[10px] bg-[var(--surface-card)] shadow-sm md:w-[188px]">
                <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
                <button type="button" className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-900 shadow-lg">
                  <Eye size={15} /> View
                </button>
              </div>

              <main className="min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="text-[22px] font-black leading-tight text-[var(--text-strong)] md:text-[24px]">{product.title}</h1>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-black uppercase text-white">{category?.name || 'Game'}</span>
                      <span className="rounded-md bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-black uppercase text-[var(--text-strong)]">Digital Key</span>
                      <span className="hidden h-6 w-px bg-[var(--border-soft)] sm:block" />
                      <span className="flex items-center gap-1 text-amber-400">
                        {[...Array(4)].map((_, index) => <Star key={index} size={17} fill="currentColor" />)}
                        <Star size={17} className="text-[var(--text-muted)]" fill="currentColor" />
                      </span>
                    </div>
                  </div>
                  <button type="button" className="mt-1 text-[var(--text-muted)] transition hover:text-rose-500">
                    <Heart size={22} fill="currentColor" />
                  </button>
                </div>

                <div className="mt-8 border-t border-[var(--border-soft)] pt-7">
                  <div className="grid grid-cols-1 gap-x-14 gap-y-6 lg:grid-cols-2">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)]">
                        <CheckCircle2 size={30} className="text-emerald-500" />
                      </div>
                      <div className="min-w-0 text-sm text-[var(--text-body)]">
                        <div>Can be activated in <span className="font-black text-[var(--text-strong)]">{activationCountry}</span></div>
                        <button type="button" onClick={() => setModal(infoButtons[0])} className="mt-1 text-xs font-black text-blue-500 hover:text-blue-400">
                          {infoButtons[0].label}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)]">
                        <Globe2 size={30} className="text-blue-500" />
                      </div>
                      <div className="min-w-0 text-sm text-[var(--text-body)]">
                        <div>Region: <span className="font-black text-[var(--text-strong)]">{region}</span></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)]">
                        <Gamepad2 size={30} className="text-sky-500" />
                      </div>
                      <div className="min-w-0 text-sm text-[var(--text-body)]">
                        <div>Platform: <span className="font-black text-[var(--text-strong)]">{platform}</span></div>
                        <button type="button" onClick={() => setModal(infoButtons[1])} className="mt-1 text-xs font-black text-blue-500 hover:text-blue-400">
                          {infoButtons[1].label}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)]">
                        <MonitorPlay size={30} className="text-blue-500" />
                      </div>
                      <div className="min-w-0 text-sm text-[var(--text-body)]">
                        <div>Works on: <span className="font-black text-[var(--text-strong)]">Windows</span></div>
                        <button type="button" onClick={() => document.getElementById('system-requirements')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="mt-1 text-xs font-black text-blue-500 hover:text-blue-400">
                          System Requirements
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </main>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-[var(--border-soft)] pt-6 sm:flex-row sm:items-center">
              <label className="text-base font-black text-[var(--text-strong)]">Region</label>
              <div className="flex h-11 w-full items-center justify-between rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] px-4 text-sm font-black text-[var(--text-strong)] sm:w-[235px]">
                {region}
                <ChevronRight size={16} className="rotate-90 text-[var(--text-muted)]" />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[var(--border-soft)] pt-5">
              <div />
              {variants.length > 0 && <a href="#product-variations" className="text-sm font-bold text-blue-500 hover:text-blue-400">All Variations</a>}
            </div>

            <ProductVariations variants={variants} selectedVariantId={selectedVariantId} onSelect={onSelectVariant} />

            <ProductDescriptionCard title={product.title} description={product.description} tags={descriptionTags} />
            <ProductSystemRequirements product={product} />
          </div>

          <ProductPriceCard product={product} selectedVariant={selectedVariant} offerCount={variants.length} onAddToCart={onAddToCart} onBuyNow={onBuyNow} />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border-soft)] bg-[color-mix(in_srgb,var(--surface-card)_94%,transparent)] px-4 py-3 text-[var(--text-strong)] shadow-2xl backdrop-blur-xl xl:hidden">
        <div className="mx-auto flex max-w-[1224px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)]">Featured Offer</div>
            <div className="text-xl font-black">TND {mobilePrice.toFixed(2)}</div>
          </div>
          <button type="button" onClick={onAddToCart} className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3 text-xs font-black uppercase text-[var(--text-strong)]">
            Cart
          </button>
          <button type="button" onClick={onBuyNow} className="rounded-xl bg-emerald-500 px-5 py-3 text-xs font-black uppercase text-black">
            Buy now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
