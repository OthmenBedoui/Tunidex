import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { sanitizeRichText } from '../utils/richText';

interface ProductInfoModalProps {
  title: string;
  content: string;
  onClose: () => void;
}

const ProductInfoModal: React.FC<ProductInfoModalProps> = ({ title, content, onClose }) => createPortal(
  <div className="fixed inset-0 z-[120] flex min-h-dvh items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
    <div className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] text-[var(--text-strong)] shadow-2xl">
      <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
        <h3 className="text-lg font-black">{title}</h3>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-strong)]">
          <X size={18} />
        </button>
      </div>
      <div
        className="rich-product-description max-h-[65vh] overflow-y-auto p-5 text-sm leading-7 text-[var(--text-body)]"
        dangerouslySetInnerHTML={{ __html: sanitizeRichText(content || '<p>Aucune information disponible.</p>') }}
      />
    </div>
  </div>,
  document.body
);

export default ProductInfoModal;
