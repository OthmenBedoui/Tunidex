
import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, DollarSign, Plus, Loader2, Zap, Crown, Users, Shield, FolderTree, Trash2, Edit, LayoutGrid, Save, X, Settings, User as UserIcon, Clock, History } from 'lucide-react';
import { User, Order, OrderStatus, Listing, UserRole, Category, SubCategory, ProductType, LoginCredential, SiteConfig } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generateListingDescription } from '../services/geminiService';
import { api } from '../services/api';
import * as LucideIcons from 'lucide-react';
import { ImageInput } from '../components/ImageInput';

interface AdminDashboardProps {
  orders: Order[];
  listings: Listing[];
  categories: Category[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onCreateListing: (listing: Partial<Listing>) => void;
  onRefreshCategories: () => void;
  user: User;
  siteConfig: SiteConfig;
  onUpdateSiteConfig: (config: Partial<SiteConfig>) => void;
}

// Helper for Icon Preview with robust lookup
const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
  const icons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>;
  const IconComponent = icons[name] || icons[name.trim()] || icons.HelpCircle;
  return <IconComponent size={24} className={className} />;
};

const GRADIENT_PRESETS = [
    { name: 'Dark', class: 'bg-gradient-to-r from-slate-700 to-slate-900' },
    { name: 'Red', class: 'bg-gradient-to-r from-red-600 to-rose-700' },
    { name: 'Blue', class: 'bg-gradient-to-r from-blue-600 to-indigo-700' },
    { name: 'Purple', class: 'bg-gradient-to-r from-violet-600 to-purple-700' },
    { name: 'Gold', class: 'bg-gradient-to-r from-yellow-500 to-amber-600' },
    { name: 'Green', class: 'bg-gradient-to-r from-emerald-500 to-green-700' },
    { name: 'Cyan', class: 'bg-gradient-to-r from-cyan-500 to-blue-600' },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders, listings, categories, onUpdateStatus, onCreateListing, onRefreshCategories, user, siteConfig, onUpdateSiteConfig }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'listings' | 'create' | 'users' | 'categories' | 'settings'>('overview');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<{name: string, sales: number, orders: number}[]>([]);
  const [summary, setSummary] = useState({ totalSales: 0, totalOrders: 0, totalUsers: 0 });
  const [topProducts, setTopProducts] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // --- Category Management State ---
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Gamepad2');
  const [newCatImage, setNewCatImage] = useState('');
  const [newCatGradient, setNewCatGradient] = useState(GRADIENT_PRESETS[0].class);
  
  // --- SubCategory Management State ---
  const [newSubCatName, setNewSubCatName] = useState('');
  const [newSubCatSlug, setNewSubCatSlug] = useState('');
  const [newSubCatIcon, setNewSubCatIcon] = useState('Package');
  const [newSubCatDesc, setNewSubCatDesc] = useState('');
  const [newSubCatOrder, setNewSubCatOrder] = useState('0');
  
  // --- User Management State ---
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserRole, setEditUserRole] = useState<UserRole>(UserRole.CLIENT);
  const [editUserBalance, setEditUserBalance] = useState('');
  const [selectedCatForSub, setSelectedCatForSub] = useState('');
  const [userSubTab, setUserSubTab] = useState<'all' | 'roles'>('all');

  // --- Listing Create State ---
  const [newListingGame, setNewListingGame] = useState('');
  const [newListingTitle, setNewListingTitle] = useState('');
  const [newListingPrice, setNewListingPrice] = useState('');
  const [newListingCatId, setNewListingCatId] = useState('');
  const [newListingSubCatId, setNewListingSubCatId] = useState('');
  const [newListingImageUrl, setNewListingImageUrl] = useState('');
  const [newListingLogoUrl, setNewListingLogoUrl] = useState('');
  const [newListingGallery, setNewListingGallery] = useState(''); 
  const [newListingIsInstant, setNewListingIsInstant] = useState(true);
  const [newListingPrepTime, setNewListingPrepTime] = useState('');
  const [newListingMetaTitle, setNewListingMetaTitle] = useState('');
  const [newListingMetaDesc, setNewListingMetaDesc] = useState('');
  const [newListingKeywords, setNewListingKeywords] = useState('');
  const [newListingProductType, setNewListingProductType] = useState<ProductType>(ProductType.STANDARD);
  const [newListingCredentials, setNewListingCredentials] = useState<{username: string, password?: string}[]>([]);
  const [newListingStaticKey, setNewListingStaticKey] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Auto-slug Generation ---
  useEffect(() => {
    setNewCatSlug(newCatName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''));
  }, [newCatName]);

  useEffect(() => {
    setNewSubCatSlug(newSubCatName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''));
  }, [newSubCatName]);

  useEffect(() => {
    if (newListingTitle) {
        setNewListingMetaTitle(`${newListingTitle} | Tunidex`);
        setNewListingMetaDesc(`Achetez ${newListingTitle} au meilleur prix sur Tunidex. Livraison rapide et sécurisée.`);
    }
  }, [newListingTitle]);

  // --- Editing State ---
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCatImage, setEditCatImage] = useState('');
  const [editCatGradient, setEditCatGradient] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('');
  const [editCatName, setEditCatName] = useState('');
  const [editCatSlug, setEditCatSlug] = useState('');

  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubSlug, setEditSubSlug] = useState('');
  const [editSubIcon, setEditSubIcon] = useState('');
  const [editSubDesc, setEditSubDesc] = useState('');
  const [editSubOrder, setEditSubOrder] = useState('0');
  const [editSubCatId, setEditSubCatId] = useState('');
  
  // --- Site Config State ---
  const [siteLogo, setSiteLogo] = useState(siteConfig.logoUrl);
  const [siteName, setSiteName] = useState(siteConfig.siteName);
  const [siteFavicon, setSiteFavicon] = useState(siteConfig.faviconUrl || '');
  
  // --- SMTP Config State ---
  const [smtpMailerName, setSmtpMailerName] = useState(siteConfig.smtpMailerName || '');
  const [smtpHost, setSmtpHost] = useState(siteConfig.smtpHost || '');
  const [smtpDriver, setSmtpDriver] = useState(siteConfig.smtpDriver || '');
  const [smtpPort, setSmtpPort] = useState(siteConfig.smtpPort || '');
  const [smtpUsername, setSmtpUsername] = useState(siteConfig.smtpUsername || '');
  const [smtpEmailId, setSmtpEmailId] = useState(siteConfig.smtpEmailId || '');
  const [smtpEncryption, setSmtpEncryption] = useState(siteConfig.smtpEncryption || '');
  const [smtpPassword, setSmtpPassword] = useState(siteConfig.smtpPassword || '');

  // --- Click2pay Config State ---
  const [click2payEnabled, setClick2payEnabled] = useState(siteConfig.click2payEnabled || false);
  const [click2payMerchantId, setClick2payMerchantId] = useState(siteConfig.click2payMerchantId || '');
  const [click2payApiKey, setClick2payApiKey] = useState(siteConfig.click2payApiKey || '');

  useEffect(() => {
    setSiteLogo(siteConfig.logoUrl);
    setSiteName(siteConfig.siteName);
    setSiteFavicon(siteConfig.faviconUrl || '');
    setSmtpMailerName(siteConfig.smtpMailerName || '');
    setSmtpHost(siteConfig.smtpHost || '');
    setSmtpDriver(siteConfig.smtpDriver || '');
    setSmtpPort(siteConfig.smtpPort || '');
    setSmtpUsername(siteConfig.smtpUsername || '');
    setSmtpEmailId(siteConfig.smtpEmailId || '');
    setSmtpEncryption(siteConfig.smtpEncryption || '');
    setSmtpPassword(siteConfig.smtpPassword || '');
    setClick2payEnabled(siteConfig.click2payEnabled || false);
    setClick2payMerchantId(siteConfig.click2payMerchantId || '');
    setClick2payApiKey(siteConfig.click2payApiKey || '');
  }, [siteConfig]);

  useEffect(() => {
    if (activeTab === 'users' && user.role === UserRole.ADMIN) {
        api.getAllUsers().then(setAllUsers);
    }
    if (activeTab === 'overview') {
        const fetchStats = async () => {
            setIsLoading(true);
            try {
                const data = await api.getDailyStats();
                const formatted = (Array.isArray(data.dailyStats) ? data.dailyStats : []).map((s: {date: string, sales: number, orders: number}) => ({
                    name: new Date(s.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
                    sales: s.sales,
                    orders: s.orders
                }));
                setStats(formatted);
                setSummary({
                    totalSales: data.totalSales || 0,
                    totalOrders: data.totalOrders || 0,
                    totalUsers: data.totalUsers || 0
                });
                setTopProducts(Array.isArray(data.topProducts) ? data.topProducts : []);
            } catch (err) {
                console.error("Failed to fetch stats:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }
  }, [activeTab, user.role]);

  const startEditingUser = (u: User) => {
    setEditingUser(u);
    setEditUserRole(u.role);
    setEditUserBalance(u.balance.toString());
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      setIsLoading(true);
      await api.updateUserRole(editingUser.id, editUserRole);
      await api.updateUserBalance(editingUser.id, parseFloat(editUserBalance) || 0);
      
      setAllUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, role: editUserRole, balance: parseFloat(editUserBalance) || 0 } : u));
      setEditingUser(null);
      alert("Utilisateur mis à jour avec succès !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour de l'utilisateur");
    } finally {
      setIsLoading(false);
    }
  };

  // Categories Handlers
  const handleCreateCategory = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!newCatName || !newCatSlug) return;
      try {
          await api.createCategory({ name: newCatName, slug: newCatSlug, icon: newCatIcon, imageUrl: newCatImage, gradient: newCatGradient });
          setNewCatName(''); setNewCatSlug(''); setNewCatImage('');
          onRefreshCategories();
      } catch {
          alert("Erreur");
      }
  };

  const handleDeleteCategory = async (id: string) => {
      if(!confirm("Supprimer cette catégorie et tous ses produits ?")) return;
      try {
          await api.deleteCategory(id);
          onRefreshCategories();
      } catch {
          alert("Erreur");
      }
  };

  const startEditingSubCategory = (sub: SubCategory) => {
    setEditingSubCategory(sub);
    setEditSubName(sub.name);
    setEditSubSlug(sub.slug);
    setEditSubIcon(sub.icon || '');
    setEditSubDesc(sub.description || '');
    setEditSubOrder((sub.order || 0).toString());
    setEditSubCatId(sub.categoryId);
  };

  const handleUpdateSubCategory = async () => {
    if (!editingSubCategory) return;
    try {
        await api.updateSubCategory(editingSubCategory.id, {
            name: editSubName,
            slug: editSubSlug,
            icon: editSubIcon,
            description: editSubDesc,
            order: parseInt(editSubOrder),
            categoryId: editSubCatId
        });
        setEditingSubCategory(null);
        onRefreshCategories();
        alert('Sous-catégorie mise à jour !');
    } catch (err) {
        console.error('Update subcat fail:', err);
        alert('Erreur lors de la mise à jour');
    }
  };

  const handleCreateSubCategory = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!selectedCatForSub || !newSubCatName) {
          alert('Veuillez remplir le nom et sélectionner une catégorie parente');
          return;
      }
      try {
          await api.createSubCategory({ 
              name: newSubCatName, 
              slug: newSubCatSlug, 
              categoryId: selectedCatForSub,
              icon: newSubCatIcon,
              description: newSubCatDesc,
              order: parseInt(newSubCatOrder)
          });
          setNewSubCatName(''); setNewSubCatSlug(''); setNewSubCatDesc('');
          onRefreshCategories();
          alert('Sous-catégorie créée avec succès !');
      } catch (err) {
          console.error('Create subcat fail:', err);
          alert('Erreur lors de la création');
      }
  };

  const handleDeleteSubCategory = async (id: string) => {
      if(!confirm("Supprimer cette sous-catégorie ?")) return;
      try {
          await api.deleteSubCategory(id);
          onRefreshCategories();
      } catch {
          alert("Erreur");
      }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!editingCategory) return;
      try {
          await api.updateCategory(editingCategory.id, { 
              name: editCatName,
              slug: editCatSlug,
              icon: editCatIcon,
              imageUrl: editCatImage, 
              gradient: editCatGradient 
          });
          setEditingCategory(null);
          onRefreshCategories();
          alert('Catégorie mise à jour !');
      } catch {
          alert("Erreur");
      }
  };

  const startEditingCategory = (cat: Category) => {
      setEditingCategory(cat);
      setEditCatName(cat.name);
      setEditCatSlug(cat.slug);
      setEditCatIcon(cat.icon);
      setEditCatImage(cat.imageUrl || '');
      setEditCatGradient(cat.gradient || GRADIENT_PRESETS[0].class);
  };

  // Product Key Management Helpers
  const addCredentialField = () => {
    setNewListingCredentials([...newListingCredentials, { username: '', password: '' }]);
  };

  const removeCredentialField = (index: number) => {
    setNewListingCredentials(newListingCredentials.filter((_, i) => i !== index));
  };

  const updateCredentialField = (index: number, field: 'username' | 'password', value: string) => {
    const updated = [...newListingCredentials];
    updated[index] = { ...updated[index], [field]: value };
    setNewListingCredentials(updated);
  };

  // Listing Handlers
  const handleGenerateDescription = async () => {
    setIsGenerating(true);
    const desc = await generateListingDescription(newListingGame, "Produit", "High quality, fast delivery");
    setGeneratedDescription(desc);
    setIsGenerating(false);
  };

  const handleSubmitListing = (e: React.FormEvent) => {
    e.preventDefault();
    const galleryArray = newListingGallery.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    const credentials: LoginCredential[] = newListingCredentials.map(c => ({
        id: Math.random().toString(36).substr(2, 9),
        username: c.username,
        password: c.password,
        isUsed: false,
        createdAt: new Date().toISOString()
    }));

    onCreateListing({
        game: newListingGame,
        title: newListingTitle,
        categoryId: newListingCatId,
        subCategoryId: newListingSubCatId || undefined,
        description: generatedDescription,
        price: parseFloat(newListingPrice),
        imageUrl: newListingImageUrl,
        logoUrl: newListingLogoUrl,
        gallery: galleryArray,
        stock: newListingProductType === ProductType.LOGIN_CREDENTIALS ? credentials.length : (newListingProductType === ProductType.KEY ? 999 : 1),
        deliveryTimeHours: 24,
        isInstant: newListingIsInstant,
        preparationTime: newListingIsInstant ? 'Immédiat' : newListingPrepTime,
        metaTitle: newListingMetaTitle,
        metaDesc: newListingMetaDesc,
        keywords: newListingKeywords,
        productType: newListingProductType,
        credentials: newListingProductType === ProductType.LOGIN_CREDENTIALS ? credentials : [],
        staticKey: newListingProductType === ProductType.KEY ? newListingStaticKey : undefined,
    });
    // Reset form
    setNewListingGame('');
    setNewListingTitle('');
    setNewListingPrice('');
    setNewListingCatId('');
    setNewListingSubCatId('');
    setNewListingImageUrl('');
    setNewListingLogoUrl('');
    setNewListingGallery('');
    setNewListingIsInstant(true);
    setNewListingPrepTime('');
    setNewListingMetaTitle('');
    setNewListingMetaDesc('');
    setNewListingKeywords('');
    setGeneratedDescription('');
    setNewListingProductType(ProductType.STANDARD);
    setNewListingCredentials([]);
    setNewListingStaticKey('');
    
    setActiveTab('listings');
  };

  const selectedCategoryObj = categories.find(c => c.id === newListingCatId);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white rounded-lg shadow p-4 h-fit sticky top-24">
        <h2 className="font-bold text-lg mb-4 px-2 text-slate-800 flex items-center">
            {user.role === UserRole.ADMIN ? <Crown size={20} className="mr-2 text-yellow-500" /> : <Shield size={20} className="mr-2 text-blue-500" />}
            {user.role === UserRole.ADMIN ? 'Admin Panel' : user.role === UserRole.SUB_ADMIN ? 'Sous Admin' : 'Espace Vendeur'}
        </h2>
        <nav className="space-y-1">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md ${activeTab === 'overview' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}><TrendingUp size={18} /> <span>Analytique</span></button>
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md ${activeTab === 'orders' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}><Package size={18} /> <span>Commandes</span></button>
          <button onClick={() => setActiveTab('listings')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md ${activeTab === 'listings' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}><DollarSign size={18} /> <span>Produits</span></button>
          {user.role === UserRole.ADMIN && (
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md ${activeTab === 'settings' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}><Settings size={18} /> <span>Paramètres</span></button>
          )}
          {user.role === UserRole.ADMIN && (
            <>
                <button onClick={() => setActiveTab('categories')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md ${activeTab === 'categories' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}><FolderTree size={18} /> <span>Catégories</span></button>
                <button onClick={() => setActiveTab('users')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md ${activeTab === 'users' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}><Users size={18} /> <span>Utilisateurs</span></button>
            </>
          )}
          <button onClick={() => setActiveTab('create')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md mt-4 bg-indigo-600 text-white hover:bg-indigo-700 font-medium`}><Plus size={18} /> <span>Ajouter Produit</span></button>
        </nav>
      </div>

      <div className="flex-1 min-h-screen pb-12">
        {isLoading && (
            <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )}
         {activeTab === 'settings' && user.role === UserRole.ADMIN && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Section 1: Logo & Icone du Site */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center space-x-2">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <LucideIcons.Layout className="text-indigo-600" size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 leading-tight">Logo & Icone du Site</h2>
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Identité visuelle et branding</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider flex items-center">
                                    <LucideIcons.Type size={14} className="mr-1.5 text-slate-400" /> Nom du Site
                                </label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-slate-50/30 font-medium"
                                    value={siteName}
                                    onChange={(e) => setSiteName(e.target.value)}
                                    placeholder="Tunidex"
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                <ImageInput 
                                    label="Logo Principal"
                                    value={siteLogo}
                                    onChange={setSiteLogo}
                                    placeholder="URL du logo ou upload"
                                />
                                <ImageInput 
                                    label="Favicon (Icône de l'onglet)"
                                    value={siteFavicon}
                                    onChange={setSiteFavicon}
                                    placeholder="URL de l'icône (16x16 ou 32x32)"
                                />
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 relative overflow-hidden group">
                            <div className="absolute top-4 left-4 flex items-center space-x-1.5">
                                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-8 tracking-widest">Aperçu en temps réel</div>
                            
                            {/* Browser Tab Preview */}
                            <div className="w-full max-w-sm bg-white rounded-t-xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
                                <div className="bg-slate-100 px-3 py-1.5 flex items-center space-x-2 border-b border-slate-200">
                                    <div className="bg-white px-3 py-1 rounded-t-md border-x border-t border-slate-200 flex items-center space-x-2 max-w-[150px]">
                                        {siteFavicon ? (
                                            <img src={siteFavicon} alt="Favicon" className="w-3.5 h-3.5 object-contain" referrerPolicy="no-referrer" />
                                        ) : (
                                            <LucideIcons.Globe size={12} className="text-slate-400" />
                                        )}
                                        <span className="text-[10px] font-medium text-slate-600 truncate">{siteName}</span>
                                        <LucideIcons.X size={10} className="text-slate-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Header Preview */}
                            <div className="bg-white p-5 rounded-xl shadow-xl border border-slate-100 flex items-center justify-between w-full max-w-sm group-hover:scale-105 transition-transform duration-500">
                                <div className="flex items-center space-x-4">
                                    {siteLogo ? (
                                        <img src={siteLogo} alt="Logo Preview" className="h-10 w-auto object-contain" referrerPolicy="no-referrer" />
                                    ) : (
                                        <div className="bg-indigo-600 text-white p-2 rounded-lg font-black text-2xl w-12 h-12 flex items-center justify-center shadow-lg shadow-indigo-200">
                                            {siteName.charAt(0)}
                                        </div>
                                    )}
                                    <span className="font-black text-2xl tracking-tighter text-slate-900">{siteName}</span>
                                </div>
                                <div className="flex space-x-2">
                                    <div className="w-8 h-2 bg-slate-100 rounded-full"></div>
                                    <div className="w-12 h-2 bg-slate-100 rounded-full"></div>
                                </div>
                            </div>
                            
                            <p className="text-[10px] text-slate-400 mt-8 italic max-w-[240px] text-center leading-relaxed">
                                Voici comment votre marque apparaîtra dans l'onglet du navigateur et dans l'en-tête de votre site.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section 2: Configuration SMTP */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center space-x-2">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <LucideIcons.Mail className="text-indigo-600" size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 leading-tight">Serveur de Messagerie (SMTP)</h2>
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Envoi d'emails et facturation</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center">
                                <LucideIcons.CheckCircle2 size={12} className="mr-1" /> Automatisé
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Nom de l'expéditeur</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/30 transition-all"
                                        value={smtpMailerName}
                                        onChange={(e) => setSmtpMailerName(e.target.value)}
                                        placeholder="Tunidex Support"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Driver</label>
                                    <select 
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/30 transition-all font-medium"
                                        value={smtpDriver}
                                        onChange={(e) => setSmtpDriver(e.target.value)}
                                    >
                                        <option value="smtp">SMTP</option>
                                        <option value="mailgun">Mailgun</option>
                                        <option value="sendgrid">SendGrid</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Hôte SMTP</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/30 transition-all"
                                        value={smtpHost}
                                        onChange={(e) => setSmtpHost(e.target.value)}
                                        placeholder="smtp.gmail.com"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Port</label>
                                        <input 
                                            type="text" 
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/30 transition-all"
                                            value={smtpPort}
                                            onChange={(e) => setSmtpPort(e.target.value)}
                                            placeholder="587"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Cryptage</label>
                                        <select 
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/30 transition-all font-medium"
                                            value={smtpEncryption}
                                            onChange={(e) => setSmtpEncryption(e.target.value)}
                                        >
                                            <option value="tls">TLS</option>
                                            <option value="ssl">SSL</option>
                                            <option value="none">Aucun</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Email ID (Expéditeur)</label>
                                    <input 
                                        type="email" 
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/30 transition-all"
                                        value={smtpEmailId}
                                        onChange={(e) => setSmtpEmailId(e.target.value)}
                                        placeholder="contact@votre-site.com"
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="relative">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Utilisateur / Mot de passe</label>
                                        <div className="flex space-x-2">
                                            <input 
                                                type="text" 
                                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/30 transition-all text-sm"
                                                value={smtpUsername}
                                                onChange={(e) => setSmtpUsername(e.target.value)}
                                                placeholder="User"
                                            />
                                            <input 
                                                type="password" 
                                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/30 transition-all text-sm"
                                                value={smtpPassword}
                                                onChange={(e) => setSmtpPassword(e.target.value)}
                                                placeholder="Pass"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 p-5 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start space-x-4">
                            <div className="p-2 bg-white rounded-full shadow-sm">
                                <LucideIcons.Info size={18} className="text-indigo-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-indigo-900 mb-1">Automatisation de la Facturation</h4>
                                <p className="text-xs text-indigo-700 leading-relaxed opacity-80">
                                    Une fois configuré, le système générera automatiquement des factures PDF professionnelles pour chaque commande et les enverra à vos clients. Assurez-vous que vos identifiants SMTP sont valides pour éviter les échecs d'envoi.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3: Configuration Click2pay */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden opacity-90 hover:opacity-100 transition-opacity">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center space-x-2">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <LucideIcons.CreditCard className="text-indigo-600" size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 leading-tight">Passerelle de Paiement</h2>
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Click2pay Tunisie</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={click2payEnabled}
                                onChange={(e) => setClick2payEnabled(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            <span className="ml-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{click2payEnabled ? 'Activé' : 'Désactivé'}</span>
                        </label>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Merchant ID</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/30 transition-all"
                                    value={click2payMerchantId}
                                    onChange={(e) => setClick2payMerchantId(e.target.value)}
                                    placeholder="Votre ID Marchand"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Clé API (Secret)</label>
                                <input 
                                    type="password" 
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/30 transition-all"
                                    value={click2payApiKey}
                                    onChange={(e) => setClick2payApiKey(e.target.value)}
                                    placeholder="••••••••••••••••"
                                />
                            </div>
                        </div>
                        <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start space-x-3">
                            <LucideIcons.ShieldCheck size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                                <strong>Sécurité Click2pay :</strong> Vos identifiants sont chiffrés et utilisés uniquement pour traiter les transactions sécurisées via la plateforme Click2pay Tunisie.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6 sticky bottom-0 bg-slate-50/80 backdrop-blur-md p-4 -mx-4 rounded-t-3xl border-t border-slate-200 z-10">
                    <button 
                        onClick={() => onUpdateSiteConfig({ 
                            siteName, 
                            logoUrl: siteLogo, 
                            faviconUrl: siteFavicon,
                            smtpMailerName,
                            smtpHost,
                            smtpDriver,
                            smtpPort,
                            smtpUsername,
                            smtpEmailId,
                            smtpEncryption,
                            smtpPassword,
                            click2payEnabled,
                            click2payMerchantId,
                            click2payApiKey
                        })}
                        className="bg-indigo-600 text-white font-black py-4 px-16 rounded-2xl hover:bg-indigo-700 transition shadow-2xl shadow-indigo-300 flex items-center justify-center transform hover:-translate-y-1 active:scale-95 group"
                    >
                        <LucideIcons.Save size={20} className="mr-3 group-hover:rotate-12 transition-transform" /> 
                        <span className="uppercase tracking-widest text-sm">Sauvegarder tout</span>
                    </button>
                </div>
            </div>
        )}
        {activeTab === 'overview' && (
             <div className="space-y-6">
               {/* KPI Cards */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-500 text-sm font-medium">Ventes Totales</span>
                      <div className="p-2 bg-green-50 text-green-600 rounded-lg"><DollarSign size={20} /></div>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{summary.totalSales.toFixed(2)} TND</div>
                    <div className="text-xs text-green-600 mt-1 font-medium">+12% vs mois dernier</div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-500 text-sm font-medium">Commandes</span>
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Package size={20} /></div>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{summary.totalOrders}</div>
                    <div className="text-xs text-blue-600 mt-1 font-medium">+5% vs mois dernier</div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-500 text-sm font-medium">Clients</span>
                      <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users size={20} /></div>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{summary.totalUsers}</div>
                    <div className="text-xs text-purple-600 mt-1 font-medium">+8 nouveaux aujourd'hui</div>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                   <div className="flex items-center justify-between mb-6">
                     <h3 className="font-bold text-slate-900">Ventes (30 jours)</h3>
                     <TrendingUp size={18} className="text-slate-400" />
                   </div>
                   <div className="h-64">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f8fafc' }}
                          />
                          <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                     </ResponsiveContainer>
                   </div>
                 </div>

                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                   <h3 className="font-bold text-slate-900 mb-6">Produits les plus vendus</h3>
                   <div className="space-y-4">
                     {topProducts.length > 0 ? topProducts.map((p, i) => (
                       <div key={p.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                         <div className="flex items-center space-x-3">
                           <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-500 text-xs">{i+1}</div>
                           <div>
                             <div className="font-bold text-sm text-slate-900">{p.title}</div>
                             <div className="text-[10px] text-slate-500 uppercase font-bold">{p.game}</div>
                           </div>
                         </div>
                         <div className="text-right">
                           <div className="font-bold text-sm text-slate-900">{(p.salesCount || 0)} ventes</div>
                           <div className="text-[10px] text-green-600 font-bold">{(p.price * (p.salesCount || 0)).toFixed(2)} TND</div>
                         </div>
                       </div>
                     )) : (
                       <div className="text-center py-12 text-slate-400 italic text-sm">Aucune donnée disponible</div>
                     )}
                   </div>
                 </div>
               </div>
             </div>
        )}

        {/* --- CATEGORIES TAB --- */}
        {activeTab === 'categories' && (
            <div className="space-y-8">
                {/* Edit Category Modal Overlay */}
                {editingCategory && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-xl text-slate-900 flex items-center">
                                    <Edit className="mr-2 text-indigo-600" /> Modifier la Catégorie: {editingCategory.name}
                                </h3>
                                <button onClick={() => setEditingCategory(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
                            </div>
                            <div className="p-8">
                                <form onSubmit={handleUpdateCategory} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Nom de la catégorie</label>
                                            <input className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={editCatName} onChange={e => setEditCatName(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Slug (URL)</label>
                                            <input className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={editCatSlug} onChange={e => setEditCatSlug(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Icone (Lucide Name)</label>
                                            <input className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={editCatIcon} onChange={e => setEditCatIcon(e.target.value)} />
                                        </div>
                                        <div>
                                            <ImageInput 
                                                label="Image de Couverture"
                                                value={editCatImage}
                                                onChange={setEditCatImage}
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Dégradé de Couleur</label>
                                            <div className="flex flex-wrap gap-2">
                                                {GRADIENT_PRESETS.map((grad) => (
                                                    <button 
                                                        key={grad.name}
                                                        type="button"
                                                        onClick={() => setEditCatGradient(grad.class)}
                                                        className={`w-8 h-8 rounded-full ${grad.class} border-2 ${editCatGradient === grad.class ? 'border-indigo-600 scale-110' : 'border-transparent hover:scale-105'} transition-all`}
                                                        title={grad.name}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <button type="submit" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 flex items-center justify-center w-full shadow-lg shadow-indigo-100 transition-all">
                                            <Save size={18} className="mr-2" /> Enregistrer les modifications
                                        </button>
                                    </div>
                                    <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">Aperçu en temps réel</p>
                                        <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[16/9] w-full group">
                                            {editCatImage ? (
                                                <img src={editCatImage} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            ) : (
                                                <div className={`absolute inset-0 ${editCatGradient}`}></div>
                                            )}
                                            <div className={`absolute inset-0 opacity-40 ${editCatGradient}`}></div>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                                                <div className="bg-white/20 p-4 rounded-full backdrop-blur-md mb-4 border border-white/30 shadow-inner">
                                                    <DynamicIcon name={editCatIcon} className="w-10 h-10" />
                                                </div>
                                                <h4 className="font-black text-2xl tracking-tight drop-shadow-lg">{editCatName || 'Titre'}</h4>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit SubCategory Modal Overlay */}
                {editingSubCategory && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-lg text-slate-900 flex items-center">
                                    <Edit className="mr-2 text-indigo-600" /> Modifier Sous-Catégorie
                                </h3>
                                <button onClick={() => setEditingSubCategory(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                            </div>
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Nom</label>
                                    <input className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={editSubName} onChange={e => setEditSubName(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Slug</label>
                                    <input className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={editSubSlug} onChange={e => setEditSubSlug(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Icône Lucide</label>
                                    <input className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={editSubIcon} onChange={e => setEditSubIcon(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Description</label>
                                    <textarea className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 resize-none" value={editSubDesc} onChange={e => setEditSubDesc(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Ordre</label>
                                        <input type="number" className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={editSubOrder} onChange={e => setEditSubOrder(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Parente</label>
                                        <select className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={editSubCatId} onChange={e => setEditSubCatId(e.target.value)}>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <button onClick={handleUpdateSubCategory} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                                    Enregistrer les modifications
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Category Form */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="font-bold text-xl flex items-center"><LayoutGrid className="mr-2 text-slate-500" /> Nouvelle Catégorie</h3>
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">Aperçu Live</span>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Form Inputs */}
                        <div className="lg:col-span-2 space-y-4">
                            <form onSubmit={handleCreateCategory} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Nom</label>
                                        <input className="w-full border p-2 rounded" placeholder="ex: Software & Apps" value={newCatName} onChange={e => setNewCatName(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Slug (URL)</label>
                                        <input className="w-full border p-2 rounded" placeholder="ex: software-apps" value={newCatSlug} onChange={e => setNewCatSlug(e.target.value)} required />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Icone Lucide</label>
                                        <div className="relative">
                                            <input className="w-full border p-2 pl-10 rounded" placeholder="ex: MonitorPlay" value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} required />
                                            <div className="absolute left-2 top-2 text-slate-400">
                                                <DynamicIcon name={newCatIcon} className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <a href="https://lucide.dev/icons" target="_blank" className="text-[10px] text-indigo-500 hover:underline mt-1 block">Liste des icones</a>
                                    </div>
                                    <div>
                                        <ImageInput 
                                            label="Image Cover"
                                            value={newCatImage}
                                            onChange={setNewCatImage}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Style Gradient</label>
                                    <div className="flex flex-wrap gap-2">
                                        {GRADIENT_PRESETS.map((grad) => (
                                            <button 
                                                key={grad.name}
                                                type="button"
                                                onClick={() => setNewCatGradient(grad.class)}
                                                className={`w-8 h-8 rounded-full ${grad.class} border-2 transition-all ${newCatGradient === grad.class ? 'border-black scale-110' : 'border-transparent hover:scale-105'}`}
                                                title={grad.name}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white p-3 rounded-lg font-bold shadow-lg shadow-slate-200 transition-all">Créer la Catégorie</button>
                            </form>
                        </div>

                        {/* Live Preview Card */}
                        <div className="lg:col-span-1">
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2 text-center">Aperçu Carte</label>
                            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/5] group cursor-pointer w-full max-w-[240px] mx-auto border border-slate-200">
                                {/* Image Layer */}
                                {newCatImage ? (
                                    <img src={newCatImage} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <div className={`absolute inset-0 ${newCatGradient} opacity-50`}></div>
                                )}
                                
                                {/* Gradient Overlay */}
                                <div className={`absolute inset-0 opacity-60 transition-opacity group-hover:opacity-70 ${newCatGradient}`}></div>
                                
                                {/* Content */}
                                <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center text-white z-10">
                                    <div className="bg-white/20 p-4 rounded-full backdrop-blur-md mb-4 border border-white/30 shadow-inner group-hover:scale-110 transition-transform">
                                        <DynamicIcon name={newCatIcon} className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-black tracking-tight drop-shadow-md">{newCatName || 'Titre Catégorie'}</h3>
                                    <p className="text-sm font-medium opacity-90 mt-2">0 Produits</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sub Categories Creation & List */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                        <h3 className="font-bold text-lg mb-4">Ajouter Sous-Catégorie</h3>
                        <form onSubmit={handleCreateSubCategory} className="space-y-4">
                            <select className="w-full border p-2 rounded" value={selectedCatForSub} onChange={e => setSelectedCatForSub(e.target.value)} required>
                                <option value="">Catégorie Parente</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            
                            <input className="w-full border p-2 rounded" placeholder="Nom (ex: Chatbots)" value={newSubCatName} onChange={e => setNewSubCatName(e.target.value)} required />
                            <input className="w-full border p-2 rounded" placeholder="Slug (ex: chatbots)" value={newSubCatSlug} onChange={e => setNewSubCatSlug(e.target.value)} required />
                            
                            <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                    <input className="w-full border p-2 pl-9 rounded" placeholder="Icon" value={newSubCatIcon} onChange={e => setNewSubCatIcon(e.target.value)} />
                                    <div className="absolute left-2 top-2 text-slate-400"><DynamicIcon name={newSubCatIcon} className="w-5 h-5"/></div>
                                </div>
                                <input type="number" className="w-full border p-2 rounded" placeholder="Ordre" value={newSubCatOrder} onChange={e => setNewSubCatOrder(e.target.value)} />
                            </div>
                            
                            <input className="w-full border p-2 rounded" placeholder="Description courte (ex: ChatGPT, Gemini...)" value={newSubCatDesc} onChange={e => setNewSubCatDesc(e.target.value)} />
                            
                            {/* Card Preview */}
                            {newSubCatName && (
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-3 opacity-80">
                                    <div className="p-2 bg-white rounded-lg shadow-sm"><DynamicIcon name={newSubCatIcon} className="w-5 h-5 text-indigo-600"/></div>
                                    <div><div className="font-bold text-sm">{newSubCatName}</div><div className="text-[10px] text-slate-500">{newSubCatDesc || 'Description...'}</div></div>
                                </div>
                            )}

                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded font-bold transition-colors">Ajouter la Carte</button>
                        </form>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 font-bold bg-slate-50">Structure du Site</div>
                        <div className="max-h-[500px] overflow-y-auto">
                            {categories.map(cat => (
                                <div key={cat.id} className="border-b border-slate-50 last:border-0">
                                    <div className="px-6 py-3 bg-slate-50/50 flex justify-between items-center">
                                        <div className="font-bold text-slate-900 flex items-center">
                                            {cat.imageUrl ? (
                                                <img src={cat.imageUrl} className="w-8 h-5 object-cover rounded mr-2 border border-slate-200" />
                                            ) : (
                                                <div className={`w-8 h-5 rounded mr-2 ${cat.gradient || 'bg-slate-200'}`} />
                                            )}
                                            <DynamicIcon name={cat.icon} className="w-4 h-4 mr-2 text-slate-500" /> 
                                            {cat.name}
                                            <button onClick={() => startEditingCategory(cat)} className="ml-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Modifier la catégorie"><Edit size={14} /></button>
                                        </div>
                                        <button onClick={() => handleDeleteCategory(cat.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                                    </div>
                                    <div className="px-6 py-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {cat.subCategories?.map(sub => (
                                            <div key={sub.id} className="bg-white border border-slate-100 p-3 rounded-lg flex justify-between items-start group hover:border-indigo-200 transition-colors">
                                                <div className="flex items-start space-x-3">
                                                    <div className="p-1.5 bg-slate-50 rounded text-slate-500"><DynamicIcon name={sub.icon || 'Package'} className="w-4 h-4" /></div>
                                                    <div>
                                                        <div className="font-bold text-xs text-slate-900">{sub.name}</div>
                                                        <div className="text-[10px] text-slate-400 line-clamp-1">{sub.description}</div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => startEditingSubCategory(sub)} className="text-slate-400 hover:text-indigo-600"><Edit size={12} /></button>
                                                    <button onClick={() => handleDeleteSubCategory(sub.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={12} /></button>
                                                </div>
                                            </div>
                                        ))}
                                        {(!cat.subCategories || cat.subCategories.length === 0) && <div className="text-xs text-slate-300 italic col-span-full">Aucune sous-catégorie</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- CREATE LISTING TAB --- */}
        {activeTab === 'create' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 max-w-3xl">
            <h3 className="text-xl font-bold mb-6">Ajouter Nouveau Produit</h3>
            <form onSubmit={handleSubmitListing} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
                   <select className="w-full border rounded p-2" value={newListingCatId} onChange={e => setNewListingCatId(e.target.value)} required>
                       <option value="">-- Sélectionner --</option>
                       {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Sous-Catégorie</label>
                   <select className="w-full border rounded p-2" value={newListingSubCatId} onChange={e => setNewListingSubCatId(e.target.value)} disabled={!newListingCatId}>
                       <option value="">-- Aucune --</option>
                       {selectedCategoryObj?.subCategories?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
                </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jeu / Marque (ex: Netflix, Valorant)</label>
                  <input type="text" className="w-full border rounded p-2" value={newListingGame} onChange={e => setNewListingGame(e.target.value)} required />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center">
                      <Zap size={16} className="mr-2 text-yellow-500" /> Disponibilité & Livraison
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                          <label className="block text-xs font-bold uppercase text-slate-500">Type de Stock</label>
                          <div className="flex space-x-2">
                              <button 
                                type="button"
                                onClick={() => setNewListingIsInstant(true)}
                                className={`flex-1 p-3 rounded-lg border text-sm font-bold flex items-center justify-center transition-all ${newListingIsInstant ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                              >
                                  <Zap size={16} className="mr-2" /> Instantané
                              </button>
                              <button 
                                type="button"
                                onClick={() => setNewListingIsInstant(false)}
                                className={`flex-1 p-3 rounded-lg border text-sm font-bold flex items-center justify-center transition-all ${!newListingIsInstant ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                              >
                                  <Package size={16} className="mr-2" /> Sur Commande
                              </button>
                          </div>
                      </div>
                      {!newListingIsInstant && (
                          <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Temps d'attente estimé</label>
                              <input 
                                type="text" 
                                className="w-full border rounded p-2 bg-white" 
                                placeholder="ex: 2-4 heures, 1 jour..." 
                                value={newListingPrepTime} 
                                onChange={e => setNewListingPrepTime(e.target.value)} 
                                required={!newListingIsInstant}
                              />
                          </div>
                      )}
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titre du Produit</label>
                <input type="text" className="w-full border rounded p-2" value={newListingTitle} onChange={e => setNewListingTitle(e.target.value)} required />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center">
                      <Shield size={16} className="mr-2 text-indigo-600" /> Type de Produit & Accès
                  </label>
                  <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                          {Object.values(ProductType).map((type) => (
                              <button
                                  key={type}
                                  type="button"
                                  onClick={() => setNewListingProductType(type)}
                                  className={`p-2 rounded-lg border text-[10px] font-bold uppercase transition-all ${newListingProductType === type ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                              >
                                  {type === ProductType.STANDARD ? 'Standard' : type === ProductType.LOGIN_CREDENTIALS ? 'Logins Pool' : 'Clé Unique'}
                              </button>
                          ))}
                      </div>

                      {newListingProductType === ProductType.LOGIN_CREDENTIALS && (
                          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="flex justify-between items-center">
                                  <label className="text-xs font-bold uppercase text-slate-500">Pool de Logins/Passwords</label>
                                  <button type="button" onClick={addCredentialField} className="text-xs text-indigo-600 font-bold hover:underline flex items-center">
                                      <Plus size={12} className="mr-1" /> Ajouter
                                  </button>
                              </div>
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                  {newListingCredentials.map((cred, idx) => (
                                      <div key={idx} className="flex gap-2 items-center">
                                          <input 
                                              placeholder="Login" 
                                              className="flex-1 border rounded p-1.5 text-xs" 
                                              value={cred.username} 
                                              onChange={(e) => updateCredentialField(idx, 'username', e.target.value)}
                                          />
                                          <input 
                                              placeholder="Password" 
                                              className="flex-1 border rounded p-1.5 text-xs" 
                                              value={cred.password} 
                                              onChange={(e) => updateCredentialField(idx, 'password', e.target.value)}
                                          />
                                          <button type="button" onClick={() => removeCredentialField(idx)} className="text-red-500 hover:text-red-700">
                                              <Trash2 size={14} />
                                          </button>
                                      </div>
                                  ))}
                                  {newListingCredentials.length === 0 && (
                                      <div className="text-center py-4 text-slate-400 text-xs italic border border-dashed rounded-lg">
                                          Aucun compte ajouté. Cliquez sur "Ajouter" pour commencer le pool.
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}

                      {newListingProductType === ProductType.KEY && (
                          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Clé du Produit (Sera envoyée à tous les clients)</label>
                              <input 
                                  type="text" 
                                  className="w-full border rounded p-2 bg-white text-sm" 
                                  placeholder="ex: XXXXX-XXXXX-XXXXX" 
                                  value={newListingStaticKey} 
                                  onChange={e => setNewListingStaticKey(e.target.value)} 
                              />
                          </div>
                      )}
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <ImageInput 
                    label="Image Principale"
                    value={newListingImageUrl}
                    onChange={setNewListingImageUrl}
                    placeholder="https://..."
                  />
                  <ImageInput 
                    label="Logo Spécifique (Optionnel)"
                    value={newListingLogoUrl}
                    onChange={setNewListingLogoUrl}
                    placeholder="https://..."
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Galerie Images (URLs séparées par des virgules)</label>
                  <input type="text" className="w-full border rounded p-2" value={newListingGallery} onChange={e => setNewListingGallery(e.target.value)} placeholder="url1, url2, url3" />
              </div>

              <div className="bg-indigo-50 p-4 rounded-md border border-indigo-100">
                <button type="button" onClick={handleGenerateDescription} disabled={!newListingGame || isGenerating} className="text-sm bg-white border border-indigo-300 text-indigo-700 px-3 py-2 rounded font-medium hover:bg-indigo-50 flex items-center">
                  {isGenerating ? <Loader2 className="animate-spin mr-1" size={14} /> : <Zap size={14} className="mr-1" />} Générer Description IA
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea className="w-full border rounded p-2 h-32" value={generatedDescription} onChange={(e) => setGeneratedDescription(e.target.value)} required></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prix (TND)</label>
                <input type="number" step="0.01" className="w-full border rounded p-2" value={newListingPrice} onChange={(e) => setNewListingPrice(e.target.value)} required />
              </div>

              {/* SEO Section */}
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-slate-900 flex items-center">
                      <LayoutGrid size={18} className="mr-2 text-indigo-600" /> Optimisation SEO
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">Optimisez la visibilité de ce produit sur Google et les moteurs de recherche.</p>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Meta Title</label>
                          <input 
                            type="text" 
                            className="w-full border rounded p-2 bg-white" 
                            placeholder="Titre pour Google (max 60 chars)" 
                            value={newListingMetaTitle} 
                            onChange={e => setNewListingMetaTitle(e.target.value)} 
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Meta Description</label>
                          <textarea 
                            className="w-full border rounded p-2 bg-white h-20" 
                            placeholder="Description pour Google (max 160 chars)" 
                            value={newListingMetaDesc} 
                            onChange={e => setNewListingMetaDesc(e.target.value)} 
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Mots-clés (séparés par des virgules)</label>
                          <input 
                            type="text" 
                            className="w-full border rounded p-2 bg-white" 
                            placeholder="ex: netflix tunisie, abonnement pas cher..." 
                            value={newListingKeywords} 
                            onChange={e => setNewListingKeywords(e.target.value)} 
                          />
                      </div>
                  </div>

                  {/* Google Preview */}
                  <div className="mt-6 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Aperçu Google Search</p>
                      <div className="max-w-[600px]">
                          <div className="text-[#1a0dab] text-xl hover:underline cursor-pointer truncate">
                              {newListingMetaTitle || newListingTitle || 'Titre du produit sur Google'}
                          </div>
                          <div className="text-[#006621] text-sm truncate mb-1">
                              tunidex.com › products › {newListingTitle.toLowerCase().replace(/\s+/g, '-')}
                          </div>
                          <div className="text-[#545454] text-sm line-clamp-2">
                              {newListingMetaDesc || generatedDescription || 'La description de votre produit apparaîtra ici dans les résultats de recherche Google...'}
                          </div>
                      </div>
                  </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-md hover:bg-slate-800 transition">Créer l'Offre</button>
            </form>
          </div>
        )}
        
        {activeTab === 'users' && user.role === UserRole.ADMIN && (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900">Gestion des Utilisateurs</h2>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button 
                            onClick={() => setUserSubTab('all')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${userSubTab === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Tous les Utilisateurs
                        </button>
                        <button 
                            onClick={() => setUserSubTab('roles')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${userSubTab === 'roles' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Rôles & Permissions
                        </button>
                    </div>
                </div>

                {userSubTab === 'all' ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 font-bold bg-slate-50">Liste des Utilisateurs</div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="px-6 py-3">Utilisateur</th>
                                        <th className="px-6 py-3">Email</th>
                                        <th className="px-6 py-3">Rôle</th>
                                        <th className="px-6 py-3">Solde</th>
                                        <th className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {allUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 flex items-center space-x-3">
                                                <img src={u.avatarUrl} className="w-8 h-8 rounded-full" />
                                                <span className="font-bold text-slate-900">{u.username}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${u.role === UserRole.ADMIN ? 'bg-red-100 text-red-700' : u.role === UserRole.SUB_ADMIN ? 'bg-orange-100 text-orange-700' : u.role === UserRole.SELLER ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-900 text-sm">{u.balance.toFixed(2)} TND</td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => startEditingUser(u)} className="text-slate-400 hover:text-indigo-600"><Edit size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SELLER, UserRole.CLIENT].map(role => (
                            <div key={role} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-xl ${role === UserRole.ADMIN ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                        <Shield size={24} />
                                    </div>
                                    <span className="text-2xl font-black text-slate-900">
                                        {allUsers.filter(u => u.role === role).length}
                                    </span>
                                </div>
                                <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest">{role}</h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    {role === UserRole.ADMIN ? 'Accès total au système' : 
                                     role === UserRole.SUB_ADMIN ? 'Gestion limitée' :
                                     role === UserRole.SELLER ? 'Gestion des produits' : 'Utilisateur final'}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
        {editingUser && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-900">Modifier l'utilisateur</h3>
                        <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom d'utilisateur</label>
                            <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-600 font-medium">{editingUser.username}</div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rôle</label>
                            <select 
                                value={editUserRole}
                                onChange={(e) => setEditUserRole(e.target.value as UserRole)}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                {Object.values(UserRole).filter(r => r !== UserRole.GUEST).map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Solde (TND)</label>
                            <input 
                                type="number" 
                                value={editUserBalance}
                                onChange={(e) => setEditUserBalance(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <button 
                            onClick={handleUpdateUser}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition flex items-center justify-center space-x-2"
                        >
                            <Save size={18} />
                            <span>Enregistrer les modifications</span>
                        </button>
                    </div>
                </div>
            </div>
        )}
        {activeTab === 'orders' && (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-100 font-bold bg-slate-50 flex justify-between items-center">
                     <span>Toutes les Commandes</span>
                     <span className="text-xs font-normal text-slate-500">{orders.length} commandes au total</span>
                 </div>
                 <div className="overflow-x-auto">
                     <table className="w-full text-left">
                         <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                             <tr>
                                 <th className="px-6 py-3">ID</th>
                                 <th className="px-6 py-3">Client</th>
                                 <th className="px-6 py-3">Produit</th>
                                 <th className="px-6 py-3">Montant</th>
                                 <th className="px-6 py-3">Contenu</th>
                                 <th className="px-6 py-3">Statut</th>
                                 <th className="px-6 py-3">Date</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                             {orders.map(o => (
                                 <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                                     <td className="px-6 py-4 text-xs font-mono text-slate-400">#{o.id.slice(0, 8)}</td>
                                     <td className="px-6 py-4 text-sm font-bold text-slate-900">{o.buyerId.slice(0, 8)}...</td>
                                     <td className="px-6 py-4 text-sm text-slate-600">{o.items?.[0]?.titleSnapshot || 'Multi-items'}</td>
                                     <td className="px-6 py-4 font-bold text-slate-900 text-sm">{o.amount.toFixed(2)} TND</td>
                                     <td className="px-6 py-4">
                                         {o.items?.[0]?.deliveredContent ? (
                                             <div className="text-[10px] bg-slate-100 p-1 rounded font-mono text-slate-600 break-all max-w-[150px]">
                                                 {o.items[0].deliveredContent}
                                             </div>
                                         ) : (
                                             <span className="text-[10px] text-slate-400 italic">N/A</span>
                                         )}
                                     </td>
                                     <td className="px-6 py-4">
                                         {o.items?.[0]?.deliveredContent ? (
                                             <div className="text-[10px] bg-slate-100 p-1 rounded font-mono text-slate-600 break-all max-w-[150px]">
                                                 {o.items[0].deliveredContent}
                                             </div>
                                         ) : (
                                             <span className="text-[10px] text-slate-400 italic">N/A</span>
                                         )}
                                     </td>
                                     <td className="px-6 py-4">
                                         <select 
                                            className={`text-[10px] font-bold uppercase px-2 py-1 rounded border-none focus:ring-0 cursor-pointer ${
                                                o.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-700' : 
                                                o.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-700' : 
                                                'bg-amber-100 text-amber-700'
                                            }`}
                                            value={o.status}
                                            onChange={(e) => onUpdateStatus(o.id, e.target.value as OrderStatus)}
                                         >
                                             {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                         </select>
                                     </td>
                                     <td className="px-6 py-4 text-xs text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                     {orders.length === 0 && <div className="text-center py-20 text-slate-400 italic">Aucune commande trouvée</div>}
                 </div>
             </div>
        )}
        {activeTab === 'listings' && (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-100 font-bold bg-slate-50 flex justify-between items-center">
                     <span>Inventaire Produits</span>
                     <button onClick={() => setActiveTab('create')} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700 transition">Nouveau</button>
                 </div>
                 <div className="overflow-x-auto">
                     <table className="w-full text-left">
                         <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                             <tr>
                                 <th className="px-6 py-3">Produit</th>
                                 <th className="px-6 py-3">Catégorie</th>
                                 <th className="px-6 py-3">Prix</th>
                                 <th className="px-6 py-3">Stock</th>
                                 <th className="px-6 py-3">Type</th>
                                 <th className="px-6 py-3">Actions</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                             {listings.map(l => (
                                 <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                                     <td className="px-6 py-4 flex items-center space-x-3">
                                         <img src={l.imageUrl} className="w-10 h-10 rounded object-cover border border-slate-100" />
                                         <div>
                                             <div className="font-bold text-slate-900 text-sm">{l.title}</div>
                                             <div className="text-[10px] text-slate-400 uppercase font-bold">{l.game}</div>
                                         </div>
                                     </td>
                                     <td className="px-6 py-4 text-xs text-slate-600">
                                         {categories.find(c => c.id === l.categoryId)?.name || 'Inconnu'}
                                     </td>
                                     <td className="px-6 py-4 font-bold text-slate-900 text-sm">{l.price.toFixed(2)} TND</td>
                                     <td className="px-6 py-4">
                                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${l.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                             {l.stock > 0 ? 'EN STOCK' : 'RUPTURE'}
                                         </span>
                                     </td>
                                     <td className="px-6 py-4">
                                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${l.isInstant ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                                             {l.isInstant ? 'INSTANT' : 'MANUEL'}
                                         </span>
                                     </td>
                                     <td className="px-6 py-4">
                                         <div className="flex space-x-2">
                                             <button 
                                            onClick={() => {}}
                                            className="text-slate-400 hover:text-indigo-600"
                                          >
                                            <Edit size={16} />
                                          </button>
                                             <button className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                                         </div>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             </div>
        )}
      </div>
    </div>
  );
};

// --- USER DASHBOARD ---
export const UserDashboard: React.FC<{user: User, orders: Order[], navigateTo: (page: string) => void}> = ({ user, orders, navigateTo }) => {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <img src={user.avatarUrl || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-full border-2 border-indigo-500 shadow-sm object-cover" />
          <div>
            <h1 className="text-2xl font-black text-slate-900">Bonjour, {user.username} !</h1>
            <p className="text-sm text-slate-500">Gérez vos commandes et votre profil ici.</p>
          </div>
        </div>
        <button 
          onClick={() => navigateTo('profile')}
          className="bg-white border border-slate-200 text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-slate-50 transition-all flex items-center shadow-sm"
        >
          <UserIcon size={18} className="mr-2 text-indigo-600" /> Modifier mon profil
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg text-white">
            <div className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-1">Solde Actuel</div>
            <div className="text-3xl font-black">{user.balance.toFixed(2)} TND</div>
            <div className="mt-4 pt-4 border-t border-indigo-500 flex justify-between items-center">
              <span className="text-xs text-indigo-100 italic">Prêt pour vos achats</span>
              <button className="text-[10px] font-bold uppercase bg-white text-indigo-600 px-2 py-1 rounded">Recharger</button>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
              <Clock size={18} className="mr-2 text-slate-400" /> Activité Récente
            </h3>
            <div className="space-y-4">
              {orders.slice(0, 3).map(o => (
                <div key={o.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></div>
                    <span className="text-slate-600 truncate max-w-[120px]">{o.items?.[0]?.titleSnapshot || 'Commande'}</span>
                  </div>
                  <span className="text-slate-400 text-xs">{new Date(o.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
              {orders.length === 0 && <p className="text-xs text-slate-400 italic">Aucune activité récente.</p>}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <h2 className="font-black text-xl text-slate-900 flex items-center">
            <History size={20} className="mr-2 text-indigo-600" /> Historique des Commandes
          </h2>
          <div className="space-y-4">
            {orders.map((o) => (
               <div key={o.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:shadow-md">
                  <div className="flex-1">
                     <div className="text-[10px] font-bold text-indigo-600 uppercase mb-1 tracking-widest">#{o.id.slice(0, 8)}</div>
                     <h3 className="font-bold text-slate-900 text-lg">{o.items?.[0]?.titleSnapshot || 'Commande'}</h3>
                     <div className="text-xs text-slate-500 mt-1 flex items-center">
                       <Clock size={12} className="mr-1" /> {new Date(o.createdAt).toLocaleString()}
                     </div>
                  </div>
                  
                  {o.items?.[0]?.deliveredContent && (
                     <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 w-full md:w-auto">
                         <div className="text-[10px] font-bold text-indigo-600 uppercase mb-2 tracking-wider">Contenu Livré</div>
                         <div className="text-sm font-mono font-bold text-slate-900 select-all break-all bg-white p-2 rounded border border-indigo-50 shadow-inner">
                           {o.items[0].deliveredContent}
                         </div>
                     </div>
                  )}

                  <div className="text-right min-w-[100px]">
                     <div className="font-black text-slate-900 text-lg">{o.amount.toFixed(2)} TND</div>
                     <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded mt-2 inline-block ${o.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                         {o.status}
                     </div>
                  </div>
               </div>
            ))}
            {orders.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400 italic">
                    Vous n'avez pas encore passé de commande.
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Removed redundant X function as it's now imported from lucide-react