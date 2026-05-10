
import React from 'react';
import { Listing, Category, SiteConfig } from '../types';
import { ArrowRight, ChevronLeft, ChevronRight, Zap, Star, Shield, Tag } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getListingDiscountLabel, getListingFinalPrice, getPackageSavings, hasListingDiscount, hasPackageSavings } from '../utils/pricing';
import PriceDisplay from '../components/PriceDisplay';
import { getMergedStoreSections, isStoreSectionEnabled } from '../utils/storeSections';

interface HomeProps {
  listings: Listing[];
  categories: Category[];
  onViewProduct: (listing: Listing) => void;
  navigateTo: (page: string, slug?: string) => void;
  siteConfig: SiteConfig;
}

const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
  const icons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>;
  const IconComponent = icons[name] || icons[name.trim()] || icons.Package;
  return <IconComponent size={24} className={className} />;
};

const isVideoMedia = (src?: string, mediaType?: 'image' | 'video') => {
  if (mediaType === 'video') return true;
  if (!src) return false;
  return src.startsWith('data:video/') || /\.(mp4|webm)(\?|#|$)/i.test(src);
};

const HorizontalListingCard: React.FC<{ listing: Listing; onViewProduct: (listing: Listing) => void }> = ({ listing, onViewProduct }) => {
  const hasDiscount = hasListingDiscount(listing);
  const discountedPrice = getListingFinalPrice(listing);
  const discountLabel = getListingDiscountLabel(listing);

  return (
    <article className="min-w-[280px] max-w-[280px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:border-indigo-100 transition-all duration-300 flex flex-col group snap-start">
      <div className="relative h-48 overflow-hidden bg-slate-100">
        <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">{listing.game}</div>
        {listing.isPackage && (
          <div className="absolute left-3 top-12 rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-black text-white shadow-lg">
            Package
          </div>
        )}
        {listing.isInstant && (
          <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-md font-bold flex items-center shadow-sm">
            <Zap size={10} className="mr-1 fill-current" /> Instant
          </div>
        )}
        {hasDiscount && (
          <div className="absolute left-3 bottom-3 rounded-full bg-rose-500 px-3 py-1 text-[11px] font-black text-white shadow-lg">
            {discountLabel}
          </div>
        )}
        {listing.logoUrl && <img src={listing.logoUrl} alt={`${listing.game || listing.title} logo`} className="absolute bottom-2 right-2 w-8 h-8 rounded bg-white p-1 shadow-sm" />}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        {listing.isPackage && hasPackageSavings(listing) && (
          <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
            Gain client: {getPackageSavings(listing).toFixed(2)} TND
          </div>
        )}
        <div className="flex items-center space-x-1 mb-2">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
          </div>
          <span className="text-xs text-slate-400">(4.9)</span>
        </div>
        <h3 className="font-bold text-slate-900 text-base mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => onViewProduct(listing)}>
          {listing.title}
        </h3>
        <div className="mt-auto pt-4 border-t border-slate-50 flex items-end justify-between gap-3">
          <PriceDisplay listing={listing} priceClassName="text-xl font-black text-slate-900" />
          <button onClick={() => onViewProduct(listing)} className="bg-slate-100 text-slate-900 hover:bg-slate-900 hover:text-white p-2 rounded-lg transition-colors">
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </article>
  );
};

const ProductRailSection: React.FC<{
  railId: string;
  title: string;
  subtitle: string;
  listings: Listing[];
  onViewProduct: (listing: Listing) => void;
  accent?: React.ReactNode;
}> = ({ railId, title, subtitle, listings, onViewProduct, accent }) => {
  const scrollRail = (direction: 'left' | 'right') => {
    const rail = document.getElementById(railId);
    if (!rail) return;
    rail.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  if (listings.length === 0) return null;

  return (
    <section>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-3xl font-black text-slate-900">{title}</h2>
            {accent}
          </div>
          <p className="text-slate-500">{subtitle}</p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button type="button" onClick={() => scrollRail('left')} className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50">
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => scrollRail('right')} className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div id={railId} className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
        {listings.map((listing) => (
          <HorizontalListingCard key={listing.id} listing={listing} onViewProduct={onViewProduct} />
        ))}
      </div>
    </section>
  );
};

const Home: React.FC<HomeProps> = ({ listings, categories, onViewProduct, navigateTo, siteConfig }) => {
  const packageListings = listings.filter((listing) => listing.isPackage);
  const featuredListings = listings.slice(0, 12);
  const topProductListings = [...listings]
    .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
    .slice(0, 12);
  const giftCardListings = listings
    .filter((listing) => {
      const text = `${listing.title} ${listing.game || ''} ${listing.category?.name || ''} ${listing.subCategory?.name || ''}`.toLowerCase();
      return text.includes('gift') || text.includes('carte cadeau') || text.includes('gift card');
    })
    .slice(0, 12);
  const discountedListings = listings
    .filter((listing) => hasListingDiscount(listing))
    .sort((a, b) => getListingFinalPrice(a) - getListingFinalPrice(b));
  const storeSections = getMergedStoreSections(siteConfig);
  const sectionEnabled = (sectionId: string) => isStoreSectionEnabled(siteConfig, sectionId);
  const sectionOrder = (sectionId: string) => storeSections.find((section) => section.id === sectionId)?.order || 999;
  const heroSlides = siteConfig.heroSlides?.filter((slide) => slide.imageUrl) || [];
  const heroPromoBanners = siteConfig.heroPromoBanners?.filter((banner) => banner.imageUrl) || [];
  const floatingBrandCards = siteConfig.floatingBrandCards?.filter((card) => card.imageUrl) || [];
  const coverListings = (siteConfig.coverListingIds || [])
    .map((id) => listings.find((listing) => listing.id === id && !listing.isArchived))
    .filter((listing): listing is Listing => Boolean(listing));
  const coverCardListings = coverListings.length > 0 ? coverListings.slice(0, 5) : featuredListings.slice(0, 5);
  const coverBackgroundUrl = siteConfig.coverBackgroundUrl || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80';
  const [activeSlideIndex, setActiveSlideIndex] = React.useState(0);

  React.useEffect(() => {
    if (heroSlides.length <= 1) return;
    const interval = window.setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [heroSlides.length]);

  React.useEffect(() => {
    if (activeSlideIndex >= heroSlides.length) {
      setActiveSlideIndex(0);
    }
  }, [activeSlideIndex, heroSlides.length]);

  const activeSlide = heroSlides[activeSlideIndex];
  const renderHeroPromoBanner = (banner: typeof heroPromoBanners[number] | undefined, className: string) => {
    if (!banner) return <div className={`${className} rounded-2xl bg-slate-200/60`} />;

    return (
      <button
        key={banner.id}
        type="button"
        onClick={() => handleHeroLink(banner.linkType, banner.linkTarget)}
        className={`group relative overflow-hidden rounded-2xl bg-slate-900 text-left shadow-sm transition hover:brightness-110 ${className}`}
      >
        <img src={banner.imageUrl} alt={banner.alt || ''} className="absolute inset-0 h-full w-full object-cover" />
      </button>
    );
  };

  const handleHeroLink = (linkType?: 'listing' | 'category' | 'url' | 'collections', linkTarget?: string) => {
    if (!linkType || linkType === 'collections') {
      document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (linkType === 'listing' && linkTarget) {
      const listing = listings.find((item) => item.id === linkTarget);
      if (listing) onViewProduct(listing);
      return;
    }

    if (linkType === 'category' && linkTarget) {
      navigateTo('category', linkTarget);
      return;
    }

    if (linkType === 'url' && linkTarget) {
      window.open(linkTarget, '_blank', 'noopener,noreferrer');
    }
  };

  const handleHeroAction = () => {
    handleHeroLink(activeSlide?.linkType, activeSlide?.linkTarget);
  };

  return (
    <div className="flex flex-col gap-16 animate-in fade-in duration-500">
      {sectionEnabled('store-cover') && (
      <section className="relative left-1/2 -mt-8 w-screen -translate-x-1/2 overflow-hidden bg-slate-950" style={{ order: sectionOrder('store-cover') }}>
        <div className="relative">
          <img
            className="absolute inset-0 h-full w-full object-cover opacity-35"
            src={coverBackgroundUrl}
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-white/0 to-white/10" />

          <div className="relative mx-auto flex w-full max-w-[1170px] flex-col px-4 py-[50px] pb-[70px]">
            <div className="w-full overflow-x-auto pb-2 no-scrollbar">
              <div className="flex snap-x snap-mandatory gap-5 lg:grid lg:grid-cols-4 lg:gap-8 lg:snap-none">
                {coverCardListings.map((listing) => (
                  <button
                    key={listing.id}
                    type="button"
                    onClick={() => onViewProduct(listing)}
                    className="group relative h-[340px] w-[292px] shrink-0 snap-center overflow-hidden rounded-2xl bg-slate-900 text-left shadow-2xl transition duration-300 hover:shadow-xl lg:h-[432px] lg:w-full lg:hover:scale-105"
                  >
                    <img src={listing.imageUrl} alt={listing.title} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
                    {hasListingDiscount(listing) && (
                      <div className="absolute left-4 top-3 rounded-full bg-gradient-to-b from-amber-400 to-amber-700 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                        {getListingDiscountLabel(listing)}
                      </div>
                    )}
                    {listing.isInstant && (
                      <div className="absolute right-4 top-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                        Instant
                      </div>
                    )}
                    {listing.logoUrl && <img src={listing.logoUrl} alt="" className="absolute right-4 bottom-32 h-10 w-10 rounded-lg bg-white p-1 shadow" />}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-transparent via-black/65 to-black/95 p-4 text-white">
                      <h3 className="line-clamp-3 text-2xl font-black uppercase leading-tight lg:text-3xl">{listing.title}</h3>
                      <div className="mt-2 truncate text-sm font-bold text-slate-200">
                        {listing.game || 'Digital'} · GLOBAL
                      </div>
                      <div className="mt-3 text-xs font-black uppercase text-slate-300">Sponsorisé</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {sectionEnabled('hero-slider') && (
      <section className="w-full" style={{ order: sectionOrder('hero-slider') }}>
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-4 lg:h-[clamp(430px,39vw,562px)] lg:grid-cols-3 lg:grid-rows-4">
          <div className="relative aspect-[1440/630] overflow-hidden rounded-2xl bg-slate-900 shadow-xl lg:col-span-2 lg:row-span-3 lg:aspect-auto">
            <button type="button" onClick={handleHeroAction} className="absolute inset-0 block w-full text-left">
              {isVideoMedia(activeSlide?.imageUrl, activeSlide?.mediaType) ? (
                <video
                  key={activeSlide?.imageUrl}
                  className="absolute inset-0 h-full w-full object-cover transition-all duration-700"
                  src={activeSlide?.imageUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  className="absolute inset-0 h-full w-full object-cover transition-all duration-700"
                  src={activeSlide?.imageUrl || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80'}
                  alt={activeSlide?.title || 'Slide'}
                />
              )}
            </button>

            {heroSlides.length > 1 && (
              <>
                <button type="button" onClick={() => setActiveSlideIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)} className="absolute left-5 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/15 text-white transition hover:bg-black/35">
                  <ChevronLeft size={34} strokeWidth={3} />
                </button>
                <button type="button" onClick={() => setActiveSlideIndex((prev) => (prev + 1) % heroSlides.length)} className="absolute right-5 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/15 text-white transition hover:bg-black/35">
                  <ChevronRight size={34} strokeWidth={3} />
                </button>
                <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 rounded-full bg-black/60 px-2 py-1.5">
                  {heroSlides.map((slide, index) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setActiveSlideIndex(index)}
                      className={`mx-1 h-3 w-3 rounded-full bg-white transition-opacity ${index === activeSlideIndex ? 'opacity-80' : 'opacity-25 hover:opacity-60'}`}
                      aria-label={`Aller au slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {renderHeroPromoBanner(heroPromoBanners[0], 'aspect-[1380/700] lg:col-start-3 lg:row-span-2 lg:aspect-auto')}
          {renderHeroPromoBanner(heroPromoBanners[1], 'aspect-[1380/400] lg:col-start-3 lg:row-start-3 lg:aspect-auto')}
          {renderHeroPromoBanner(heroPromoBanners[2], 'aspect-[1380/400] lg:col-start-3 lg:row-start-4 lg:aspect-auto')}
          {renderHeroPromoBanner(heroPromoBanners[3], 'aspect-[1380/400] lg:col-start-1 lg:row-start-4 lg:aspect-auto')}
          {renderHeroPromoBanner(heroPromoBanners[4], 'aspect-[1380/400] lg:col-start-2 lg:row-start-4 lg:aspect-auto')}
        </div>
      </section>
      )}

      {sectionEnabled('floating-brand-cards') && floatingBrandCards.length > 0 && (
      <section className="relative left-1/2 w-screen -translate-x-1/2 border-y border-slate-200/60 bg-white/55 py-12 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55" style={{ order: sectionOrder('floating-brand-cards') }}>
        <div className="mx-auto max-w-[1224px] overflow-hidden px-4 sm:px-6 lg:px-0">
          <div className="no-scrollbar overflow-hidden">
            <div className="floating-brand-marquee flex w-max gap-4 pr-4">
              {[...floatingBrandCards, ...floatingBrandCards].map((card, index) => (
              <button
                key={`${card.id}-${index}`}
                type="button"
                onClick={() => handleHeroLink(card.linkType, card.linkTarget)}
                className="group relative h-[82px] w-[150px] shrink-0 overflow-hidden rounded-[10px] transition duration-200 hover:-translate-y-1 hover:brightness-110 md:h-[100px] md:w-[190px] lg:h-[112px] lg:w-[215px]"
              >
                <img src={card.imageUrl} alt={card.name} className="h-full w-full object-cover" />
              </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      )}

      {sectionEnabled('collections') && (
      <section id="collections" style={{ order: sectionOrder('collections') }}>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Collections Populaires</h2>
            <p className="text-slate-500">Découvrez nos catégories les plus visitées</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <div 
              key={cat.id} 
              onClick={() => navigateTo('category', cat.slug)}
              className="group cursor-pointer relative rounded-2xl overflow-hidden aspect-[4/5] shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Background Image */}
              {cat.imageUrl ? (
                 <img src={cat.imageUrl} alt={cat.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                 <div className={`absolute inset-0 ${cat.gradient || 'bg-slate-800'}`}></div>
              )}
              
              {/* Gradient Overlay */}
              <div className={`absolute inset-0 opacity-60 transition-opacity group-hover:opacity-70 ${cat.gradient || 'bg-gradient-to-t from-black/80 to-transparent'}`}></div>
              
              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center text-white z-10">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md mb-3 border border-white/30 group-hover:scale-110 transition-transform duration-300">
                  <DynamicIcon name={cat.icon} className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg leading-tight mb-1">{cat.name}</h3>
                <span className="text-[10px] uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity bg-black/20 px-2 py-1 rounded">Explorer</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      {sectionEnabled('packages') && (
      <div style={{ order: sectionOrder('packages') }}>
      <ProductRailSection
        railId="home-packages-rail"
        title="Packages Disponibles"
        subtitle="Des packs prêts à l’achat avec un prix global plus avantageux que l’achat séparé."
        listings={packageListings}
        onViewProduct={onViewProduct}
        accent={
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-600">
            <LucideIcons.Package size={12} /> Bundle
          </span>
        }
      />
      </div>
      )}

      {sectionEnabled('top-products') && (
      <div style={{ order: sectionOrder('top-products') }}>
      <ProductRailSection
        railId="home-top-products-rail"
        title="Top Products"
        subtitle="Les produits les plus performants du store, prêts à être mis en avant."
        listings={topProductListings}
        onViewProduct={onViewProduct}
        accent={
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
            <LucideIcons.Trophy size={12} /> Top
          </span>
        }
      />
      </div>
      )}

      {sectionEnabled('gift-cards') && (
      <div style={{ order: sectionOrder('gift-cards') }}>
      <ProductRailSection
        railId="home-gift-cards-rail"
        title="Gift Cards"
        subtitle="Cartes cadeau, crédits prépayés et offres digitales faciles à offrir."
        listings={giftCardListings}
        onViewProduct={onViewProduct}
        accent={
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
            <LucideIcons.Gift size={12} /> Gift
          </span>
        }
      />
      </div>
      )}

      {sectionEnabled('trending') && (
      <div style={{ order: sectionOrder('trending') }}>
      <ProductRailSection
        railId="home-trending-rail"
        title="Tendances du Moment"
        subtitle="Une liste horizontale des offres les plus consultées du moment."
        listings={featuredListings}
        onViewProduct={onViewProduct}
      />
      </div>
      )}

      {sectionEnabled('discounts') && (
      <div style={{ order: sectionOrder('discounts') }}>
      <ProductRailSection
        railId="home-discounts-rail"
        title="Produits Soldés"
        subtitle="Toutes les offres avec remise active, regroupées dans une section promo dédiée."
        listings={discountedListings}
        onViewProduct={onViewProduct}
        accent={
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-rose-600">
            <Tag size={12} /> Promo
          </span>
        }
      />
      </div>
      )}

      {sectionEnabled('trust-badges') && (
      <section className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 text-center" style={{ order: sectionOrder('trust-badges') }}>
         <div>
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
               <Zap size={32} />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Livraison Instantanée</h3>
            <p className="text-sm text-slate-500">Recevez vos codes et comptes automatiquement par email en quelques secondes.</p>
         </div>
         <div>
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
               <Shield size={32} />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Paiement Sécurisé</h3>
            <p className="text-sm text-slate-500">Transactions cryptées et sécurisées. Support D17, Flouci et cartes bancaires.</p>
         </div>
         <div>
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
               <Star size={32} />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Service Client 24/7</h3>
            <p className="text-sm text-slate-500">Une équipe dédiée disponible à tout moment pour vous assister.</p>
         </div>
      </section>
      )}
    </div>
  );
};

export default Home;
