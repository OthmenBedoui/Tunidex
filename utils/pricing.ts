import { DiscountType, Listing, ProductVariant } from '../types';

export const getListingDiscountType = (listing: Pick<Listing, 'discountType' | 'discountPercent' | 'discountValue'>): DiscountType => {
  if (listing.discountType === DiscountType.AMOUNT || listing.discountType === DiscountType.PERCENT) {
    return listing.discountType;
  }
  if ((listing.discountPercent || 0) > 0) {
    return DiscountType.PERCENT;
  }
  return DiscountType.NONE;
};

export const getListingDiscountValue = (listing: Pick<Listing, 'discountType' | 'discountPercent' | 'discountValue'>) => {
  const type = getListingDiscountType(listing);
  if (type === DiscountType.PERCENT) {
    return Number(listing.discountValue ?? listing.discountPercent ?? 0) || 0;
  }
  if (type === DiscountType.AMOUNT) {
    return Number(listing.discountValue ?? 0) || 0;
  }
  return 0;
};

export const getListingFinalPrice = (listing: Pick<Listing, 'price' | 'discountType' | 'discountPercent' | 'discountValue'>) => {
  const type = getListingDiscountType(listing);
  const value = getListingDiscountValue(listing);

  if (type === DiscountType.PERCENT) {
    return Math.max(0, listing.price * (1 - value / 100));
  }

  if (type === DiscountType.AMOUNT) {
    return Math.max(0, listing.price - value);
  }

  return listing.price;
};

export const getListingVariants = (listing: Pick<Listing, 'variants'>): ProductVariant[] => {
  return Array.isArray(listing.variants)
    ? listing.variants
        .filter((variant) => variant && Number.isFinite(Number(variant.price)))
        .sort((a, b) => (a.order || 0) - (b.order || 0) || a.price - b.price)
    : [];
};

export const hasListingVariants = (listing: Pick<Listing, 'variants'>) => getListingVariants(listing).length > 0;

export const getListingMinimumVariantPrice = (listing: Pick<Listing, 'variants'>) => {
  const variants = getListingVariants(listing);
  if (variants.length === 0) return null;
  return Math.min(...variants.map((variant) => Number(variant.price)));
};

export const getListingDisplayPrice = (listing: Pick<Listing, 'price' | 'discountType' | 'discountPercent' | 'discountValue' | 'variants'>) => {
  return getListingMinimumVariantPrice(listing) ?? getListingFinalPrice(listing);
};

export const hasListingDiscount = (listing: Pick<Listing, 'discountType' | 'discountPercent' | 'discountValue'>) => {
  return getListingDiscountType(listing) !== DiscountType.NONE && getListingDiscountValue(listing) > 0;
};

export const getListingDiscountLabel = (listing: Pick<Listing, 'discountType' | 'discountPercent' | 'discountValue'>) => {
  const type = getListingDiscountType(listing);
  const value = getListingDiscountValue(listing);

  if (type === DiscountType.PERCENT && value > 0) {
    return `-${Math.round(value)}%`;
  }

  if (type === DiscountType.AMOUNT && value > 0) {
    return `-${value.toFixed(2)} TND`;
  }

  return '';
};

export const getPackageOriginalTotal = (listing: Pick<Listing, 'packageItems'>) => {
  if (!listing.packageItems?.length) return 0;

  return listing.packageItems.reduce((total, item) => {
    if (!item.includedListing) return total;
    return total + getListingFinalPrice(item.includedListing) * item.quantity;
  }, 0);
};

export const getPackageSavings = (listing: Pick<Listing, 'price' | 'discountType' | 'discountPercent' | 'discountValue' | 'packageItems'>) => {
  const originalTotal = getPackageOriginalTotal(listing);
  return Math.max(0, originalTotal - getListingFinalPrice(listing));
};

export const hasPackageSavings = (listing: Pick<Listing, 'price' | 'discountType' | 'discountPercent' | 'discountValue' | 'packageItems'>) => {
  return getPackageSavings(listing) > 0;
};
