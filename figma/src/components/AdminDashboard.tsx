import { useEffect, useState, useMemo, useRef, type ChangeEvent } from 'react';
import { Provider, User, Artist, Contract, Booking, Review } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  Users, 
  Briefcase, 
  FileText, 
  TrendingUp,
  Search,
  Ban,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Star,
  AlertTriangle,
  Menu,
  X,
  Activity,
  LayoutDashboard,
  BookOpen,
  MapPin,
  Save,
  Loader2,
  ImagePlus,
  Layers3,
  Pencil,
  Plus,
  Trash2
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner@2.0.3';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AdminBillingSection } from './AdminBillingSection';
import { AdminBannersSection } from './AdminBannersSection';
import { AdminInterestedProvidersSection } from './AdminInterestedProvidersSection';
import { ConfirmDialog } from './ConfirmDialog';
import { backendMode, laravelApiBaseUrl } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface AdminDashboardProps {
  currentUser: User;
  accessToken: string | null;
  providers: Provider[];
  users: User[];
  artists: Artist[];
  contracts: Contract[];
  bookings: Booking[];
  reviews: Review[];
  onVerifyProvider: (providerId: string) => Promise<void>;
  onBanProvider: (providerId: string, reason: string) => Promise<void>;
  onUnbanProvider: (providerId: string) => Promise<void>;
  onBanUser: (userId: string, reason: string) => Promise<void>;
  onUnbanUser: (userId: string) => Promise<void>;
  onArchiveUser: (userId: string) => Promise<void>;
  onUnarchiveUser: (userId: string) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onApproveProviderAccess: (userId: string) => Promise<void>;
  onRevokeProviderAccess: (userId: string) => Promise<void>;
  allCities: string[];
  enabledCities: string[];
  onUpdateEnabledCities: (cities: string[]) => Promise<void>;
  bannersSectionEnabled: boolean;
  onToggleBannersSection: (enabled: boolean) => Promise<void>;
  relevantServicesSectionEnabled: boolean;
  relevantServicesTitle: string;
  relevantServicesSubtitle: string;
  relevantServiceIds: string[];
  onUpdateRelevantServicesConfig: (config: { enabled: boolean; title: string; subtitle: string; serviceIds: string[] }) => Promise<void>;
  collections: Array<{
    id: string;
    title: string;
    subtitle?: string | null;
    slug: string;
    serviceIds: string[];
    services: Artist[];
  }>;
  onCreateCollection: (collection: { title: string; subtitle: string; slug: string; serviceIds: string[] }) => Promise<any>;
  onUpdateCollection: (collectionId: string, collection: { title: string; subtitle: string; slug: string; serviceIds: string[] }) => Promise<any>;
  onDeleteCollection: (collectionId: string) => Promise<void>;
  homeCollectionSections: Array<{
    id: string;
    title: string;
    subtitle?: string | null;
    collectionId: string;
    sortOrder: number;
    visible: boolean;
  }>;
  onCreateHomeCollectionSection: (section: { title: string; subtitle: string; collectionId: string; sortOrder: number; visible: boolean }) => Promise<any>;
  onUpdateHomeCollectionSection: (sectionId: string, section: { title: string; subtitle: string; collectionId: string; sortOrder: number; visible: boolean }) => Promise<any>;
  onDeleteHomeCollectionSection: (sectionId: string) => Promise<void>;
  mainContentAccent: string;
  mainContentTitle: string;
  mainContentSubtitle: string;
  mainContentPrimaryButtonText: string;
  mainContentPrimaryButtonLink: string;
  mainContentSecondaryButtonText: string;
  mainContentSecondaryButtonLink: string;
  mainContentBgType: 'gradient' | 'solid' | 'image';
  mainContentBgColor: string;
  mainContentBgGradient: string;
  mainContentBgImageUrl: string;
  secondaryCtaEnabled: boolean;
  secondaryCtaTitle: string;
  secondaryCtaSubtitle: string;
  secondaryCtaButtonText: string;
  secondaryCtaButtonLink: string;
  secondaryCtaAccent: string;
  secondaryCtaBgType: 'gradient' | 'solid' | 'image';
  secondaryCtaBgColor: string;
  secondaryCtaBgGradient: string;
  secondaryCtaBgImageUrl: string;
  secondaryCtaButtonColor: 'blue' | 'yellow';
  onUpdateMainContentConfig: (config: {
    accent: string;
    title: string;
    subtitle: string;
    primaryButtonText: string;
    primaryButtonLink: string;
    secondaryButtonText: string;
    secondaryButtonLink: string;
    bgType: 'gradient' | 'solid' | 'image';
    bgColor: string;
    bgGradient: string;
    bgImageUrl: string;
    secondaryCtaEnabled: boolean;
    secondaryCtaTitle: string;
    secondaryCtaSubtitle: string;
    secondaryCtaButtonText: string;
    secondaryCtaButtonLink: string;
    secondaryCtaAccent: string;
    secondaryCtaBgType: 'gradient' | 'solid' | 'image';
    secondaryCtaBgColor: string;
    secondaryCtaBgGradient: string;
    secondaryCtaBgImageUrl: string;
    secondaryCtaButtonColor: 'blue' | 'yellow';
  }) => Promise<void>;
}

type AdminSection = 'overview' | 'billing' | 'banners' | 'main-content' | 'relevant-services' | 'collections' | 'search-terms' | 'providers' | 'interested' | 'users' | 'services';

type SearchTermAdminItem = {
  id: string;
  term: string;
  month: string;
  searchCount: number;
  isManual: boolean;
};

const API_BASE = backendMode === 'laravel'
  ? laravelApiBaseUrl
  : `https://${projectId}.supabase.co/functions/v1/make-server-5d78aefb`;

const adminNavItems = [
  { id: 'overview' as const, label: 'Resumen', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'billing' as const, label: 'Facturación', icon: <DollarSign className="w-5 h-5" /> },
  { id: 'banners' as const, label: 'Banners', icon: <BookOpen className="w-5 h-5" /> },
  { id: 'main-content' as const, label: 'Contenido principal', icon: <Star className="w-5 h-5" /> },
  { id: 'relevant-services' as const, label: 'Servicios relevantes', icon: <Star className="w-5 h-5" /> },
  { id: 'collections' as const, label: 'Colecciones', icon: <Layers3 className="w-5 h-5" /> },
  { id: 'search-terms' as const, label: 'Términos de búsqueda', icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'providers' as const, label: 'Proveedores', icon: <Briefcase className="w-5 h-5" /> },
  { id: 'interested' as const, label: 'Interesados', icon: <FileText className="w-5 h-5" /> },
  { id: 'users' as const, label: 'Usuarios', icon: <Users className="w-5 h-5" /> },
  { id: 'services' as const, label: 'Servicios', icon: <BookOpen className="w-5 h-5" /> },
];

