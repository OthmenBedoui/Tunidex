import React, { useState } from 'react';
import { sanitizeRichText } from '../utils/richText';

interface ProductDescriptionCardProps {
  title: string;
  description: string;
  tags?: string[];
}

const ProductDescriptionCard: React.FC<ProductDescriptionCardProps> = ({ title, description, tags = [] }) => {
  const [expanded, setExpanded] = useState(false);
  const cleanDescription = sanitizeRichText(description || '<p>Aucune description disponible.</p>');

  return (
    <section className="mt-8">
      <h2 className="mb-5 text-2xl font-black text-[var(--text-strong)]">Product description</h2>
      <div className="overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] p-6">
        <h3 className="text-2xl font-black leading-tight text-[var(--text-strong)]">A propos {title}</h3>
        {tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-[var(--surface-soft)] px-4 py-2 text-sm font-black text-[var(--text-strong)]">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="relative mt-6">
          <div
            className={`rich-product-description max-w-none text-base font-semibold leading-8 text-[var(--text-body)] ${expanded ? '' : 'max-h-[104px] overflow-hidden'}`}
            dangerouslySetInnerHTML={{ __html: cleanDescription }}
          />
          {!expanded && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-[var(--surface-card)]" />
          )}
        </div>
        <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-5 text-base font-black text-[var(--text-strong)] hover:text-blue-500">
          {expanded ? 'Read less' : 'Read more'}
        </button>
      </div>
    </section>
  );
};

export default ProductDescriptionCard;
