import React from 'react';
import { BadgeCheck, Headphones, ShoppingBag, ShoppingCart, Zap } from 'lucide-react';
import { Listing, ProductVariant } from '../types';
import { getListingFinalPrice, hasListingDiscount } from '../utils/pricing';

interface ProductPriceCardProps {
  product: Listing;
  selectedVariant?: ProductVariant;
  offerCount?: number;
  onBuyNow: () => void;
  onAddToCart: () => void;
}

const ProductPriceCard: React.FC<ProductPriceCardProps> = ({ product, selectedVariant, offerCount = 0, onBuyNow, onAddToCart }) => {
  const price = selectedVariant?.price ?? getListingFinalPrice(product);
  const originalPrice = product.price;
  const discounted = !selectedVariant && hasListingDiscount(product);
  const plusPrice = Math.max(price * 0.92, 0);

  return (
    <aside className="sticky top-24 hidden w-full overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] text-[var(--text-strong)] shadow-sm xl:block xl:w-[345px]">
      <div className="bg-gradient-to-r from-[color-mix(in_srgb,var(--theme-accent)_24%,var(--surface-card))] to-[color-mix(in_srgb,var(--theme-accent)_44%,var(--surface-card))] px-4 py-4">
        <div className="text-xs font-black text-emerald-400">Save 8% with plus</div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="text-2xl font-black">TND {plusPrice.toFixed(2)}</div>
          {product.isInstant && <span className="rounded-full border border-yellow-300 px-2 py-1 text-[10px] font-black uppercase text-yellow-300"><Zap size={11} className="mr-1 inline fill-current" /> Instant</span>}
        </div>
      </div>

      <div className="border-t border-[var(--border-soft)] px-4 py-4">
        <div className="text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)]">Featured Offer</div>
        <div className="mt-2 flex items-end gap-3">
          <div className="text-2xl font-black">TND {price.toFixed(2)}</div>
          {discounted && <div className="pb-1 text-sm font-bold text-[var(--text-muted)] line-through">TND {originalPrice.toFixed(2)}</div>}
        </div>
      </div>

      <div className="border-t border-[var(--border-soft)] px-4 py-3">
        <div className="mb-4 text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)]">Price not final</div>
        <div className="grid grid-cols-[48px_1fr] gap-3">
          <button type="button" onClick={onAddToCart} className="flex h-12 items-center justify-center rounded-lg bg-[var(--surface-soft)] text-[var(--text-strong)] transition hover:brightness-105">
            <ShoppingCart size={22} />
          </button>
          <button type="button" onClick={onBuyNow} className="flex h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-700 px-4 text-sm font-black text-white transition hover:brightness-110">
            <ShoppingBag size={18} /> Buy now
          </button>
        </div>
      </div>

      <div className="mx-4 mt-4 flex h-14 items-center justify-between rounded-lg border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 text-sm font-black text-purple-500">
        <span className="rounded-md border border-purple-500 px-2 py-1 text-xs">plus</span>
        <span className="flex-1 px-2">Explore Plus Benefits</span>
        <span className="text-xl leading-none">›</span>
      </div>

      <div className="mx-4 mt-4 grid grid-cols-3 overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-muted)] text-xs font-bold text-[var(--text-body)]">
        <div className="flex items-center gap-2 border-r border-[var(--border-soft)] px-3 py-3"><Zap size={16} className="text-yellow-400 fill-current" /> Instant<br />Delivery</div>
        <div className="flex items-center gap-2 border-r border-[var(--border-soft)] px-3 py-3"><Headphones size={16} className="text-emerald-500" /> 24/7<br />Support</div>
        <div className="flex items-center gap-2 px-3 py-3"><BadgeCheck size={16} className="text-blue-500 fill-current" /> Verified<br />Seller</div>
      </div>

      <div className="mx-auto mb-4 mt-3 w-fit rounded-full bg-blue-600 px-4 py-2 text-sm font-black text-blue-100">
        +{Math.max(offerCount, 4)} offers starting at TND {price.toFixed(2)}
      </div>
    </aside>
  );
};

export default ProductPriceCard;