export function AdminDashboard({
  currentUser,
  accessToken,
  providers,
  users,
  artists,
  contracts,
  bookings,
  reviews,
  onVerifyProvider,
  onBanProvider,
  onUnbanProvider,
  onBanUser,
  onUnbanUser,
  onArchiveUser,
  onUnarchiveUser,
  onDeleteUser,
  onApproveProviderAccess,
  onRevokeProviderAccess,
  allCities,
  enabledCities,
  onUpdateEnabledCities,
  bannersSectionEnabled,
  onToggleBannersSection,
  relevantServicesSectionEnabled,
  relevantServicesTitle,
  relevantServicesSubtitle,
  relevantServiceIds,
  onUpdateRelevantServicesConfig,
  collections,
  onCreateCollection,
  onUpdateCollection,
  onDeleteCollection,
  homeCollectionSections,
  onCreateHomeCollectionSection,
  onUpdateHomeCollectionSection,
  onDeleteHomeCollectionSection,
  mainContentAccent,
  mainContentTitle,
  mainContentSubtitle,
  mainContentPrimaryButtonText,
  mainContentPrimaryButtonLink,
  mainContentSecondaryButtonText,
  mainContentSecondaryButtonLink,
  mainContentBgType,
  mainContentBgColor,
  mainContentBgGradient,
  mainContentBgImageUrl,
  secondaryCtaEnabled,
  secondaryCtaTitle,
  secondaryCtaSubtitle,
  secondaryCtaButtonText,
  secondaryCtaButtonLink,
  secondaryCtaAccent,
  secondaryCtaBgType,
  secondaryCtaBgColor,
  secondaryCtaBgGradient,
  secondaryCtaBgImageUrl,
  secondaryCtaButtonColor,
  onUpdateMainContentConfig,
}: AdminDashboardProps) {
  const ADMIN_TABLE_BATCH_SIZE = 16;
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'unverified' | 'banned'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userAccessFilter, setUserAccessFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'none'>('all');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'admin' | 'provider' | 'client'>('all');
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [relevantServiceSearchQuery, setRelevantServiceSearchQuery] = useState('');
  const [selectedEnabledCities, setSelectedEnabledCities] = useState<string[]>(enabledCities);
  const [savingEnabledCities, setSavingEnabledCities] = useState(false);
  const [selectedRelevantServiceIds, setSelectedRelevantServiceIds] = useState<string[]>(relevantServiceIds);
  const [relevantSectionEnabledDraft, setRelevantSectionEnabledDraft] = useState(relevantServicesSectionEnabled);
  const [relevantTitleDraft, setRelevantTitleDraft] = useState(relevantServicesTitle);
  const [relevantSubtitleDraft, setRelevantSubtitleDraft] = useState(relevantServicesSubtitle);
  const [savingRelevantServices, setSavingRelevantServices] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [collectionTitleDraft, setCollectionTitleDraft] = useState('');
  const [collectionSubtitleDraft, setCollectionSubtitleDraft] = useState('');
  const [collectionSlugDraft, setCollectionSlugDraft] = useState('');
  const [selectedCollectionServiceIds, setSelectedCollectionServiceIds] = useState<string[]>([]);
  const [collectionServiceSearchQuery, setCollectionServiceSearchQuery] = useState('');
  const [savingCollection, setSavingCollection] = useState(false);
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [homeCollSections, setHomeCollSections] = useState(homeCollectionSections);
  const [editingHomeCollSectionId, setEditingHomeCollSectionId] = useState<string | null>(null);
  const [homeCollSectionTitleDraft, setHomeCollSectionTitleDraft] = useState('');
  const [homeCollSectionSubtitleDraft, setHomeCollSectionSubtitleDraft] = useState('');
  const [homeCollSectionCollectionIdDraft, setHomeCollSectionCollectionIdDraft] = useState('');
  const [homeCollSectionSortOrderDraft, setHomeCollSectionSortOrderDraft] = useState(0);
  const [homeCollSectionVisibleDraft, setHomeCollSectionVisibleDraft] = useState(true);
  const [savingHomeCollSection, setSavingHomeCollSection] = useState(false);
  const [showHomeCollSectionForm, setShowHomeCollSectionForm] = useState(false);
  const [mainContentAccentDraft, setMainContentAccentDraft] = useState(mainContentAccent);
  const [mainContentTitleDraft, setMainContentTitleDraft] = useState(mainContentTitle);
  const [mainContentSubtitleDraft, setMainContentSubtitleDraft] = useState(mainContentSubtitle);
  const [mainContentPrimaryButtonTextDraft, setMainContentPrimaryButtonTextDraft] = useState(mainContentPrimaryButtonText);
  const [mainContentPrimaryButtonLinkDraft, setMainContentPrimaryButtonLinkDraft] = useState(mainContentPrimaryButtonLink);
  const [mainContentSecondaryButtonTextDraft, setMainContentSecondaryButtonTextDraft] = useState(mainContentSecondaryButtonText);
  const [mainContentSecondaryButtonLinkDraft, setMainContentSecondaryButtonLinkDraft] = useState(mainContentSecondaryButtonLink);
  const [mainContentBgTypeDraft, setMainContentBgTypeDraft] = useState<'gradient' | 'solid' | 'image'>(mainContentBgType);
  const [mainContentBgColorDraft, setMainContentBgColorDraft] = useState(mainContentBgColor);
  const [mainContentBgGradientDraft, setMainContentBgGradientDraft] = useState(mainContentBgGradient);
  const [mainContentBgImageUrlDraft, setMainContentBgImageUrlDraft] = useState(mainContentBgImageUrl);
  const [secondaryCtaEnabledDraft, setSecondaryCtaEnabledDraft] = useState(secondaryCtaEnabled);
  const [secondaryCtaTitleDraft, setSecondaryCtaTitleDraft] = useState(secondaryCtaTitle);
  const [secondaryCtaSubtitleDraft, setSecondaryCtaSubtitleDraft] = useState(secondaryCtaSubtitle);
  const [secondaryCtaButtonTextDraft, setSecondaryCtaButtonTextDraft] = useState(secondaryCtaButtonText);
  const [secondaryCtaButtonLinkDraft, setSecondaryCtaButtonLinkDraft] = useState(secondaryCtaButtonLink);
  const [secondaryCtaAccentDraft, setSecondaryCtaAccentDraft] = useState(secondaryCtaAccent);
  const [secondaryCtaBgTypeDraft, setSecondaryCtaBgTypeDraft] = useState<'gradient' | 'solid' | 'image'>(secondaryCtaBgType);
  const [secondaryCtaBgColorDraft, setSecondaryCtaBgColorDraft] = useState(secondaryCtaBgColor);
  const [secondaryCtaBgGradientDraft, setSecondaryCtaBgGradientDraft] = useState(secondaryCtaBgGradient);
  const [secondaryCtaBgImageUrlDraft, setSecondaryCtaBgImageUrlDraft] = useState(secondaryCtaBgImageUrl);
  const [secondaryCtaButtonColorDraft, setSecondaryCtaButtonColorDraft] = useState<'blue' | 'yellow'>(secondaryCtaButtonColor);
  const [savingMainContent, setSavingMainContent] = useState(false);
  const [uploadingMainContentBgImage, setUploadingMainContentBgImage] = useState(false);
  const mainContentBgFileInputRef = useRef<HTMLInputElement | null>(null);
  const [visibleProvidersCount, setVisibleProvidersCount] = useState(ADMIN_TABLE_BATCH_SIZE);
  const [visibleUsersCount, setVisibleUsersCount] = useState(ADMIN_TABLE_BATCH_SIZE);
  const [visibleServicesCount, setVisibleServicesCount] = useState(ADMIN_TABLE_BATCH_SIZE);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banType, setBanType] = useState<'provider' | 'user'>('provider');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [searchTerms, setSearchTerms] = useState<SearchTermAdminItem[]>([]);
  const [loadingSearchTerms, setLoadingSearchTerms] = useState(false);
  const [savingSearchTerm, setSavingSearchTerm] = useState(false);
  const [editingSearchTermId, setEditingSearchTermId] = useState<string | null>(null);
  const [searchTermDraft, setSearchTermDraft] = useState('');
  const [searchTermMonthDraft, setSearchTermMonthDraft] = useState(currentMonth);
  const [searchTermCountDraft, setSearchTermCountDraft] = useState('0');
  const [searchTermIsManualDraft, setSearchTermIsManualDraft] = useState(true);
  const [searchTermsMonthFilter, setSearchTermsMonthFilter] = useState(currentMonth);
  const [searchTermsMinCountFilter, setSearchTermsMinCountFilter] = useState('0');
  const [searchTermsSort, setSearchTermsSort] = useState<'frequency_desc' | 'frequency_asc' | 'recent'>('frequency_desc');
  const [interestedUsersCount, setInterestedUsersCount] = useState(0);
  const [loadingInterestedUsers, setLoadingInterestedUsers] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirm: (() => Promise<void> | void) | null;
  }>({
    open: false,
    title: '',
    description: '',
    confirmText: 'Confirmar',
    variant: 'warning',
    onConfirm: null,
  });

  const openConfirmModal = (options: {
    title: string;
    description: string;
    confirmText: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirm: () => Promise<void> | void;
  }) => {
    setConfirmModal({
      open: true,
      title: options.title,
      description: options.description,
      confirmText: options.confirmText,
      variant: options.variant,
      onConfirm: options.onConfirm,
    });
  };

  const handleConfirmModalAction = async () => {
    try {
      await confirmModal.onConfirm?.();
    } finally {
      setConfirmModal((prev) => ({ ...prev, open: false, onConfirm: null }));
    }
  };

  useEffect(() => {
    setSelectedEnabledCities(enabledCities);
  }, [enabledCities]);

  useEffect(() => {
    setHomeCollSections(homeCollectionSections);
  }, [homeCollectionSections]);

  useEffect(() => {
    setSelectedRelevantServiceIds(relevantServiceIds);
    setRelevantSectionEnabledDraft(relevantServicesSectionEnabled);
    setRelevantTitleDraft(relevantServicesTitle);
    setRelevantSubtitleDraft(relevantServicesSubtitle);
  }, [relevantServiceIds, relevantServicesSectionEnabled, relevantServicesTitle, relevantServicesSubtitle]);

  useEffect(() => {
    if (!editingCollectionId) {
      return;
    }

    const collection = collections.find((item) => item.id === editingCollectionId);
    if (!collection) {
      setEditingCollectionId(null);
      setCollectionTitleDraft('');
      setCollectionSubtitleDraft('');
      setCollectionSlugDraft('');
      setSelectedCollectionServiceIds([]);
      return;
    }

    setCollectionTitleDraft(collection.title);
    setCollectionSubtitleDraft(collection.subtitle || '');
    setCollectionSlugDraft(collection.slug);
    setSelectedCollectionServiceIds(Array.isArray(collection.serviceIds) ? collection.serviceIds : []);
  }, [collections, editingCollectionId]);

  useEffect(() => {
    setMainContentAccentDraft(mainContentAccent);
    setMainContentTitleDraft(mainContentTitle);
    setMainContentSubtitleDraft(mainContentSubtitle);
    setMainContentPrimaryButtonTextDraft(mainContentPrimaryButtonText);
    setMainContentPrimaryButtonLinkDraft(mainContentPrimaryButtonLink);
    setMainContentSecondaryButtonTextDraft(mainContentSecondaryButtonText);
    setMainContentSecondaryButtonLinkDraft(mainContentSecondaryButtonLink);
    setMainContentBgTypeDraft(mainContentBgType);
    setMainContentBgColorDraft(mainContentBgColor);
    setMainContentBgGradientDraft(mainContentBgGradient);
    setMainContentBgImageUrlDraft(mainContentBgImageUrl);
  }, [
    mainContentAccent,
    mainContentTitle,
    mainContentSubtitle,
    mainContentPrimaryButtonText,
    mainContentPrimaryButtonLink,
    mainContentSecondaryButtonText,
    mainContentSecondaryButtonLink,
    mainContentBgType,
    mainContentBgColor,
    mainContentBgGradient,
    mainContentBgImageUrl,
  ]);

  const slugify = (value?: string) => {
    if (!value) return '';

    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  useEffect(() => {
    if (!accessToken || currentUser.role !== 'admin') {
      setInterestedUsersCount(0);
      return;
    }

    const loadInterestedUsers = async () => {
      setLoadingInterestedUsers(true);
      try {
        const response = await fetch(`${API_BASE}/admin/interested-providers`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();
        setInterestedUsersCount(Array.isArray(data) ? data.length : 0);
      } catch {
        setInterestedUsersCount(0);
      } finally {
        setLoadingInterestedUsers(false);
      }
    };

    loadInterestedUsers();
  }, [accessToken, currentUser.role]);

  const resetSearchTermForm = () => {
    setEditingSearchTermId(null);
    setSearchTermDraft('');
    setSearchTermMonthDraft(currentMonth);
    setSearchTermCountDraft('0');
    setSearchTermIsManualDraft(true);
  };

  const loadSearchTerms = async () => {
    if (!accessToken || currentUser.role !== 'admin') {
      setSearchTerms([]);
      return;
    }

    setLoadingSearchTerms(true);
    try {
      const params = new URLSearchParams();
      if (searchTermsMonthFilter) {
        params.set('month', searchTermsMonthFilter);
      }

      const minCount = Number(searchTermsMinCountFilter || 0);
      if (!Number.isNaN(minCount) && minCount > 0) {
        params.set('min_count', String(minCount));
      }

      params.set('sort', searchTermsSort);
      const response = await fetch(`${API_BASE}/admin/search-terms?${params.toString()}`, {
        headers: {
          Authorization: 'Bearer ' + accessToken,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const data = await response.json();
      setSearchTerms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading search terms', error);
      setSearchTerms([]);
      toast.error('No se pudieron cargar los términos de búsqueda.');
    } finally {
      setLoadingSearchTerms(false);
    }
  };

  useEffect(() => {
    if (activeSection !== 'search-terms') {
      return;
    }

    loadSearchTerms();
  }, [activeSection, accessToken, currentUser.role, searchTermsMonthFilter, searchTermsMinCountFilter, searchTermsSort]);

  const handleSaveSearchTerm = async () => {
    if (!accessToken) {
      toast.error('No hay sesión activa para guardar términos.');
      return;
    }

    const normalizedTerm = searchTermDraft.trim();
    if (!normalizedTerm) {
      toast.error('Debes indicar un término de búsqueda.');
      return;
    }

    const parsedCount = Number(searchTermCountDraft || 0);
    if (Number.isNaN(parsedCount) || parsedCount < 0) {
      toast.error('La frecuencia debe ser un número válido mayor o igual a 0.');
      return;
    }

    setSavingSearchTerm(true);
    try {
      const payload = {
        term: normalizedTerm,
        month: searchTermMonthDraft || currentMonth,
        searchCount: parsedCount,
        isManual: searchTermIsManualDraft,
      };

      const endpoint = editingSearchTermId
        ? `${API_BASE}/admin/search-terms/${editingSearchTermId}`
        : `${API_BASE}/admin/search-terms`;
      const method = editingSearchTermId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: 'Bearer ' + accessToken,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || `Error ${response.status}`);
      }

      resetSearchTermForm();
      await loadSearchTerms();
      toast.success(editingSearchTermId ? 'Término actualizado.' : 'Término creado.');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo guardar el término.');
    } finally {
      setSavingSearchTerm(false);
    }
  };

  const handleEditSearchTerm = (item: SearchTermAdminItem) => {
    setEditingSearchTermId(item.id);
    setSearchTermDraft(item.term);
    setSearchTermMonthDraft(item.month || currentMonth);
    setSearchTermCountDraft(String(item.searchCount ?? 0));
    setSearchTermIsManualDraft(Boolean(item.isManual));
  };

  const handleDeleteSearchTerm = async (item: SearchTermAdminItem) => {
    if (!accessToken) return;

    setConfirmModal({
      open: true,
      title: 'Eliminar término',
      description: `¿Seguro que deseas eliminar "${item.term}"?`,
      confirmText: 'Eliminar',
      variant: 'danger',
      onConfirm: async () => {
        const response = await fetch(`${API_BASE}/admin/search-terms/${item.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer ' + accessToken,
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}`);
        }

        await loadSearchTerms();
        toast.success('Término eliminado.');
      },
    });
  };

  // Check if current user is admin
  if (currentUser.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <h2 className="text-xl mb-2">Acceso Denegado</h2>
              <p className="text-gray-600">No tienes permisos para acceder al panel de administración.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const totalProviders = providers.length;
    const verifiedProviders = providers.filter(p => p.verified && !p.banned).length;
    const bannedProviders = providers.filter(p => p.banned).length;
    const totalServices = artists.length;
    const activeServices = artists.filter(a => !a.isArchived && a.isPublished).length;
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const totalRevenue = contracts.reduce((sum, c) => sum + c.terms.price, 0);
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    return {
      totalUsers,
      totalProviders,
      verifiedProviders,
      bannedProviders,
      totalServices,
      activeServices,
      totalContracts,
      activeContracts,
      totalBookings,
      completedBookings,
      totalRevenue,
      avgRating: Math.round(avgRating * 10) / 10
    };
  }, [users, providers, artists, contracts, bookings, reviews]);

  // Filter providers
  const filteredProviders = useMemo(() => {
    let filtered = [...providers];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus === 'verified') {
      filtered = filtered.filter(p => p.verified && !p.banned);
    } else if (filterStatus === 'unverified') {
      filtered = filtered.filter(p => !p.verified && !p.banned);
    } else if (filterStatus === 'banned') {
      filtered = filtered.filter(p => p.banned);
    }

    return filtered;
  }, [providers, searchQuery, filterStatus]);

  const pendingProviderRequestCount = useMemo(() => {
    return users.filter((user) => !user.isProvider && user.providerRequestStatus === 'pending').length;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = userSearchQuery.trim().toLowerCase();
    let filtered = [...users];

    if (query) {
      filtered = filtered.filter((user) => {
        const typeLabel = user.role === 'admin' ? 'admin' : user.isProvider ? 'proveedor' : 'cliente';
        const accessLabel = user.isProvider
          ? 'aprobado'
          : user.providerRequestStatus === 'pending'
            ? 'pendiente'
            : user.providerRequestStatus === 'rejected'
              ? 'rechazado'
              : 'sin solicitud';

        return (
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          (user.phone || '').toLowerCase().includes(query) ||
          (user.whatsappNumber || '').toLowerCase().includes(query) ||
          typeLabel.includes(query) ||
          accessLabel.includes(query)
        );
      });
    }

    if (userTypeFilter !== 'all') {
      filtered = filtered.filter((user) => {
        if (userTypeFilter === 'admin') return user.role === 'admin';
        if (userTypeFilter === 'provider') return user.isProvider;
        if (userTypeFilter === 'client') return !user.isProvider && user.role !== 'admin';
        return true;
      });
    }

    if (userAccessFilter !== 'all') {
      filtered = filtered.filter((user) => {
        if (userAccessFilter === 'approved') return user.isProvider;
        if (userAccessFilter === 'pending') return !user.isProvider && user.providerRequestStatus === 'pending';
        if (userAccessFilter === 'rejected') return !user.isProvider && user.providerRequestStatus === 'rejected';
        if (userAccessFilter === 'none') return !user.isProvider && (!user.providerRequestStatus || user.providerRequestStatus === 'none');
        return true;
      });
    }

    // Priorizamos en la tabla a quienes tienen solicitud pendiente para revisión más rápida.
    return filtered.sort((a, b) => {
      const aPending = !a.isProvider && a.providerRequestStatus === 'pending' ? 1 : 0;
      const bPending = !b.isProvider && b.providerRequestStatus === 'pending' ? 1 : 0;
      if (aPending !== bPending) return bPending - aPending;

      const aTime = new Date(a.createdAt).getTime() || 0;
      const bTime = new Date(b.createdAt).getTime() || 0;
      return bTime - aTime;
    });
  }, [users, userSearchQuery, userAccessFilter, userTypeFilter]);

  const filteredServices = useMemo(() => {
    const query = serviceSearchQuery.trim().toLowerCase();

    if (!query) {
      return artists;
    }

    return artists.filter((service) => {
      const provider = providers.find((p) => p.userId === service.userId);

      return (
        service.name.toLowerCase().includes(query) ||
        (service.category || '').toLowerCase().includes(query) ||
        (service.subcategory || '').toLowerCase().includes(query) ||
        (service.location || '').toLowerCase().includes(query) ||
        (provider?.businessName || '').toLowerCase().includes(query)
      );
    });
  }, [artists, providers, serviceSearchQuery]);

  const filteredRelevantServices = useMemo(() => {
    const query = relevantServiceSearchQuery.trim().toLowerCase();
    if (!query) {
      return artists.filter((service) => !service.isArchived && service.isPublished !== false);
    }

    return artists.filter((service) => {
      if (service.isArchived || service.isPublished === false) {
        return false;
      }

      const provider = providers.find((p) => p.userId === service.userId);

      return (
        service.name.toLowerCase().includes(query) ||
        (service.category || '').toLowerCase().includes(query) ||
        (service.subcategory || '').toLowerCase().includes(query) ||
        (provider?.businessName || '').toLowerCase().includes(query)
      );
    });
  }, [artists, providers, relevantServiceSearchQuery]);

  const filteredCollectionServices = useMemo(() => {
    const query = collectionServiceSearchQuery.trim().toLowerCase();
    if (!query) {
      return artists.filter((service) => !service.isArchived && service.isPublished !== false);
    }

    return artists.filter((service) => {
      if (service.isArchived || service.isPublished === false) {
        return false;
      }

      const provider = providers.find((candidate) => candidate.userId === service.userId);

      return (
        service.name.toLowerCase().includes(query) ||
        (service.category || '').toLowerCase().includes(query) ||
        (service.subcategory || '').toLowerCase().includes(query) ||
        (provider?.businessName || '').toLowerCase().includes(query)
      );
    });
  }, [artists, providers, collectionServiceSearchQuery]);

  const filteredCollectionServiceIds = useMemo(
    () => filteredCollectionServices.map((service) => String(service.id)),
    [filteredCollectionServices],
  );

  const selectedFilteredCollectionServicesCount = useMemo(
    () => filteredCollectionServiceIds.filter((serviceId) => selectedCollectionServiceIds.includes(serviceId)).length,
    [filteredCollectionServiceIds, selectedCollectionServiceIds],
  );

  const visibleFilteredProviders = useMemo(
    () => filteredProviders.slice(0, visibleProvidersCount),
    [filteredProviders, visibleProvidersCount]
  );

  const visibleFilteredUsers = useMemo(
    () => filteredUsers.slice(0, visibleUsersCount),
    [filteredUsers, visibleUsersCount]
  );

  const visibleFilteredServices = useMemo(
    () => filteredServices.slice(0, visibleServicesCount),
    [filteredServices, visibleServicesCount]
  );

  const hasCityAvailabilityChanges = useMemo(() => {
    const currentSelection = selectedEnabledCities.slice().sort().join('|');
    const persistedSelection = enabledCities.slice().sort().join('|');
    return currentSelection !== persistedSelection;
  }, [selectedEnabledCities, enabledCities]);

  const hasRelevantServicesChanges = useMemo(() => {
    const draftIds = selectedRelevantServiceIds.slice().sort().join('|');
    const persistedIds = relevantServiceIds.slice().sort().join('|');
    return (
      draftIds !== persistedIds ||
      relevantSectionEnabledDraft !== relevantServicesSectionEnabled ||
      relevantTitleDraft.trim() !== relevantServicesTitle.trim() ||
      relevantSubtitleDraft.trim() !== relevantServicesSubtitle.trim()
    );
  }, [
    selectedRelevantServiceIds,
    relevantServiceIds,
    relevantSectionEnabledDraft,
    relevantServicesSectionEnabled,
    relevantTitleDraft,
    relevantServicesTitle,
    relevantSubtitleDraft,
    relevantServicesSubtitle,
  ]);

  const hasCollectionChanges = useMemo(() => {
    const draftIds = selectedCollectionServiceIds.slice().sort().join('|');

    if (!editingCollectionId) {
      return collectionTitleDraft.trim() !== '' || collectionSubtitleDraft.trim() !== '' || collectionSlugDraft.trim() !== '' || draftIds !== '';
    }

    const existingCollection = collections.find((collection) => collection.id === editingCollectionId);
    if (!existingCollection) {
      return true;
    }

    const existingIds = existingCollection.serviceIds.slice().sort().join('|');
    return (
      collectionTitleDraft.trim() !== existingCollection.title.trim() ||
      collectionSubtitleDraft.trim() !== (existingCollection.subtitle || '').trim() ||
      slugify(collectionSlugDraft) !== existingCollection.slug ||
      draftIds !== existingIds
    );
  }, [collections, editingCollectionId, collectionTitleDraft, collectionSubtitleDraft, collectionSlugDraft, selectedCollectionServiceIds]);

  const hasMainContentChanges = useMemo(() => {
    return (
      mainContentAccentDraft.trim() !== mainContentAccent.trim() ||
      mainContentTitleDraft.trim() !== mainContentTitle.trim() ||
      mainContentSubtitleDraft.trim() !== mainContentSubtitle.trim() ||
      mainContentPrimaryButtonTextDraft.trim() !== mainContentPrimaryButtonText.trim() ||
      mainContentPrimaryButtonLinkDraft.trim() !== mainContentPrimaryButtonLink.trim() ||
      mainContentSecondaryButtonTextDraft.trim() !== mainContentSecondaryButtonText.trim() ||
      mainContentSecondaryButtonLinkDraft.trim() !== mainContentSecondaryButtonLink.trim() ||
      mainContentBgTypeDraft !== mainContentBgType ||
      mainContentBgColorDraft.trim() !== mainContentBgColor.trim() ||
      mainContentBgGradientDraft.trim() !== mainContentBgGradient.trim() ||
      mainContentBgImageUrlDraft.trim() !== mainContentBgImageUrl.trim() ||
      secondaryCtaEnabledDraft !== secondaryCtaEnabled ||
      secondaryCtaTitleDraft.trim() !== secondaryCtaTitle.trim() ||
      secondaryCtaSubtitleDraft.trim() !== secondaryCtaSubtitle.trim() ||
      secondaryCtaButtonTextDraft.trim() !== secondaryCtaButtonText.trim() ||
      secondaryCtaButtonLinkDraft.trim() !== secondaryCtaButtonLink.trim() ||
      secondaryCtaAccentDraft.trim() !== secondaryCtaAccent.trim() ||
      secondaryCtaBgTypeDraft !== secondaryCtaBgType ||
      secondaryCtaBgColorDraft.trim() !== secondaryCtaBgColor.trim() ||
      secondaryCtaBgGradientDraft.trim() !== secondaryCtaBgGradient.trim() ||
      secondaryCtaBgImageUrlDraft.trim() !== secondaryCtaBgImageUrl.trim() ||
      secondaryCtaButtonColorDraft !== secondaryCtaButtonColor
    );
  }, [
    mainContentAccentDraft,
    mainContentAccent,
    mainContentTitleDraft,
    mainContentTitle,
    mainContentSubtitleDraft,
    mainContentSubtitle,
    mainContentPrimaryButtonTextDraft,
    mainContentPrimaryButtonText,
    mainContentPrimaryButtonLinkDraft,
    mainContentPrimaryButtonLink,
    mainContentSecondaryButtonTextDraft,
    mainContentSecondaryButtonText,
    mainContentSecondaryButtonLinkDraft,
    mainContentSecondaryButtonLink,
    mainContentBgTypeDraft,
    mainContentBgType,
    mainContentBgColorDraft,
    mainContentBgColor,
    mainContentBgGradientDraft,
    mainContentBgGradient,
    mainContentBgImageUrlDraft,
    mainContentBgImageUrl,
    secondaryCtaEnabledDraft,
    secondaryCtaEnabled,
    secondaryCtaTitleDraft,
    secondaryCtaTitle,
    secondaryCtaSubtitleDraft,
    secondaryCtaSubtitle,
    secondaryCtaButtonTextDraft,
    secondaryCtaButtonText,
    secondaryCtaButtonLinkDraft,
    secondaryCtaButtonLink,
    secondaryCtaAccentDraft,
    secondaryCtaAccent,
    secondaryCtaBgTypeDraft,
    secondaryCtaBgType,
    secondaryCtaBgColorDraft,
    secondaryCtaBgColor,
    secondaryCtaBgGradientDraft,
    secondaryCtaBgGradient,
    secondaryCtaBgImageUrlDraft,
    secondaryCtaBgImageUrl,
    secondaryCtaButtonColorDraft,
    secondaryCtaButtonColor,
  ]);

  useEffect(() => {
    setVisibleProvidersCount(ADMIN_TABLE_BATCH_SIZE);
  }, [searchQuery, filterStatus, filteredProviders.length]);

  useEffect(() => {
    setVisibleUsersCount(ADMIN_TABLE_BATCH_SIZE);
  }, [userSearchQuery, userAccessFilter, userTypeFilter, filteredUsers.length]);

  useEffect(() => {
    setVisibleServicesCount(ADMIN_TABLE_BATCH_SIZE);
  }, [serviceSearchQuery, filteredServices.length]);

  const handleVerifyProvider = async (providerId: string) => {
    try {
      await onVerifyProvider(providerId);
      toast.success('Proveedor verificado exitosamente');
    } catch (error) {
      toast.error('Error al verificar proveedor');
    }
  };

  const handleBanProvider = async () => {
    if (!selectedProvider || !banReason.trim()) {
      toast.error('Por favor ingresa una razón para el baneo');
      return;
    }

    try {
      await onBanProvider(selectedProvider.id, banReason);
      setShowBanDialog(false);
      setBanReason('');
      setSelectedProvider(null);
      toast.success('Proveedor baneado exitosamente');
    } catch (error) {
      toast.error('Error al banear proveedor');
    }
  };

  const handleBanUser = async () => {
    if (!selectedUserId || !banReason.trim()) {
      toast.error('Por favor ingresa una razón para el baneo');
      return;
    }

    try {
      await onBanUser(selectedUserId, banReason);
      setShowBanDialog(false);
      setBanReason('');
      setSelectedUserId(null);
      toast.success('Usuario baneado exitosamente');
    } catch (error) {
      toast.error('Error al banear usuario');
    }
  };

  const handleUnbanProvider = async (providerId: string) => {
    try {
      await onUnbanProvider(providerId);
      toast.success('Proveedor desbaneado exitosamente');
    } catch (error) {
      toast.error('Error al desbanear proveedor');
    }
  };

  const openBanDialog = (provider: Provider) => {
    setSelectedProvider(provider);
    setBanType('provider');
    setShowBanDialog(true);
  };

  const toggleEnabledCity = (cityName: string) => {
    setSelectedEnabledCities((previous) => (
      previous.includes(cityName)
        ? previous.filter((city) => city !== cityName)
        : [...previous, cityName].sort((left, right) => left.localeCompare(right, 'es'))
    ));
  };

  const handleSaveEnabledCities = async () => {
    try {
      setSavingEnabledCities(true);
      await onUpdateEnabledCities(selectedEnabledCities);
    } finally {
      setSavingEnabledCities(false);
    }
  };

  const toggleRelevantService = (serviceId: string) => {
    setSelectedRelevantServiceIds((previous) => (
      previous.includes(serviceId)
        ? previous.filter((id) => id !== serviceId)
        : [...previous, serviceId]
    ));
  };

  const handleSaveRelevantServices = async () => {
    try {
      setSavingRelevantServices(true);
      await onUpdateRelevantServicesConfig({
        enabled: relevantSectionEnabledDraft,
        title: relevantTitleDraft.trim() || 'Servicios relevantes',
        subtitle: relevantSubtitleDraft.trim(),
        serviceIds: selectedRelevantServiceIds,
      });
    } finally {
      setSavingRelevantServices(false);
    }
  };

  const resetCollectionForm = () => {
    setEditingCollectionId(null);
    setCollectionTitleDraft('');
    setCollectionSubtitleDraft('');
    setCollectionSlugDraft('');
    setSelectedCollectionServiceIds([]);
    setCollectionServiceSearchQuery('');
  };

  const openCreateCollectionForm = () => {
    resetCollectionForm();
    setShowCollectionForm(true);
  };

  const closeCollectionForm = () => {
    resetCollectionForm();
    setShowCollectionForm(false);
  };

  const resetHomeCollSectionForm = () => {
    setEditingHomeCollSectionId(null);
    setHomeCollSectionTitleDraft('');
    setHomeCollSectionSubtitleDraft('');
    setHomeCollSectionCollectionIdDraft('');
    setHomeCollSectionSortOrderDraft(0);
    setHomeCollSectionVisibleDraft(true);
  };

  const openCreateHomeCollSectionForm = () => {
    resetHomeCollSectionForm();
    setShowHomeCollSectionForm(true);
  };

  const openEditHomeCollSectionForm = (section: { id: string; title: string; subtitle?: string | null; collectionId: string; sortOrder: number; visible: boolean }) => {
    setEditingHomeCollSectionId(section.id);
    setHomeCollSectionTitleDraft(section.title);
    setHomeCollSectionSubtitleDraft(section.subtitle || '');
    setHomeCollSectionCollectionIdDraft(section.collectionId);
    setHomeCollSectionSortOrderDraft(section.sortOrder);
    setHomeCollSectionVisibleDraft(section.visible);
    setShowHomeCollSectionForm(true);
  };

  const closeHomeCollSectionForm = () => {
    resetHomeCollSectionForm();
    setShowHomeCollSectionForm(false);
  };

  const handleSaveHomeCollSection = async () => {
    if (!homeCollSectionTitleDraft.trim() || !homeCollSectionCollectionIdDraft) return;
    setSavingHomeCollSection(true);
    try {
      const payload = {
        title: homeCollSectionTitleDraft.trim(),
        subtitle: homeCollSectionSubtitleDraft.trim(),
        collectionId: homeCollSectionCollectionIdDraft,
        sortOrder: homeCollSectionSortOrderDraft,
        visible: homeCollSectionVisibleDraft,
      };
      let result;
      if (editingHomeCollSectionId) {
        result = await onUpdateHomeCollectionSection(editingHomeCollSectionId, payload);
        setHomeCollSections((prev) => prev.map((s) => s.id === editingHomeCollSectionId ? { ...s, ...payload, id: editingHomeCollSectionId } : s));
      } else {
        result = await onCreateHomeCollectionSection(payload);
        if (result?.id) {
          setHomeCollSections((prev) => [...prev, { ...payload, id: String(result.id) }]);
        }
      }
      closeHomeCollSectionForm();
    } finally {
      setSavingHomeCollSection(false);
    }
  };

  const handleDeleteHomeCollSection = async (sectionId: string) => {
    try {
      await onDeleteHomeCollectionSection(sectionId);
      setHomeCollSections((prev) => prev.filter((s) => s.id !== sectionId));
    } catch {
      // handled in parent
    }
  };

  const toggleCollectionService = (serviceId: string) => {
    setSelectedCollectionServiceIds((previous) => (
      previous.includes(serviceId)
        ? previous.filter((id) => id !== serviceId)
        : [...previous, serviceId]
    ));
  };

  const handleEditCollection = (collection: AdminDashboardProps['collections'][number]) => {
    setEditingCollectionId(collection.id);
    setCollectionTitleDraft(collection.title);
    setCollectionSubtitleDraft(collection.subtitle || '');
    setCollectionSlugDraft(collection.slug);
    setSelectedCollectionServiceIds(Array.isArray(collection.serviceIds) ? collection.serviceIds : []);
    setShowCollectionForm(true);
  };

  const selectAllFilteredCollectionServices = () => {
    setSelectedCollectionServiceIds((previous) => {
      const merged = new Set(previous);
      filteredCollectionServiceIds.forEach((serviceId) => merged.add(serviceId));
      return Array.from(merged);
    });
  };

  const clearFilteredCollectionServices = () => {
    const filteredIds = new Set(filteredCollectionServiceIds);
    setSelectedCollectionServiceIds((previous) => previous.filter((serviceId) => !filteredIds.has(serviceId)));
  };

  const handleSaveCollection = async () => {
    const title = collectionTitleDraft.trim();
    const slug = slugify(collectionSlugDraft || collectionTitleDraft);

    if (!title) {
      toast.error('El título de la colección es obligatorio');
      return;
    }

    if (!slug) {
      toast.error('Debes indicar un slug válido');
      return;
    }

    try {
      setSavingCollection(true);
      const payload = {
        title,
        subtitle: collectionSubtitleDraft.trim(),
        slug,
        serviceIds: selectedCollectionServiceIds,
      };

      const savedCollection = editingCollectionId
        ? await onUpdateCollection(editingCollectionId, payload)
        : await onCreateCollection(payload);

      if (savedCollection?.id || editingCollectionId) {
        closeCollectionForm();
      }
    } finally {
      setSavingCollection(false);
    }
  };

  const handleDeleteCollection = (collection: AdminDashboardProps['collections'][number]) => {
    openConfirmModal({
      title: 'Eliminar colección',
      description: `Se eliminará la colección "${collection.title}" y dejará de estar disponible en /coleccion/${collection.slug}.`,
      confirmText: 'Eliminar',
      variant: 'danger',
      onConfirm: async () => {
        await onDeleteCollection(collection.id);
        if (editingCollectionId === collection.id) {
          resetCollectionForm();
        }
      },
    });
  };

  const handleSaveMainContent = async () => {
    try {
      setSavingMainContent(true);
      await onUpdateMainContentConfig({
        accent: mainContentAccentDraft.trim() || 'Promociones y Novedades',
        title: mainContentTitleDraft.trim() || 'Todo para tu evento, en un solo lugar',
        subtitle: mainContentSubtitleDraft.trim() || 'Encuentra ofertas activas, nuevas publicaciones y proveedores listos para ayudarte a crear una celebración inolvidable.',
        primaryButtonText: mainContentPrimaryButtonTextDraft.trim() || 'Ver servicios',
        primaryButtonLink: mainContentPrimaryButtonLinkDraft.trim() || '/servicios/venezuela',
        secondaryButtonText: mainContentSecondaryButtonTextDraft.trim() || 'Cómo funciona',
        secondaryButtonLink: mainContentSecondaryButtonLinkDraft.trim() || '/como-funciona',
        bgType: mainContentBgTypeDraft,
        bgColor: mainContentBgColorDraft.trim() || '#0A1F44',
        bgGradient: mainContentBgGradientDraft.trim() || 'linear-gradient(135deg, #0A1F44 0%, #B8860B 100%)',
        bgImageUrl: mainContentBgImageUrlDraft.trim(),
        secondaryCtaEnabled: secondaryCtaEnabledDraft,
        secondaryCtaTitle: secondaryCtaTitleDraft.trim() || 'Únete a la red de proveedores de Memorialo',
        secondaryCtaSubtitle: secondaryCtaSubtitleDraft.trim() || 'Publica tus servicios, recibe solicitudes y haz crecer tu negocio de eventos.',
        secondaryCtaButtonText: secondaryCtaButtonTextDraft.trim() || 'Quiero ser proveedor',
        secondaryCtaButtonLink: secondaryCtaButtonLinkDraft.trim() || '/proveedores',
        secondaryCtaAccent: secondaryCtaAccentDraft.trim(),
        secondaryCtaBgType: secondaryCtaBgTypeDraft,
        secondaryCtaBgColor: secondaryCtaBgColorDraft.trim() || '#F7B267',
        secondaryCtaBgGradient: secondaryCtaBgGradientDraft.trim() || 'linear-gradient(135deg, #F7B267 0%, #F4A261 100%)',
        secondaryCtaBgImageUrl: secondaryCtaBgImageUrlDraft.trim(),
        secondaryCtaButtonColor: secondaryCtaButtonColorDraft,
      });
    } finally {
      setSavingMainContent(false);
    }
  };

  const handleMainContentBgImageFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!accessToken) {
      toast.error('Debes iniciar sesión para subir imágenes');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    try {
      setUploadingMainContentBgImage(true);
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch(`${API_BASE}/upload-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          imageData: base64,
          fileName: file.name,
          contentType: file.type,
          folder: 'main-content-bg-images',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error ?? 'Error al subir la imagen');
      }

      const data = await response.json();
      const uploadedUrl = typeof data?.url === 'string' ? data.url : '';

      if (!uploadedUrl) {
        throw new Error('No se recibió URL de la imagen');
      }

      setMainContentBgTypeDraft('image');
      setMainContentBgImageUrlDraft(uploadedUrl);
      toast.success('Imagen subida correctamente. Guarda los cambios para publicarlo.');
    } catch (error: any) {
      toast.error(error?.message ?? 'Error al subir la imagen');
    } finally {
      setUploadingMainContentBgImage(false);
    }
  };

  const handleNavClick = (section: AdminSection) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  // Get provider's services
  const getProviderServices = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider) return [];
    return artists.filter(a => a.userId === provider.userId);
  };

  // Get provider's user data
  const getProviderUser = (provider: Provider) => {
    return users.find(u => u.id === provider.userId);
  };

  const selectedBanUser = selectedUserId ? users.find((u) => u.id === selectedUserId) : null;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-[#1B2A47]/10">
        <p className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold mb-0.5">Panel Admin</p>
        <p className="text-sm text-gray-500 truncate">{currentUser.name}</p>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {adminNavItems.map((item) => {
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-[#1B2A47] text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className={isActive ? 'text-[#D4AF37]' : ''}>{item.icon}</span>
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {item.id === 'interested' && interestedUsersCount > 0 && (
                <span className={`min-w-6 rounded-full px-2 py-0.5 text-[11px] font-semibold ${isActive ? 'bg-[#D4AF37] text-[#1B2A47]' : 'bg-amber-100 text-amber-800'}`}>
                  {interestedUsersCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-r from-[#1B2A47] to-[#2d4270] rounded-xl p-3 text-white text-xs">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-semibold">Resumen</span>
          </div>
          <p className="text-gray-300">
            {stats.totalUsers} usuarios · {stats.totalProviders} proveedores · {stats.activeServices} servicios activos
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 bg-white h-full shadow-2xl z-10">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 p-1">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-200 shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      <main className="flex-1 min-w-0">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg bg-[#1B2A47] text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm font-semibold text-[#1B2A47]">
              {adminNavItems.find((item) => item.id === activeSection)?.label}
            </p>
            <p className="text-xs text-gray-500">{currentUser.name}</p>
          </div>
        </div>

        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8" style={{ color: '#D4AF37' }} />
              <h1 className="text-3xl text-[#1B2A47]">Panel de Administración</h1>
            </div>
            <p className="text-gray-600">Gestiona y modera el marketplace de Memorialo</p>
          </div>

          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1B2A47] mb-1">Resumen</h2>
                <p className="text-gray-500 text-sm">Vista general del ecosistema y métricas principales</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Usuarios Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl">{stats.totalUsers}</div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Proveedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl">{stats.totalProviders}</div>
                <div className="text-xs text-gray-600">
                  {stats.verifiedProviders} verificados
                </div>
              </div>
              <Briefcase className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-2 border-[#D4AF37] bg-gradient-to-br from-amber-50 via-white to-yellow-50 shadow-sm cursor-pointer transition hover:shadow-md"
          onClick={() => handleNavClick('interested')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[#1B2A47]">Usuarios Interesados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-3xl font-bold text-[#1B2A47]">{loadingInterestedUsers ? '…' : interestedUsersCount}</div>
                <div className="text-xs font-medium text-amber-700">
                  Leads captados para el lanzamiento
                </div>
              </div>
              <div className="rounded-full bg-[#D4AF37]/15 p-3">
                <FileText className="h-8 w-8 text-[#D4AF37]" />
              </div>
            </div>
            <div className="mt-3 text-xs font-semibold text-[#1B2A47]">Ver lista completa →</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Contratos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl">{stats.activeContracts}</div>
                <div className="text-xs text-gray-600">
                  {stats.totalContracts} totales
                </div>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Rating Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl">{stats.avgRating.toFixed(1)}</div>
                <div className="text-xs text-gray-600">
                  {reviews.length} reseñas
                </div>
              </div>
              <Star className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl mb-1">{stats.activeServices}</div>
            <div className="text-xs text-gray-600">{stats.totalServices} totales</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Reservas Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl mb-1">{stats.completedBookings}</div>
            <div className="text-xs text-gray-600">{stats.totalBookings} totales</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Proveedores Baneados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl mb-1 text-red-600">{stats.bannedProviders}</div>
            <div className="text-xs text-gray-600">Requieren atención</div>
          </CardContent>
        </Card>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <Card className="xl:col-span-2">
                  <CardHeader>
                    <CardTitle>Estado del Marketplace</CardTitle>
                    <CardDescription>Indicadores principales para seguimiento operativo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-gray-200 p-4 bg-white">
                        <p className="text-sm text-gray-500 mb-1">Contratos activos</p>
                        <p className="text-2xl font-semibold text-[#1B2A47]">{stats.activeContracts}</p>
                        <p className="text-xs text-gray-500">{stats.totalContracts} contratos totales</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-4 bg-white">
                        <p className="text-sm text-gray-500 mb-1">Reservas completadas</p>
                        <p className="text-2xl font-semibold text-[#1B2A47]">{stats.completedBookings}</p>
                        <p className="text-xs text-gray-500">{stats.totalBookings} reservas totales</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-4 bg-white">
                        <p className="text-sm text-gray-500 mb-1">Promedio de reputación</p>
                        <p className="text-2xl font-semibold text-[#1B2A47]">{stats.avgRating.toFixed(1)}</p>
                        <p className="text-xs text-gray-500">{reviews.length} reseñas registradas</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-4 bg-white">
                        <p className="text-sm text-gray-500 mb-1">Proveedores baneados</p>
                        <p className="text-2xl font-semibold text-red-600">{stats.bannedProviders}</p>
                        <p className="text-xs text-gray-500">Requieren seguimiento administrativo</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Acciones sugeridas</CardTitle>
                    <CardDescription>Puntos de control inmediatos del panel</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-gray-600">
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="font-medium text-[#1B2A47]">Proveedores pendientes</p>
                      <p>{providers.filter((provider) => !provider.verified && !provider.banned).length} sin verificar</p>
                    </div>
                    <div className="rounded-lg border border-[#D4AF37]/40 bg-amber-50 p-3">
                      <p className="font-medium text-[#1B2A47]">Usuarios interesados en Memorialo</p>
                      <p>{loadingInterestedUsers ? 'Cargando…' : `${interestedUsersCount} lead${interestedUsersCount === 1 ? '' : 's'} registrado${interestedUsersCount === 1 ? '' : 's'}`}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="font-medium text-[#1B2A47]">Usuarios con solicitud</p>
                      <p>{users.filter((user) => user.providerRequestStatus === 'pending').length} esperando aprobación</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="font-medium text-[#1B2A47]">Servicios publicados</p>
                      <p>{stats.activeServices} activos sobre {stats.totalServices} cargados</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeSection === 'providers' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-[#1B2A47] mb-1">Proveedores</h2>
                <p className="text-gray-500 text-sm">Verifica y modera los proveedores del marketplace</p>
              </div>

          <Card>
            <CardHeader>
              <CardTitle>Gestión de Proveedores</CardTitle>
              <CardDescription>
                Verifica y modera los proveedores del marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre o categoría..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="verified">Verificados</SelectItem>
                    <SelectItem value="unverified">No Verificados</SelectItem>
                    <SelectItem value="banned">Baneados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Providers Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Negocio</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Servicios</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProviders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No se encontraron proveedores
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleFilteredProviders.map((provider) => {
                        const providerUser = getProviderUser(provider);
                        const services = getProviderServices(provider.id);
                        return (
                          <TableRow key={provider.id}>
                            <TableCell>
                              <div>
                                <div>{provider.businessName}</div>
                                <div className="text-xs text-gray-500">
                                  ID: {provider.id.slice(0, 8)}...
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{provider.category}</TableCell>
                            <TableCell>
                              <div>
                                <div className="text-sm">{providerUser?.name || 'N/A'}</div>
                                <div className="text-xs text-gray-500">{providerUser?.email || 'N/A'}</div>
                              </div>
                            </TableCell>
                            <TableCell>{services.length}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-current text-yellow-500" />
                                <span>{provider.rating.toFixed(1)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {provider.banned ? (
                                  <Badge variant="destructive" className="w-fit">
                                    <Ban className="h-3 w-3 mr-1" />
                                    Baneado
                                  </Badge>
                                ) : provider.verified ? (
                                  <Badge variant="default" className="w-fit bg-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verificado
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="w-fit">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    No Verificado
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {provider.banned ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      openConfirmModal({
                                        title: 'Desbanear proveedor',
                                        description: `¿Deseas desbanear a ${provider.businessName}? Recuperará el acceso a la plataforma.`,
                                        confirmText: 'Desbanear',
                                        variant: 'warning',
                                        onConfirm: async () => {
                                          await handleUnbanProvider(provider.id);
                                        },
                                      })
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Desbanear
                                  </Button>
                                ) : (
                                  <>
                                    {!provider.verified && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          openConfirmModal({
                                            title: 'Verificar proveedor',
                                            description: `¿Confirmas que deseas verificar a ${provider.businessName}?`,
                                            confirmText: 'Verificar',
                                            variant: 'info',
                                            onConfirm: async () => {
                                              await handleVerifyProvider(provider.id);
                                            },
                                          })
                                        }
                                        style={{ borderColor: '#D4AF37', color: '#D4AF37' }}
                                      >
                                        <ShieldCheck className="h-4 w-4 mr-1" />
                                        Verificar
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => openBanDialog(provider)}
                                    >
                                      <Ban className="h-4 w-4 mr-1" />
                                      Banear
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              {visibleFilteredProviders.length < filteredProviders.length && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleProvidersCount((prev) => Math.min(prev + ADMIN_TABLE_BATCH_SIZE, filteredProviders.length))}
                  >
                    Cargar más proveedores ({visibleFilteredProviders.length}/{filteredProviders.length})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
            </div>
          )}

          {activeSection === 'billing' && (
            <AdminBillingSection accessToken={accessToken} />
          )}

          {activeSection === 'banners' && (
            <AdminBannersSection
              accessToken={accessToken}
              bannersSectionEnabled={bannersSectionEnabled}
              onToggleBannersSection={onToggleBannersSection}
            />
          )}

          {activeSection === 'main-content' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-[#1B2A47] mb-1">Contenido principal</h2>
                <p className="text-gray-500 text-sm">Edita el CTA principal del home: acentuación, textos y botones.</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Configuración del CTA principal</CardTitle>
                  <CardDescription>Define el contenido informativo y los enlaces de acción.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="main-content-accent">Acentuación (h2)</Label>
                    <Input
                      id="main-content-accent"
                      value={mainContentAccentDraft}
                      maxLength={120}
                      onChange={(event) => setMainContentAccentDraft(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="main-content-title">Título (p)</Label>
                    <Input
                      id="main-content-title"
                      value={mainContentTitleDraft}
                      maxLength={180}
                      onChange={(event) => setMainContentTitleDraft(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="main-content-subtitle">Subtítulo (p)</Label>
                    <Textarea
                      id="main-content-subtitle"
                      value={mainContentSubtitleDraft}
                      maxLength={320}
                      onChange={(event) => setMainContentSubtitleDraft(event.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="main-content-primary-button-text">Botón principal (texto)</Label>
                      <Input
                        id="main-content-primary-button-text"
                        value={mainContentPrimaryButtonTextDraft}
                        maxLength={80}
                        onChange={(event) => setMainContentPrimaryButtonTextDraft(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="main-content-primary-button-link">Botón principal (link)</Label>
                      <Input
                        id="main-content-primary-button-link"
                        value={mainContentPrimaryButtonLinkDraft}
                        maxLength={255}
                        onChange={(event) => setMainContentPrimaryButtonLinkDraft(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="main-content-secondary-button-text">Botón secundario (texto)</Label>
                      <Input
                        id="main-content-secondary-button-text"
                        value={mainContentSecondaryButtonTextDraft}
                        maxLength={80}
                        onChange={(event) => setMainContentSecondaryButtonTextDraft(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="main-content-secondary-button-link">Botón secundario (link)</Label>
                      <Input
                        id="main-content-secondary-button-link"
                        value={mainContentSecondaryButtonLinkDraft}
                        maxLength={255}
                        onChange={(event) => setMainContentSecondaryButtonLinkDraft(event.target.value)}
                      />
                    </div>
                  </div>

                  {/* Background configuration */}
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-sm font-semibold">Fondo de la sección</Label>
                    <div className="flex gap-3 flex-wrap">
                      {(
                        [
                          { value: 'gradient', label: 'Degradado' },
                          { value: 'solid', label: 'Color sólido' },
                          { value: 'image', label: 'Imagen' },
                        ] as { value: 'gradient' | 'solid' | 'image'; label: string }[]
                      ).map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setMainContentBgTypeDraft(option.value)}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                            mainContentBgTypeDraft === option.value
                              ? 'bg-[#1B2A47] text-white border-[#1B2A47]'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {mainContentBgTypeDraft === 'gradient' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="main-content-bg-gradient">CSS de degradado</Label>
                        <Input
                          id="main-content-bg-gradient"
                          value={mainContentBgGradientDraft}
                          maxLength={500}
                          placeholder="linear-gradient(135deg, #0A1F44 0%, #B8860B 100%)"
                          onChange={(event) => setMainContentBgGradientDraft(event.target.value)}
                        />
                        <p className="text-xs text-gray-500">Usa sintaxis CSS válida para <code>background</code>, ej.: <code>linear-gradient(135deg, #0A1F44 0%, #B8860B 100%)</code></p>
                        {mainContentBgGradientDraft.trim() && (
                          <div
                            className="h-10 rounded-lg border border-gray-200"
                            style={{ background: mainContentBgGradientDraft.trim() }}
                          />
                        )}
                      </div>
                    )}

                    {mainContentBgTypeDraft === 'solid' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="main-content-bg-color">Color de fondo</Label>
                        <div className="flex items-center gap-3">
                          <input
                            id="main-content-bg-color"
                            type="color"
                            value={mainContentBgColorDraft.startsWith('#') ? mainContentBgColorDraft : '#0A1F44'}
                            onChange={(event) => setMainContentBgColorDraft(event.target.value)}
                            className="h-10 w-16 cursor-pointer rounded border border-gray-300 p-0.5"
                          />
                          <Input
                            value={mainContentBgColorDraft}
                            maxLength={50}
                            placeholder="#0A1F44"
                            onChange={(event) => setMainContentBgColorDraft(event.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    )}

                    {mainContentBgTypeDraft === 'image' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="main-content-bg-image-url">URL de imagen de fondo</Label>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => mainContentBgFileInputRef.current?.click()}
                            disabled={uploadingMainContentBgImage}
                          >
                            {uploadingMainContentBgImage ? (
                              <>
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                Subiendo...
                              </>
                            ) : (
                              <>
                                <ImagePlus className="mr-1 h-4 w-4" />
                                Subir imagen
                              </>
                            )}
                          </Button>
                          <input
                            ref={mainContentBgFileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            aria-label="Seleccionar imagen de fondo"
                            onChange={handleMainContentBgImageFileChange}
                          />
                        </div>
                        <Input
                          id="main-content-bg-image-url"
                          value={mainContentBgImageUrlDraft}
                          maxLength={1000}
                          placeholder="https://example.com/imagen.jpg"
                          onChange={(event) => setMainContentBgImageUrlDraft(event.target.value)}
                        />
                        <p className="text-xs text-gray-500">Usa una imagen de alta resolución (mínimo 1200×400 px). La imagen se ajustará a la sección.</p>
                        {mainContentBgImageUrlDraft.trim() && /^https?:\/\//i.test(mainContentBgImageUrlDraft.trim()) && (
                          <div
                            className="h-20 rounded-lg border border-gray-200 bg-gray-100"
                            style={{ backgroundImage: `url(${mainContentBgImageUrlDraft.trim()})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleSaveMainContent}
                      disabled={savingMainContent || !hasMainContentChanges}
                    >
                      {savingMainContent ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Guardar contenido principal
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configuración del CTA secundario</CardTitle>
                  <CardDescription>Banner inferior del home para invitar a proveedores. Habilítalo y define su contenido.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="secondary-cta-toggle"
                      checked={secondaryCtaEnabledDraft}
                      onCheckedChange={setSecondaryCtaEnabledDraft}
                    />
                    <Label htmlFor="secondary-cta-toggle" className="cursor-pointer">
                      {secondaryCtaEnabledDraft ? 'Sección habilitada' : 'Sección deshabilitada'}
                    </Label>
                  </div>

                  {/* Accent */}
                  <div className="space-y-1.5">
                    <Label htmlFor="secondary-cta-accent">Acentuación (badge superior, opcional)</Label>
                    <Input
                      id="secondary-cta-accent"
                      value={secondaryCtaAccentDraft}
                      maxLength={120}
                      placeholder="Ej.: ¡Únete ahora!"
                      onChange={(event) => setSecondaryCtaAccentDraft(event.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="secondary-cta-title">Título</Label>
                    <Input
                      id="secondary-cta-title"
                      value={secondaryCtaTitleDraft}
                      maxLength={180}
                      onChange={(event) => setSecondaryCtaTitleDraft(event.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="secondary-cta-subtitle">Subtítulo</Label>
                    <Textarea
                      id="secondary-cta-subtitle"
                      value={secondaryCtaSubtitleDraft}
                      maxLength={320}
                      onChange={(event) => setSecondaryCtaSubtitleDraft(event.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="secondary-cta-button-text">Botón (texto)</Label>
                      <Input
                        id="secondary-cta-button-text"
                        value={secondaryCtaButtonTextDraft}
                        maxLength={80}
                        onChange={(event) => setSecondaryCtaButtonTextDraft(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="secondary-cta-button-link">Botón (link)</Label>
                      <Input
                        id="secondary-cta-button-link"
                        value={secondaryCtaButtonLinkDraft}
                        maxLength={255}
                        onChange={(event) => setSecondaryCtaButtonLinkDraft(event.target.value)}
                      />
                    </div>
                  </div>

                  {/* Background configuration */}
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-sm font-semibold">Fondo de la sección</Label>
                    <div className="flex gap-3 flex-wrap">
                      {(
                        [
                          { value: 'gradient', label: 'Degradado' },
                          { value: 'solid', label: 'Color sólido' },
                          { value: 'image', label: 'Imagen' },
                        ] as { value: 'gradient' | 'solid' | 'image'; label: string }[]
                      ).map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSecondaryCtaBgTypeDraft(option.value)}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                            secondaryCtaBgTypeDraft === option.value
                              ? 'bg-[#1B2A47] text-white border-[#1B2A47]'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {secondaryCtaBgTypeDraft === 'gradient' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="secondary-cta-bg-gradient">CSS de degradado</Label>
                        <Input
                          id="secondary-cta-bg-gradient"
                          value={secondaryCtaBgGradientDraft}
                          maxLength={500}
                          placeholder="linear-gradient(135deg, #F7B267 0%, #F4A261 100%)"
                          onChange={(event) => setSecondaryCtaBgGradientDraft(event.target.value)}
                        />
                        <p className="text-xs text-gray-500">Usa sintaxis CSS válida para <code>background</code>, ej.: <code>linear-gradient(135deg, #F7B267 0%, #F4A261 100%)</code></p>
                        {secondaryCtaBgGradientDraft.trim() && (
                          <div
                            className="h-10 rounded-lg border border-gray-200"
                            style={{ background: secondaryCtaBgGradientDraft.trim() }}
                          />
                        )}
                      </div>
                    )}

                    {secondaryCtaBgTypeDraft === 'solid' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="secondary-cta-bg-color">Color de fondo</Label>
                        <div className="flex items-center gap-3">
                          <input
                            id="secondary-cta-bg-color"
                            type="color"
                            value={secondaryCtaBgColorDraft.startsWith('#') ? secondaryCtaBgColorDraft : '#F7B267'}
                            onChange={(event) => setSecondaryCtaBgColorDraft(event.target.value)}
                            className="h-10 w-16 cursor-pointer rounded border border-gray-300 p-0.5"
                          />
                          <Input
                            value={secondaryCtaBgColorDraft}
                            maxLength={50}
                            placeholder="#F7B267"
                            onChange={(event) => setSecondaryCtaBgColorDraft(event.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    )}

                    {secondaryCtaBgTypeDraft === 'image' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="secondary-cta-bg-image-url">URL de imagen de fondo</Label>
                        <Input
                          id="secondary-cta-bg-image-url"
                          value={secondaryCtaBgImageUrlDraft}
                          maxLength={1000}
                          placeholder="https://example.com/imagen.jpg"
                          onChange={(event) => setSecondaryCtaBgImageUrlDraft(event.target.value)}
                        />
                        <p className="text-xs text-gray-500">Usa una imagen de alta resolución. La imagen se ajustará a la sección.</p>
                        {secondaryCtaBgImageUrlDraft.trim() && /^https?:\/\//i.test(secondaryCtaBgImageUrlDraft.trim()) && (
                          <div
                            className="h-20 rounded-lg border border-gray-200 bg-gray-100"
                            style={{ backgroundImage: `url(${secondaryCtaBgImageUrlDraft.trim()})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Button color */}
                  <div className="space-y-1.5">
                    <Label>Color del botón</Label>
                    <div className="flex gap-3">
                      {(
                        [
                          { value: 'blue', label: 'Azul (texto blanco)' },
                          { value: 'yellow', label: 'Amarillo (texto azul)' },
                        ] as { value: 'blue' | 'yellow'; label: string }[]
                      ).map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSecondaryCtaButtonColorDraft(option.value)}
                          style={
                            secondaryCtaButtonColorDraft === option.value
                              ? option.value === 'yellow'
                                ? { backgroundColor: '#d4af37', color: '#0a1f44', borderColor: '#d4af37' }
                                : { backgroundColor: '#0a1f44', color: '#ffffff', borderColor: '#0a1f44' }
                              : {}
                          }
                          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                            secondaryCtaButtonColorDraft === option.value
                              ? ''
                              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleSaveMainContent}
                      disabled={savingMainContent || !hasMainContentChanges}
                    >
                      {savingMainContent ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Guardar CTA secundario
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Secciones de colecciones ({homeCollSections.length})</CardTitle>
                    <CardDescription>Gestiona las secciones de colecciones visibles en el Home, entre los pasos y el CTA secundario.</CardDescription>
                  </div>
                  <Button type="button" size="sm" onClick={openCreateHomeCollSectionForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar sección
                  </Button>
                </CardHeader>
                <CardContent>
                  {homeCollSections.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay secciones de colecciones configuradas.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Colección</TableHead>
                            <TableHead>Orden</TableHead>
                            <TableHead>Visible</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...homeCollSections].sort((a, b) => a.sortOrder - b.sortOrder).map((section) => {
                            const linkedCollection = collections.find((c) => c.id === section.collectionId);
                            return (
                              <TableRow key={section.id}>
                                <TableCell>
                                  <p className="font-medium text-[#1B2A47]">{section.title}</p>
                                  {section.subtitle ? (
                                    <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{section.subtitle}</p>
                                  ) : null}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  {linkedCollection?.title || section.collectionId}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">{section.sortOrder}</TableCell>
                                <TableCell>
                                  <Badge variant={section.visible ? 'default' : 'secondary'}>
                                    {section.visible ? 'Visible' : 'Oculto'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openEditHomeCollSectionForm(section)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteHomeCollSection(section.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {showHomeCollSectionForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>{editingHomeCollSectionId ? 'Editar sección' : 'Nueva sección de colección'}</CardTitle>
                    <CardDescription>Configura el título, colección asociada, orden y visibilidad.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="hcs-title">Título</Label>
                      <Input
                        id="hcs-title"
                        value={homeCollSectionTitleDraft}
                        maxLength={160}
                        onChange={(event) => setHomeCollSectionTitleDraft(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="hcs-subtitle">Subtítulo</Label>
                      <Input
                        id="hcs-subtitle"
                        value={homeCollSectionSubtitleDraft}
                        maxLength={320}
                        onChange={(event) => setHomeCollSectionSubtitleDraft(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="hcs-collection">Colección asociada</Label>
                      <Select value={homeCollSectionCollectionIdDraft} onValueChange={setHomeCollSectionCollectionIdDraft}>
                        <SelectTrigger id="hcs-collection">
                          <SelectValue placeholder="Selecciona una colección" />
                        </SelectTrigger>
                        <SelectContent>
                          {collections.map((col) => (
                            <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="hcs-sort-order">Orden</Label>
                      <Input
                        id="hcs-sort-order"
                        type="number"
                        min={0}
                        max={9999}
                        value={homeCollSectionSortOrderDraft}
                        onChange={(event) => setHomeCollSectionSortOrderDraft(Number(event.target.value))}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        id="hcs-visible"
                        checked={homeCollSectionVisibleDraft}
                        onCheckedChange={setHomeCollSectionVisibleDraft}
                      />
                      <Label htmlFor="hcs-visible" className="cursor-pointer">
                        {homeCollSectionVisibleDraft ? 'Visible en el Home' : 'Oculto'}
                      </Label>
                    </div>
                    <div className="flex items-center gap-3 justify-end">
                      <Button type="button" variant="outline" onClick={closeHomeCollSectionForm}>
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSaveHomeCollSection}
                        disabled={savingHomeCollSection || !homeCollSectionTitleDraft.trim() || !homeCollSectionCollectionIdDraft}
                      >
                        {savingHomeCollSection ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            {editingHomeCollSectionId ? 'Guardar cambios' : 'Crear sección'}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeSection === 'relevant-services' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-[#1B2A47] mb-1">Servicios relevantes</h2>
                <p className="text-gray-500 text-sm">Gestiona la sección destacada del Home con título, subtítulo y servicios visibles.</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Configuración de la sección</CardTitle>
                  <CardDescription>Habilita o deshabilita el carrusel y define el encabezado del bloque.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="relevant-services-toggle"
                      checked={relevantSectionEnabledDraft}
                      onCheckedChange={setRelevantSectionEnabledDraft}
                    />
                    <Label htmlFor="relevant-services-toggle" className="cursor-pointer">
                      {relevantSectionEnabledDraft ? 'Sección habilitada' : 'Sección deshabilitada'}
                    </Label>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="relevant-services-title">Título</Label>
                    <Input
                      id="relevant-services-title"
                      value={relevantTitleDraft}
                      maxLength={120}
                      onChange={(event) => setRelevantTitleDraft(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="relevant-services-subtitle">Subtítulo</Label>
                    <Input
                      id="relevant-services-subtitle"
                      value={relevantSubtitleDraft}
                      maxLength={220}
                      onChange={(event) => setRelevantSubtitleDraft(event.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Servicios a mostrar</CardTitle>
                  <CardDescription>Selecciona los servicios que aparecerán en el carrusel del Home.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar servicio, categoría o proveedor..."
                      value={relevantServiceSearchQuery}
                      onChange={(event) => setRelevantServiceSearchQuery(event.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="max-h-80 overflow-y-auto rounded-xl border border-gray-200 p-3 space-y-2">
                    {filteredRelevantServices.length === 0 ? (
                      <p className="text-sm text-gray-500">No se encontraron servicios para el filtro aplicado.</p>
                    ) : (
                      filteredRelevantServices.map((service) => {
                        const provider = providers.find((candidate) => candidate.userId === service.userId);
                        const serviceId = String(service.id);
                        const isSelected = selectedRelevantServiceIds.includes(serviceId);

                        return (
                          <button
                            key={serviceId}
                            type="button"
                            onClick={() => toggleRelevantService(serviceId)}
                            className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                              isSelected
                                ? 'border-[#D4AF37] bg-amber-50'
                                : 'border-gray-200 bg-white hover:border-[#D4AF37]/50'
                            }`}
                          >
                            <p className="text-sm font-medium text-[#1B2A47]">{service.name}</p>
                            <p className="text-xs text-gray-500">
                              {provider?.businessName || 'Proveedor sin nombre'} · {service.location || 'Sin ciudad'}
                            </p>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <p className="text-xs text-gray-500">
                      Seleccionados: {selectedRelevantServiceIds.length}
                    </p>
                    <Button
                      type="button"
                      onClick={handleSaveRelevantServices}
                      disabled={savingRelevantServices || !hasRelevantServicesChanges}
                    >
                      {savingRelevantServices ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Guardar servicios relevantes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'collections' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-[#1B2A47] mb-1">Colecciones</h2>
                <p className="text-gray-500 text-sm">Crea páginas SEO en /coleccion/tu-slug agrupando servicios seleccionados.</p>
              </div>

              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Colecciones creadas ({collections.length})</CardTitle>
                    <CardDescription>Edita o elimina agrupaciones ya publicadas.</CardDescription>
                  </div>
                  <Button type="button" size="sm" onClick={openCreateCollectionForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear colección
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {collections.length === 0 ? (
                    <p className="text-sm text-gray-500">Aún no hay colecciones creadas.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Servicios</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {collections.map((collection) => (
                            <TableRow key={collection.id}>
                              <TableCell className="min-w-[220px]">
                                <p className="font-medium text-[#1B2A47]">{collection.title}</p>
                                {collection.subtitle ? (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{collection.subtitle}</p>
                                ) : (
                                  <p className="text-xs text-gray-400 mt-1">Sin subtítulo</p>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-gray-500 break-all">/coleccion/{collection.slug}</TableCell>
                              <TableCell className="text-xs text-gray-500">
                                {collection.serviceIds.length} servicio{collection.serviceIds.length === 1 ? '' : 's'}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  <Button type="button" variant="outline" size="sm" onClick={() => handleEditCollection(collection)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </Button>
                                  <Button type="button" variant="destructive" size="sm" onClick={() => handleDeleteCollection(collection)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {showCollectionForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>{editingCollectionId ? 'Editar colección' : 'Nueva colección'}</CardTitle>
                    <CardDescription>Define el título, subtítulo, slug y los servicios que formarán parte de la colección.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="collection-title">Título</Label>
                        <Input
                          id="collection-title"
                          value={collectionTitleDraft}
                          maxLength={160}
                          onChange={(event) => setCollectionTitleDraft(event.target.value)}
                          placeholder="Servicios para bodas 2026"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="collection-slug">Slug</Label>
                        <Input
                          id="collection-slug"
                          value={collectionSlugDraft}
                          maxLength={180}
                          onChange={(event) => setCollectionSlugDraft(slugify(event.target.value))}
                          placeholder="servicios-para-bodas-2026"
                        />
                        <p className="text-xs text-gray-500">URL pública: /coleccion/{slugify(collectionSlugDraft || collectionTitleDraft) || 'tu-slug'}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="collection-subtitle">Subtítulo</Label>
                      <Textarea
                        id="collection-subtitle"
                        value={collectionSubtitleDraft}
                        maxLength={320}
                        onChange={(event) => setCollectionSubtitleDraft(event.target.value)}
                        placeholder="Agrupa publicaciones ideales para esta intención de búsqueda."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-4 rounded-xl border border-gray-200 p-4">
                      <div>
                        <h3 className="text-base font-semibold text-[#1B2A47]">Servicios de la colección</h3>
                        <p className="text-sm text-gray-500">Busca y selecciona servicios con checkboxes para agregarlos a la colección.</p>
                      </div>

                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Buscar servicio, categoría o proveedor..."
                          value={collectionServiceSearchQuery}
                          onChange={(event) => setCollectionServiceSearchQuery(event.target.value)}
                          className="pl-10"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-gray-500">
                          Mostrando {filteredCollectionServices.length} servicio{filteredCollectionServices.length === 1 ? '' : 's'} · Seleccionados {selectedCollectionServiceIds.length}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={selectAllFilteredCollectionServices} disabled={filteredCollectionServices.length === 0}>
                            Seleccionar filtrados
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={clearFilteredCollectionServices} disabled={selectedFilteredCollectionServicesCount === 0}>
                            Quitar filtrados
                          </Button>
                        </div>
                      </div>

                      <div className="max-h-80 overflow-y-auto rounded-xl border border-gray-200">
                        {filteredCollectionServices.length === 0 ? (
                          <p className="text-sm text-gray-500 p-4">No se encontraron servicios para el filtro aplicado.</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-14 text-center">Sel.</TableHead>
                                <TableHead>Servicio</TableHead>
                                <TableHead>Proveedor</TableHead>
                                <TableHead>Categoría</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredCollectionServices.map((service) => {
                                const provider = providers.find((candidate) => candidate.userId === service.userId);
                                const serviceId = String(service.id);
                                const isSelected = selectedCollectionServiceIds.includes(serviceId);

                                return (
                                  <TableRow key={serviceId} className={isSelected ? 'bg-amber-50/60' : ''}>
                                    <TableCell className="text-center">
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => toggleCollectionService(serviceId)}
                                        aria-label={`Seleccionar ${service.name}`}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <p className="text-sm font-medium text-[#1B2A47]">{service.name}</p>
                                      <p className="text-xs text-gray-500">{service.location || 'Sin ciudad'}</p>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">{provider?.businessName || 'Proveedor sin nombre'}</TableCell>
                                    <TableCell className="text-sm text-gray-600">{service.category || service.subcategory || 'Sin categoría'}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <p className="text-xs text-gray-500">
                        Servicios seleccionados: {selectedCollectionServiceIds.length}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={closeCollectionForm}>
                          {editingCollectionId ? 'Cancelar edición' : 'Cancelar'}
                        </Button>
                        <Button
                          type="button"
                          onClick={handleSaveCollection}
                          disabled={savingCollection || !hasCollectionChanges}
                        >
                          {savingCollection ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              {editingCollectionId ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                              {editingCollectionId ? 'Guardar colección' : 'Crear colección'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeSection === 'search-terms' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-[#1B2A47] mb-1">Términos de búsqueda</h2>
                <p className="text-gray-500 text-sm">Consulta tendencias mensuales y gestiona términos sugeridos manualmente.</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Nuevo término</CardTitle>
                  <CardDescription>Crea o edita términos para inducir sugerencias de búsqueda.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <Input
                      placeholder="Ej: Mariachi"
                      value={searchTermDraft}
                      onChange={(event) => setSearchTermDraft(event.target.value)}
                    />
                    <Input
                      type="month"
                      value={searchTermMonthDraft}
                      onChange={(event) => setSearchTermMonthDraft(event.target.value)}
                    />
                    <Input
                      type="number"
                      min={0}
                      value={searchTermCountDraft}
                      onChange={(event) => setSearchTermCountDraft(event.target.value)}
                    />
                    <div className="flex items-center justify-between rounded-md border px-3">
                      <Label htmlFor="search-term-manual">Manual</Label>
                      <Switch
                        id="search-term-manual"
                        checked={searchTermIsManualDraft}
                        onCheckedChange={(checked) => setSearchTermIsManualDraft(Boolean(checked))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={handleSaveSearchTerm} disabled={savingSearchTerm}>
                      {savingSearchTerm ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          {editingSearchTermId ? 'Actualizar término' : 'Crear término'}
                        </>
                      )}
                    </Button>
                    {editingSearchTermId && (
                      <Button type="button" variant="outline" onClick={resetSearchTermForm}>
                        Cancelar edición
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top términos</CardTitle>
                  <CardDescription>Filtra por mes y frecuencia para revisar oportunidades de mercado.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <Input
                      type="month"
                      value={searchTermsMonthFilter}
                      onChange={(event) => setSearchTermsMonthFilter(event.target.value)}
                    />
                    <Input
                      type="number"
                      min={0}
                      placeholder="Frecuencia mínima"
                      value={searchTermsMinCountFilter}
                      onChange={(event) => setSearchTermsMinCountFilter(event.target.value)}
                    />
                    <Select value={searchTermsSort} onValueChange={(value: 'frequency_desc' | 'frequency_asc' | 'recent') => setSearchTermsSort(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Orden" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="frequency_desc">Frecuencia: mayor a menor</SelectItem>
                        <SelectItem value="frequency_asc">Frecuencia: menor a mayor</SelectItem>
                        <SelectItem value="recent">Mes más reciente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Término</TableHead>
                          <TableHead>Mes</TableHead>
                          <TableHead>Frecuencia</TableHead>
                          <TableHead>Origen</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingSearchTerms ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-sm text-gray-500 py-6">Cargando términos...</TableCell>
                          </TableRow>
                        ) : searchTerms.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-sm text-gray-500 py-6">No hay términos para los filtros seleccionados.</TableCell>
                          </TableRow>
                        ) : (
                          searchTerms.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.term}</TableCell>
                              <TableCell>{item.month}</TableCell>
                              <TableCell>{item.searchCount}</TableCell>
                              <TableCell>{item.isManual ? 'Manual' : 'Automático'}</TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  <Button type="button" variant="outline" size="sm" onClick={() => handleEditSearchTerm(item)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </Button>
                                  <Button type="button" variant="destructive" size="sm" onClick={() => handleDeleteSearchTerm(item)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'interested' && (
            <AdminInterestedProvidersSection accessToken={accessToken} />
          )}

          {activeSection === 'users' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-[#1B2A47] mb-1">Usuarios</h2>
                <p className="text-gray-500 text-sm">Vista general y acciones administrativas sobre usuarios</p>
              </div>

          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>
                Vista general de todos los usuarios de la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <div className="flex flex-col lg:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nombre, email, teléfono, tipo o estado..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={userAccessFilter} onValueChange={(value: 'all' | 'pending' | 'approved' | 'rejected' | 'none') => setUserAccessFilter(value)}>
                    <SelectTrigger className="w-full lg:w-[250px]">
                      <SelectValue placeholder="Acceso proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Acceso proveedor: todos</SelectItem>
                      <SelectItem value="pending">Solicitud pendiente</SelectItem>
                      <SelectItem value="approved">Aprobado</SelectItem>
                      <SelectItem value="rejected">Rechazado</SelectItem>
                      <SelectItem value="none">Sin solicitud</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={userTypeFilter} onValueChange={(value: 'all' | 'admin' | 'provider' | 'client') => setUserTypeFilter(value)}>
                    <SelectTrigger className="w-full lg:w-[210px]">
                      <SelectValue placeholder="Tipo de usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tipo: todos</SelectItem>
                      <SelectItem value="client">Clientes</SelectItem>
                      <SelectItem value="provider">Proveedores</SelectItem>
                      <SelectItem value="admin">Administradores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={userAccessFilter === 'pending' ? 'default' : 'outline'}
                    onClick={() => setUserAccessFilter('pending')}
                    className={userAccessFilter === 'pending' ? 'bg-[#1B2A47] text-white' : ''}
                  >
                    Solicitudes pendientes ({pendingProviderRequestCount})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setUserSearchQuery('');
                      setUserAccessFilter('all');
                      setUserTypeFilter('all');
                    }}
                  >
                    Limpiar filtros
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Acceso Proveedor</TableHead>
                      <TableHead>Fecha de Registro</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No se encontraron usuarios con los filtros aplicados
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleFilteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              <div>Tel: {user.phone || 'No registrado'}</div>
                              <div>WhatsApp: {user.whatsappNumber || 'No registrado'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.role === 'admin' ? (
                              <Badge style={{ backgroundColor: '#D4AF37' }}>
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            ) : user.isProvider ? (
                              <Badge variant="secondary">
                                <Briefcase className="h-3 w-3 mr-1" />
                                Proveedor
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <Users className="h-3 w-3 mr-1" />
                                Cliente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.isProvider ? (
                              <Badge className="bg-green-600">Aprobado</Badge>
                            ) : user.providerRequestStatus === 'pending' ? (
                              <Badge variant="secondary">Pendiente</Badge>
                            ) : user.providerRequestStatus === 'rejected' ? (
                              <Badge variant="destructive">Rechazado</Badge>
                            ) : (
                              <Badge variant="outline">Sin solicitud</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString('es-VE')}
                          </TableCell>
                          <TableCell>
                            {user.banned ? (
                              <Badge variant="destructive">Baneado</Badge>
                            ) : user.archived ? (
                              <Badge variant="secondary">Archivado</Badge>
                            ) : (
                              <Badge variant="default" className="bg-green-600">Activo</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.role !== 'admin' && (
                              <div className="flex gap-2 flex-wrap">
                                {user.banned ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      openConfirmModal({
                                        title: 'Desbanear usuario',
                                        description: `¿Deseas desbanear a ${user.name}? Recuperará el acceso a la plataforma.`,
                                        confirmText: 'Desbanear',
                                        variant: 'warning',
                                        onConfirm: async () => {
                                          try {
                                            await onUnbanUser(user.id);
                                            toast.success('Usuario desbaneado');
                                          } catch (error) {
                                            toast.error('Error al desbanear');
                                          }
                                        },
                                      })
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Desbanear
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUserId(user.id);
                                      setBanType('user');
                                      setShowBanDialog(true);
                                    }}
                                  >
                                    <Ban className="h-4 w-4 mr-1" />
                                    Banear
                                  </Button>
                                )}
                                
                                {user.archived ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      openConfirmModal({
                                        title: 'Restaurar usuario',
                                        description: `¿Deseas restaurar a ${user.name}?`,
                                        confirmText: 'Restaurar',
                                        variant: 'info',
                                        onConfirm: async () => {
                                          try {
                                            await onUnarchiveUser(user.id);
                                            toast.success('Usuario restaurado');
                                          } catch (error) {
                                            toast.error('Error al restaurar');
                                          }
                                        },
                                      })
                                    }
                                  >
                                    Restaurar
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      openConfirmModal({
                                        title: 'Archivar usuario',
                                        description: `¿Archivar a ${user.name}? Sus servicios se ocultarán pero los datos se mantendrán.`,
                                        confirmText: 'Archivar',
                                        variant: 'warning',
                                        onConfirm: async () => {
                                          try {
                                            await onArchiveUser(user.id);
                                            toast.success('Usuario archivado');
                                          } catch (error) {
                                            toast.error('Error al archivar');
                                          }
                                        },
                                      })
                                    }
                                  >
                                    Archivar
                                  </Button>
                                )}

                                {user.isProvider ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      openConfirmModal({
                                        title: 'Cancelar acceso de proveedor',
                                        description: `¿Cancelar acceso como proveedor para ${user.name}?`,
                                        confirmText: 'Cancelar acceso',
                                        variant: 'warning',
                                        onConfirm: async () => {
                                          try {
                                            await onRevokeProviderAccess(user.id);
                                          } catch {
                                            // handled in parent
                                          }
                                        },
                                      })
                                    }
                                  >
                                    Cancelar Acceso Proveedor
                                  </Button>
                                ) : user.providerRequestStatus === 'pending' ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      openConfirmModal({
                                        title: 'Aprobar acceso de proveedor',
                                        description: `¿Aprobar acceso de proveedor para ${user.name}?`,
                                        confirmText: 'Aprobar acceso',
                                        variant: 'info',
                                        onConfirm: async () => {
                                          try {
                                            await onApproveProviderAccess(user.id);
                                          } catch {
                                            // handled in parent
                                          }
                                        },
                                      })
                                    }
                                    style={{ borderColor: '#D4AF37', color: '#D4AF37' }}
                                  >
                                    Aprobar Acceso Proveedor
                                  </Button>
                                ) : null}
                                
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    openConfirmModal({
                                      title: 'Eliminar usuario permanentemente',
                                      description: `¿Eliminar permanentemente a ${user.name}? Esta acción NO se puede deshacer y borrará todos sus datos.`,
                                      confirmText: 'Eliminar',
                                      variant: 'danger',
                                      onConfirm: async () => {
                                        try {
                                          await onDeleteUser(user.id);
                                          toast.success('Usuario eliminado');
                                        } catch (error) {
                                          toast.error('Error al eliminar');
                                        }
                                      },
                                    })
                                  }
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Eliminar
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {visibleFilteredUsers.length < filteredUsers.length && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleUsersCount((prev) => Math.min(prev + ADMIN_TABLE_BATCH_SIZE, filteredUsers.length))}
                  >
                    Cargar más usuarios ({visibleFilteredUsers.length}/{filteredUsers.length})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
            </div>
          )}

          {activeSection === 'services' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-[#1B2A47] mb-1">Servicios</h2>
                <p className="text-gray-500 text-sm">Inventario publicado y estado general del catálogo</p>
              </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#D4AF37]" />
                Ciudades disponibles en la plataforma
              </CardTitle>
              <CardDescription>
                Los proveedores pueden registrar servicios en cualquier ciudad, pero en el Home y en las búsquedas públicas solo se mostrarán las ciudades habilitadas aquí.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Badge variant="secondary">{selectedEnabledCities.length} habilitadas</Badge>
                  <span>de {allCities.length} ciudades configuradas</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEnabledCities([...allCities].sort((left, right) => left.localeCompare(right, 'es')))}
                  >
                    Seleccionar todas
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEnabledCities([])}
                  >
                    Ocultar todas
                  </Button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex flex-wrap gap-2">
                  {allCities.map((cityName) => {
                    const isEnabled = selectedEnabledCities.includes(cityName);

                    return (
                      <button
                        key={cityName}
                        type="button"
                        onClick={() => toggleEnabledCity(cityName)}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          isEnabled
                            ? 'border-[#D4AF37] bg-amber-50 text-[#1B2A47]'
                            : 'border-gray-300 bg-white text-gray-600 hover:border-[#D4AF37]/60'
                        }`}
                      >
                        {isEnabled ? '✅' : '○'} {cityName}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <p className="text-xs text-gray-500">
                  Estos cambios afectan el Home, los listados públicos y la búsqueda de clientes.
                </p>
                <Button
                  type="button"
                  onClick={handleSaveEnabledCities}
                  disabled={savingEnabledCities || !hasCityAvailabilityChanges}
                  className="md:self-end"
                >
                  {savingEnabledCities ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar ciudades disponibles
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Servicios Publicados</CardTitle>
              <CardDescription>
                Vista general de todos los servicios en la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por servicio, categoría, ubicación o proveedor..."
                  value={serviceSearchQuery}
                  onChange={(e) => setServiceSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Precio/Hora</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No se encontraron servicios con el filtro aplicado
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleFilteredServices.map((service) => {
                        const provider = providers.find(p => p.userId === service.userId);
                        return (
                          <TableRow key={service.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <img 
                                  src={service.image} 
                                  alt={service.name}
                                  className="w-10 h-10 rounded object-cover"
                                />
                                <div>
                                  <div>{service.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {service.location}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{service.category}</TableCell>
                            <TableCell>{provider?.businessName || 'N/A'}</TableCell>
                            <TableCell>${service.pricePerHour}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-current text-yellow-500" />
                                <span>{service.rating.toFixed(1)}</span>
                                <span className="text-xs text-gray-500">
                                  ({service.reviews})
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {service.isArchived ? (
                                <Badge variant="secondary">Archivado</Badge>
                              ) : service.isPublished === false ? (
                                <Badge variant="outline">No Publicado</Badge>
                              ) : (
                                <Badge variant="default" className="bg-green-600">
                                  Publicado
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              {visibleFilteredServices.length < filteredServices.length && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleServicesCount((prev) => Math.min(prev + ADMIN_TABLE_BATCH_SIZE, filteredServices.length))}
                  >
                    Cargar más servicios ({visibleFilteredServices.length}/{filteredServices.length})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
            </div>
          )}
        </div>
      </main>

      {/* Ban Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{banType === 'provider' ? 'Banear Proveedor' : 'Banear Usuario'}</DialogTitle>
            <DialogDescription>
              {banType === 'provider'
                ? `Estás a punto de banear a ${selectedProvider?.businessName}. Esta acción ocultará todos sus servicios y no podrá acceder a la plataforma.`
                : `Estás a punto de banear a ${selectedBanUser?.name || 'este usuario'}. No podrá acceder a la plataforma hasta que sea desbaneado.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ban-reason">Razón del Baneo *</Label>
              <Textarea
                id="ban-reason"
                placeholder="Explica por qué estás baneando a este proveedor..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBanDialog(false);
                setBanReason('');
                setSelectedProvider(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={banType === 'provider' ? handleBanProvider : handleBanUser}
              disabled={!banReason.trim()}
            >
              <Ban className="h-4 w-4 mr-2" />
              Confirmar Baneo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmModal.open}
        onOpenChange={(open) => setConfirmModal((prev) => ({ ...prev, open }))}
        onConfirm={handleConfirmModalAction}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
      />
    </div>
  );
}
