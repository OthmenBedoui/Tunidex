import React from 'react';
import { ProductVariant } from '../types';

interface ProductVariationsProps {
  variants: ProductVariant[];
  selectedVariantId: string;
  onSelect: (variantId: string) => void;
}

const ProductVariations: React.FC<ProductVariationsProps> = ({ variants, selectedVariantId, onSelect }) => {
  if (variants.length === 0) return null;

  return (
    <section id="product-variations" className="mt-4 text-[var(--text-strong)]">
      <div className="flex flex-wrap gap-3">
        {variants.map((variant) => {
          const checked = selectedVariantId === variant.id;
          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelect(variant.id || '')}
              className={`flex h-[84px] w-full max-w-[212px] items-start justify-between rounded-lg border p-3 text-left transition ${
                checked ? 'border-blue-500 bg-blue-500/10' : 'border-[var(--border-soft)] bg-[var(--surface-card)] hover:bg-[var(--surface-soft)]'
              }`}
            >
              <div>
                <div className="text-sm font-black">{variant.name}</div>
                <div className="mt-6 text-sm text-[var(--text-muted)]">from TND {Number(variant.price).toFixed(2)}</div>
              </div>
              <span className={`h-5 w-5 rounded-full border-2 ${checked ? 'border-blue-500 bg-blue-500 shadow-[inset_0_0_0_4px_var(--surface-card)]' : 'border-[var(--text-muted)]'}`} />
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ProductVariations;
