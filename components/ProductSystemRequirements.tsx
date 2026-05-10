import React from 'react';
import { Cpu, HardDrive, MemoryStick, Monitor, PcCase } from 'lucide-react';
import { Listing } from '../types';

interface ProductSystemRequirementsProps {
  product: Listing;
}

const requirementItems = (prefix: 'minimum' | 'recommended', product: Listing) => [
  { label: 'OS:', value: prefix === 'minimum' ? product.minimumOs : product.recommendedOs, icon: Monitor },
  { label: 'Memory:', value: prefix === 'minimum' ? product.minimumMemory : product.recommendedMemory, icon: MemoryStick },
  { label: 'Storage:', value: prefix === 'minimum' ? product.minimumStorage : product.recommendedStorage, icon: HardDrive },
  { label: 'Processor:', value: prefix === 'minimum' ? product.minimumProcessor : product.recommendedProcessor, icon: Cpu },
  { label: 'Graphics:', value: prefix === 'minimum' ? product.minimumGraphics : product.recommendedGraphics, icon: PcCase }
].filter((item) => item.value);

const RequirementGroup = ({ title, items }: { title: string; items: ReturnType<typeof requirementItems> }) => {
  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="text-base font-black text-[var(--text-strong)]">{title}</h3>
      <div className="mt-7 grid grid-cols-1 gap-x-16 gap-y-8 md:grid-cols-2">
        {items.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-start gap-4">
            <Icon size={22} className="mt-1 shrink-0 text-blue-500" />
            <div>
              <div className="text-base font-black text-[var(--text-muted)]">{label}</div>
              <div className="mt-1 text-sm font-black leading-6 text-[var(--text-strong)]">{value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductSystemRequirements: React.FC<ProductSystemRequirementsProps> = ({ product }) => {
  const minimum = requirementItems('minimum', product);
  const recommended = requirementItems('recommended', product);

  if (!product.systemRequirementsEnabled || (minimum.length === 0 && recommended.length === 0)) return null;

  return (
    <section id="system-requirements" className="mt-8">
      <h2 className="mb-5 text-2xl font-black text-[var(--text-strong)]">System Requirements</h2>
      <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] p-6">
        <div className="mb-8 flex items-center gap-3 text-sm font-black text-[var(--text-muted)]">
          <span>System :</span>
          <span className="rounded-full bg-blue-600/25 px-4 py-1.5 text-blue-500">{product.systemRequirementsPlatform || product.platform || 'Windows'}</span>
        </div>
        <div className="space-y-11">
          <RequirementGroup title="Minimum System Requirements" items={minimum} />
          <RequirementGroup title="Recommended System Requirements" items={recommended} />
        </div>
      </div>
    </section>
  );
};

export default ProductSystemRequirements;
