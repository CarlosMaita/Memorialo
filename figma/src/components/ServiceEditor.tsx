import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Switch } from './ui/switch';
import { ServicePlan } from '../types';
import { Plus, Trash2, DollarSign, Clock, Check, Image, X, Upload, Star, Edit, XCircle, AlertCircle, Eye, EyeOff, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useSupabase } from '../utils/useSupabase';
import { Progress } from './ui/progress';
import { VENEZUELAN_CITIES } from '../data/cities';
import { SERVICE_CATEGORIES } from '../data/serviceCategories';
import { DEFAULT_TERMS } from '../data/defaultTerms';

interface ServiceEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (service: any) => void;
  existingService?: any;
  categories: string[];
}

export function ServiceEditor({ open, onClose, onSave, existingService, categories }: ServiceEditorProps) {
  const { uploadImage, getService } = useSupabase();
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subcategory: '',
    description: '',
    location: '',
    pricePerHour: '',
    responseTime: '24 horas',
    bio: '',
    whatsappNumber: '',
    email: '',
    isPublished: true, // Por defecto los servicios están publicados
    allowCustomHourly: false // Por defecto desactivado
  });

  const [servicePlans, setServicePlans] = useState<ServicePlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState({
    saleType: 'time',
    name: '',
    price: '',
    duration: '',
    unitLabel: 'unidad(es)',
    description: '',
    includes: [''],
    popular: false
  });
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const [specialties, setSpecialties] = useState<string[]>(['']);
  const [availability, setAvailability] = useState<string[]>([]);
  const [mainImage, setMainImage] = useState('');
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  
  // Terms and Conditions
  const [customTerms, setCustomTerms] = useState({
    paymentTerms: DEFAULT_TERMS.paymentTerms,
    cancellationPolicy: DEFAULT_TERMS.cancellationPolicy,
    additionalTerms: [...DEFAULT_TERMS.additionalTerms]
  });
  
  // Upload states
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState<{ [key: number]: boolean }>({});
  
  // Form ready state - para asegurar que los Select se rendericen con los valores
  const [formReady, setFormReady] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  // Ref to guard against mobile ghost-clicks: records when we last navigated steps
  const lastStepNavigationTimeRef = useRef(0);

  // Ref para rastrear si ya cargamos los datos
  const hasLoadedDataRef = useRef(false);
  const previousOpenRef = useRef(false);
  const loadedServiceIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false); // Prevent concurrent loads

  // Función para mapear categorías antiguas a nuevas
  const normalizeCategoryToNew = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      'Música y DJs': 'TALENTO Y ENTRETENIMIENTO',
      'Artistas en Vivo': 'TALENTO Y ENTRETENIMIENTO',
      'Cultura y Ceremonia': 'TALENTO Y ENTRETENIMIENTO',
      'Salones y Banquetes': 'ESPACIOS Y LOCACIONES',
      'Lugares Únicos': 'ESPACIOS Y LOCACIONES',
      'Espacios al Aire Libre': 'ESPACIOS Y LOCACIONES',
      'Catering y Banquetería': 'GASTRONOMÍA Y SERVICIOS',
      'Decoración y Flores': 'AMBIENTACIÓN Y DECORACIÓN',
      'Iluminación y Sonido': 'AMBIENTACIÓN Y DECORACIÓN',
      'Diseño de Eventos': 'AMBIENTACIÓN Y DECORACIÓN',
      'Fotografía y Video': 'DETALLES Y LOGÍSTICA',
      'Invitaciones y Papelería': 'DETALLES Y LOGÍSTICA',
      'Transporte y Logística': 'DETALLES Y LOGÍSTICA'
    };

    // Si la categoría ya está en el formato correcto, devolverla
    if (Object.keys(SERVICE_CATEGORIES).includes(category)) {
      return category;
    }

    // Si es una subcategoría, buscar la categoría principal
    return categoryMap[category] || category;
  };

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    // Si el modal está cerrado, limpiar todo
    if (!open) {
      hasLoadedDataRef.current = false;
      loadedServiceIdRef.current = null;
      previousOpenRef.current = false;
      isLoadingRef.current = false;
      setFormReady(false);
      setFormData({
        name: '',
        category: '',
        subcategory: '',
        description: '',
        location: '',
        pricePerHour: '',
        responseTime: '24 horas',
        bio: '',
        whatsappNumber: '',
        email: '',
        isPublished: true,
        allowCustomHourly: false
      });
      setServicePlans([]);
      setCurrentPlan({
        saleType: 'time',
        name: '',
        price: '',
        duration: '',
        unitLabel: 'unidad(es)',
        description: '',
        includes: [''],
        popular: false
      });
      setSpecialties(['']);
      setAvailability([]);
      setMainImage('');
      setPortfolioImages([]);
      setCustomTerms({
        paymentTerms: DEFAULT_TERMS.paymentTerms,
        cancellationPolicy: DEFAULT_TERMS.cancellationPolicy,
        additionalTerms: [...DEFAULT_TERMS.additionalTerms]
      });
      setEditingPlanId(null);
      setCurrentStep(0);
      return;
    }

    // Detectar si el modal acaba de abrirse (transición de false a true)
    const justOpened = open && !previousOpenRef.current;
    previousOpenRef.current = true;
    
    // Solo cargar si el modal se acaba de abrir
    if (!justOpened) {
      return;
    }

    // Si no hay servicio existente, es un nuevo servicio (formulario vacío)
    if (!existingService) {
      setFormReady(true);
      return;
    }

    // Prevenir cargas concurrentes
    if (isLoadingRef.current) {
      return;
    }

    // Verificar si ya cargamos este servicio específico
    if (loadedServiceIdRef.current === existingService.id) {
      setFormReady(true);
      return;
    }
    
    // Marcar que estamos cargando
    isLoadingRef.current = true;
    loadedServiceIdRef.current = existingService.id;
    setFormReady(false);
    
    // Pequeño delay para asegurar que el DOM está listo
    setTimeout(async () => {
      try {
        // Obtener el detalle completo del servicio para cargar las imágenes de galería
        let serviceData: any = existingService;
        if (!existingService.detailLoaded) {
          try {
            const detailedService = await getService(existingService.id);
            if (detailedService) serviceData = detailedService;
          } catch (err) {
            console.warn('No se pudo cargar el detalle del servicio, usando datos en caché:', err);
          }
        }

        // Normalizar categoría
        const normalizedCategory = normalizeCategoryToNew(serviceData.category || '');
        
        // Si category es una subcategoría válida, buscar en qué categoría principal está
        let mainCategory = normalizedCategory;
        let subCategory = serviceData.subcategory || '';
        
        // Verificar si serviceData.category es realmente una subcategoría
        for (const [catKey, catValue] of Object.entries(SERVICE_CATEGORIES)) {
          if (catValue.subcategories.includes(serviceData.category)) {
            mainCategory = catKey;
            subCategory = serviceData.category;
            break;
          }
        }
        
        // Normalizar responseTime
        let normalizedResponseTime = serviceData.responseTime || '24 horas';
        if (normalizedResponseTime.includes('1 hour') || normalizedResponseTime.includes('< 1')) {
          normalizedResponseTime = '1 hora';
        } else if (normalizedResponseTime.includes('24')) {
          normalizedResponseTime = '24 horas';
        } else if (normalizedResponseTime.includes('48')) {
          normalizedResponseTime = '48 horas';
        }
        
        const loadedFormData = {
          name: serviceData.name || '',
          category: mainCategory,
          subcategory: subCategory,
          description: serviceData.bio || '',
          location: serviceData.location || '',
          pricePerHour: serviceData.pricePerHour ? serviceData.pricePerHour.toString() : '',
          responseTime: normalizedResponseTime,
          bio: serviceData.bio || '',
          whatsappNumber: serviceData.whatsappNumber || '',
          email: serviceData.email || '',
          isPublished: serviceData.isPublished !== undefined ? serviceData.isPublished : true,
          allowCustomHourly: serviceData.allowCustomHourly !== undefined ? serviceData.allowCustomHourly : false
        };
        
        setFormData(loadedFormData);
        setServicePlans(serviceData.servicePlans || []);
        setSpecialties(serviceData.specialties && serviceData.specialties.length > 0 ? serviceData.specialties : ['']);
        setAvailability(serviceData.availability || []);
        setMainImage(serviceData.image || '');
        setPortfolioImages(serviceData.portfolio && serviceData.portfolio.length > 0 ? serviceData.portfolio : []);
        setCustomTerms(serviceData.customTerms || {
          paymentTerms: DEFAULT_TERMS.paymentTerms,
          cancellationPolicy: DEFAULT_TERMS.cancellationPolicy,
          additionalTerms: [...DEFAULT_TERMS.additionalTerms]
        });
        setEditingPlanId(null);
        setCurrentPlan({
          saleType: 'time',
          name: '',
          price: '',
          duration: '',
          unitLabel: 'unidad(es)',
          description: '',
          includes: [''],
          popular: false
        });
        
        hasLoadedDataRef.current = true;
        isLoadingRef.current = false;
        
        // Esperar un frame más para que React procese los cambios de estado
        requestAnimationFrame(() => {
          setFormReady(true);
        });
      } catch (error) {
        console.error('Error loading service:', error);
        isLoadingRef.current = false;
        setFormReady(true); // Mostrar el formulario aunque haya error
      }
    }, 100);
  }, [open, existingService]);

  const handleAddSpecialty = () => {
    setSpecialties([...specialties, '']);
  };

  const handleRemoveSpecialty = (index: number) => {
    setSpecialties(specialties.filter((_, i) => i !== index));
  };

  const handleSpecialtyChange = (index: number, value: string) => {
    const updated = [...specialties];
    updated[index] = value;
    setSpecialties(updated);
  };

  const handleAddPortfolioImage = () => {
    if (portfolioImages.length < 5) {
      setPortfolioImages([...portfolioImages, '']);
    } else {
      toast.error('Máximo 5 imágenes de portafolio');
    }
  };

  const handleRemovePortfolioImage = (index: number) => {
    setPortfolioImages(portfolioImages.filter((_, i) => i !== index));
  };

  const handlePortfolioImageChange = (index: number, value: string) => {
    const updated = [...portfolioImages];
    updated[index] = value;
    setPortfolioImages(updated);
  };

  // Handle main image file upload
  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingMain(true);
      const url = await uploadImage(file);
      setMainImage(url);
      toast.success('Imagen principal subida exitosamente');
    } catch (error: any) {
      console.error('Error uploading main image:', error);
      toast.error(error.message || 'Error al subir la imagen');
    } finally {
      setUploadingMain(false);
    }
  };

  // Handle portfolio image file upload
  const handlePortfolioImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPortfolio({ ...uploadingPortfolio, [index]: true });
      const url = await uploadImage(file);
      const updated = [...portfolioImages];
      updated[index] = url;
      setPortfolioImages(updated);
      toast.success('Imagen de galería subida exitosamente');
    } catch (error: any) {
      console.error('Error uploading portfolio image:', error);
      toast.error(error.message || 'Error al subir la imagen');
    } finally {
      setUploadingPortfolio({ ...uploadingPortfolio, [index]: false });
    }
  };

  // Handle multiple portfolio image file uploads
  const handlePortfolioMultiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentCount = portfolioImages.length;
    const availableSlots = 5 - currentCount;
    const filesToUpload = files.slice(0, availableSlots);

    if (files.length > availableSlots) {
      toast.warning(`Solo se pueden agregar ${availableSlots} imagen(es) más. Se subirán las primeras ${availableSlots}.`);
    }

    const startIndex = currentCount;
    const uploadingState: { [key: number]: boolean } = {};
    filesToUpload.forEach((_, i) => { uploadingState[startIndex + i] = true; });
    setUploadingPortfolio(prev => ({ ...prev, ...uploadingState }));

    const uploadPromises = filesToUpload.map(async (file, i) => {
      const idx = startIndex + i;
      try {
        const url = await uploadImage(file);
        return url;
      } catch (error: any) {
        console.error('Error uploading portfolio image:', error);
        toast.error(error.message || 'Error al subir imagen');
        return null;
      } finally {
        setUploadingPortfolio(prev => {
          const next = { ...prev };
          delete next[idx];
          return next;
        });
      }
    });

    const results = await Promise.all(uploadPromises);
    const validUrls = results.filter((url): url is string => url !== null);

    if (validUrls.length > 0) {
      setPortfolioImages(prev => [...prev, ...validUrls]);
      toast.success(`${validUrls.length} imagen(es) subida(s) exitosamente`);
    }

    // Reset the input so the same files can be selected again if needed
    e.target.value = '';
  };

  const handleAddInclude = () => {
    setCurrentPlan({
      ...currentPlan,
      includes: [...currentPlan.includes, '']
    });
  };

  const handleRemoveInclude = (index: number) => {
    setCurrentPlan({
      ...currentPlan,
      includes: currentPlan.includes.filter((_, i) => i !== index)
    });
  };

  const handleIncludeChange = (index: number, value: string) => {
    const updated = [...currentPlan.includes];
    updated[index] = value;
    setCurrentPlan({ ...currentPlan, includes: updated });
  };

  const handleAddPlan = () => {
    if (!currentPlan.name || !currentPlan.price || !currentPlan.duration) {
      toast.error('Por favor completa todos los campos del plan');
      return;
    }

    if (currentPlan.saleType === 'unit' && !currentPlan.unitLabel.trim()) {
      toast.error('Indica la unidad de venta para este plan');
      return;
    }

    if (editingPlanId) {
      // Actualizar plan existente
      const updatedPlans = servicePlans.map(plan => 
        plan.id === editingPlanId 
          ? {
              ...plan,
              saleType: currentPlan.saleType,
              name: currentPlan.name,
              price: parseFloat(currentPlan.price),
              duration: parseFloat(currentPlan.duration),
              unitLabel: currentPlan.saleType === 'unit' ? currentPlan.unitLabel.trim() : 'hora(s)',
              description: currentPlan.description,
              includes: currentPlan.includes.filter(i => i.trim() !== ''),
              popular: currentPlan.popular
            }
          : plan
      );
      setServicePlans(updatedPlans);
      toast.success('Plan actualizado exitosamente');
    } else {
      // Agregar nuevo plan
      const newPlan: ServicePlan = {
        id: `plan-${Date.now()}`,
        saleType: currentPlan.saleType as any,
        name: currentPlan.name,
        price: parseFloat(currentPlan.price),
        duration: parseFloat(currentPlan.duration),
        unitLabel: currentPlan.saleType === 'unit' ? currentPlan.unitLabel.trim() : 'hora(s)',
        description: currentPlan.description,
        includes: currentPlan.includes.filter(i => i.trim() !== ''),
        popular: currentPlan.popular
      };
      setServicePlans([...servicePlans, newPlan]);
      toast.success('Plan agregado exitosamente');
    }

    // Resetear formulario
    setCurrentPlan({
      saleType: 'time',
      name: '',
      price: '',
      duration: '',
      unitLabel: 'unidad(es)',
      description: '',
      includes: [''],
      popular: false
    });
    setEditingPlanId(null);
  };

  const handleEditPlan = (plan: ServicePlan) => {
    const saleType = (plan as any).saleType === 'unit' ? 'unit' : 'time';
    setCurrentPlan({
      saleType,
      name: plan.name,
      price: plan.price.toString(),
      duration: plan.duration.toString(),
      unitLabel: saleType === 'unit' ? String((plan as any).unitLabel || 'unidad(es)') : 'hora(s)',
      description: plan.description,
      includes: plan.includes.length > 0 ? plan.includes : [''],
      popular: plan.popular || false
    });
    setEditingPlanId(plan.id);
    toast.info('Editando plan - modifica los campos y presiona "Actualizar Plan"');
  };

  const handleCancelEditPlan = () => {
    setCurrentPlan({
      saleType: 'time',
      name: '',
      price: '',
      duration: '',
      unitLabel: 'unidad(es)',
      description: '',
      includes: [''],
      popular: false
    });
    setEditingPlanId(null);
  };

  const handleRemovePlan = (planId: string) => {
    setServicePlans(servicePlans.filter(p => p.id !== planId));
    // Si estamos editando este plan, cancelar la edición
    if (editingPlanId === planId) {
      handleCancelEditPlan();
    }
  };

  const handleToggleAvailability = (day: string) => {
    if (availability.includes(day)) {
      setAvailability(availability.filter(d => d !== day));
    } else {
      setAvailability([...availability, day]);
    }
  };

  const handleAddAdditionalTerm = () => {
    setCustomTerms({
      ...customTerms,
      additionalTerms: [...customTerms.additionalTerms, '']
    });
  };

  const handleRemoveAdditionalTerm = (index: number) => {
    setCustomTerms({
      ...customTerms,
      additionalTerms: customTerms.additionalTerms.filter((_, i) => i !== index)
    });
  };

  const handleUpdateAdditionalTerm = (index: number, value: string) => {
    const newTerms = [...customTerms.additionalTerms];
    newTerms[index] = value;
    setCustomTerms({
      ...customTerms,
      additionalTerms: newTerms
    });
  };

  const handleResetToDefaultTerms = () => {
    setCustomTerms({
      paymentTerms: DEFAULT_TERMS.paymentTerms,
      cancellationPolicy: DEFAULT_TERMS.cancellationPolicy,
      additionalTerms: [...DEFAULT_TERMS.additionalTerms]
    });
    toast.success('Términos restaurados a la plantilla por defecto');
  };

  const steps = [
    {
      title: 'Base del servicio',
      description: 'Nombre, categoría y datos de contacto',
      icon: Check
    },
    {
      title: 'Detalles visuales',
      description: 'Especialidades, disponibilidad e imágenes',
      icon: Image
    },
    {
      title: 'Planes y precios',
      description: 'Paquetes, duración y valor por hora',
      icon: DollarSign
    },
    {
      title: 'Contrato y publicación',
      description: 'Términos finales y revisión antes de publicar',
      icon: FileText
    }
  ];

  const isBasicStepComplete = Boolean(
    formData.name &&
    formData.category &&
    formData.subcategory &&
    formData.location
  );
  const hasMediaOrDetails = Boolean(
    specialties.some((specialty) => specialty.trim() !== '') ||
    availability.length > 0 ||
    mainImage ||
    portfolioImages.some((img) => img.trim() !== '')
  );
  const isPricingStepComplete = servicePlans.length > 0 && (
    !formData.allowCustomHourly ||
    (Boolean(formData.pricePerHour) && parseFloat(formData.pricePerHour) > 0)
  );
  const setupProgress = [
    isBasicStepComplete,
    hasMediaOrDetails,
    isPricingStepComplete,
    Boolean(
      customTerms.paymentTerms.trim() &&
      customTerms.cancellationPolicy.trim() &&
      formData.whatsappNumber &&
      formData.email
    )
  ].filter(Boolean).length;

  const validateStep = (stepIndex: number = currentStep) => {
    if (stepIndex === 0 && !isBasicStepComplete) {
      toast.error('Completa nombre, ubicación, categoría y subcategoría para continuar');
      return false;
    }

    if (stepIndex === 2) {
      if (servicePlans.length === 0) {
        toast.error('Agrega al menos un plan de servicio para continuar');
        return false;
      }

      if (formData.allowCustomHourly && (!formData.pricePerHour || parseFloat(formData.pricePerHour) <= 0)) {
        toast.error('Indica un precio base por hora válido');
        return false;
      }
    }

    return true;
  };

  const handleStepChange = (targetStep: number) => {
    if (targetStep > currentStep && !validateStep(currentStep)) {
      return;
    }

    setCurrentStep(targetStep);
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    lastStepNavigationTimeRef.current = Date.now();
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrevStep = () => {
    lastStepNavigationTimeRef.current = Date.now();
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Only save when on the last step; otherwise advance to the next step
    if (currentStep < steps.length - 1) {
      handleNextStep();
      return;
    }

    // Guard against mobile ghost-clicks: on mobile a tap on "Siguiente" can
    // leave a residual touch event that fires as a click on the "Guardar" button
    // that appears in the same position after the step transition. Ignore any
    // form submission that arrives within 500 ms of a step navigation.
    if (Date.now() - lastStepNavigationTimeRef.current < 500) {
      return;
    }

    if (!formData.name || !formData.category || !formData.subcategory || !formData.location || !formData.whatsappNumber || !formData.email) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (servicePlans.length === 0) {
      toast.error('Debes agregar al menos un plan de servicio');
      return;
    }

    if (formData.allowCustomHourly && (!formData.pricePerHour || parseFloat(formData.pricePerHour) <= 0)) {
      toast.error('El precio base por hora es obligatorio cuando el plan personalizado por horas está activado');
      return;
    }

    const filteredPortfolio = portfolioImages.filter(img => img.trim() !== '');
    
    const service = {
      id: existingService?.id || `service-${Date.now()}`,
      name: formData.name,
      category: formData.category,
      subcategory: formData.subcategory,
      bio: formData.bio || formData.description,
      location: formData.location,
      pricePerHour: formData.allowCustomHourly
        ? parseFloat(formData.pricePerHour)
        : (parseFloat(formData.pricePerHour) || servicePlans[0].price / servicePlans[0].duration),
      responseTime: formData.responseTime,
      specialties: specialties.filter(s => s.trim() !== ''),
      availability: availability,
      servicePlans: servicePlans,
      allowCustomHourly: formData.allowCustomHourly,
      image: mainImage || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
      portfolio: filteredPortfolio.length > 0 ? filteredPortfolio : [],
      verified: existingService?.verified || false,
      rating: existingService?.rating || 5,
      reviews: existingService?.reviews || 0,
      bookingsCompleted: existingService?.bookingsCompleted || 0,
      whatsappNumber: formData.whatsappNumber,
      email: formData.email,
      customTerms: {
        paymentTerms: customTerms.paymentTerms,
        cancellationPolicy: customTerms.cancellationPolicy,
        additionalTerms: customTerms.additionalTerms.filter(t => t.trim() !== '')
      },
      isPublished: formData.isPublished,
      isArchived: existingService?.isArchived || false // Preservar estado de archivado
    };

    onSave(service);
    toast.success(existingService ? 'Servicio actualizado' : 'Servicio creado exitosamente');
    handleClose();
  };

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  const handleDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="!flex !flex-col h-[100dvh] w-screen max-h-[100dvh] max-w-none overflow-hidden rounded-none border-none bg-slate-50 p-0 shadow-2xl sm:h-[95vh] sm:w-[95vw] sm:max-h-[95vh] sm:max-w-5xl sm:rounded-[28px] [&_[data-slot='dialog-close']]:rounded-full [&_[data-slot='dialog-close']]:bg-white [&_[data-slot='dialog-close']]:p-2 [&_[data-slot='dialog-close']]:text-slate-700 [&_[data-slot='dialog-close']]:opacity-100 [&_[data-slot='dialog-close']]:shadow-md">
        <DialogHeader className="flex-shrink-0 border-b border-slate-200 bg-white px-5 pb-4 pt-14 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1 text-left">
              <DialogTitle className="text-2xl font-semibold text-slate-900">
                {existingService ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
              </DialogTitle>
              <DialogDescription className="max-w-2xl text-sm text-slate-600">
                Completa tu servicio paso a paso con un flujo más claro, minimalista y fácil de terminar.
              </DialogDescription>
            </div>

            <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left sm:block sm:min-w-[190px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Paso {currentStep + 1} de {steps.length}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">{steps[currentStep].title}</p>
              <p className="text-xs text-slate-500">{setupProgress}/{steps.length} bloques listos</p>
            </div>
          </div>

          <Progress value={((currentStep + 1) / steps.length) * 100} className="mt-4 h-2" />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 min-h-0 flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <div className="mb-4 mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">{steps[currentStep].title}</p>
              <p className="mt-1 text-sm text-slate-600">{steps[currentStep].description}</p>
            </div>

            <div className="space-y-4">
              {currentStep === 0 && (
                <>
                  {/* Basic Information */}
                  <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre del Servicio *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Decoraciones para fiestas"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Ubicación *</Label>
                  {formReady && (
                    <Select
                      key={`location-${formData.location || 'empty'}`}
                      value={formData.location}
                      onValueChange={(value) => setFormData({ ...formData, location: value })}
                      required
                    >
                      <SelectTrigger id="location">
                        <SelectValue placeholder="Seleccionar ciudad" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {VENEZUELAN_CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoría Principal *</Label>
                  {formReady && (
                    <Select
                      key={`category-${formData.category || 'empty'}`}
                      value={formData.category}
                      onValueChange={(value) => {
                        setFormData({ ...formData, category: value, subcategory: '' });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona categoría principal" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(SERVICE_CATEGORIES).map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {SERVICE_CATEGORIES[cat as keyof typeof SERVICE_CATEGORIES].icon} {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label htmlFor="subcategory">Subcategoría *</Label>
                  {formReady && (
                    <Select
                      key={`subcategory-${formData.subcategory || 'empty'}-${formData.category || 'nocat'}`}
                      value={formData.subcategory}
                      onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
                      disabled={!formData.category}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.category ? "Selecciona subcategoría" : "Primero selecciona categoría"} />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.category && SERVICE_CATEGORIES[formData.category as keyof typeof SERVICE_CATEGORIES]?.subcategories.map((subcat) => (
                          <SelectItem key={subcat} value={subcat}>
                            {subcat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {formData.category && !formData.subcategory && (
                    <p className="text-xs text-gray-500 mt-1">
                      Esta subcategoría se usa para el filtrado de búsqueda
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="responseTime">Tiempo de Respuesta</Label>
                  {formReady && (
                    <Select
                      key={`responsetime-${formData.responseTime || 'empty'}`}
                      value={formData.responseTime}
                      onValueChange={(value) => setFormData({ ...formData, responseTime: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4 horas">4 horas</SelectItem>
                        <SelectItem value="12 horas">12 horas</SelectItem>
                        <SelectItem value="24 horas">24 horas</SelectItem>
                        <SelectItem value="48 horas">48 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>

                </>
              )}

              {currentStep === 1 && (
                <>
                  {/* Description */}
                  <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Descripción del Servicio</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value, description: e.target.value })}
                placeholder="Cuéntale al cliente qué haces, cómo trabajas y qué hace especial tu propuesta..."
                rows={4}
              />
            </CardContent>
          </Card>

                  {/* Specialties */}
                  <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Especialidades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {specialties.map((specialty, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={specialty}
                    onChange={(e) => handleSpecialtyChange(index, e.target.value)}
                    placeholder="Ej: Bodas, Fiestas corporativas..."
                  />
                  {specialties.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveSpecialty(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddSpecialty}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Especialidad
              </Button>
            </CardContent>
          </Card>

                  {/* Availability */}
                  <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Disponibilidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <Badge
                    key={day}
                    variant={availability.includes(day) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleToggleAvailability(day)}
                  >
                    {availability.includes(day) && <Check className="w-3 h-3 mr-1" />}
                    {day}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

                  {/* Images */}
                  <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Imágenes del Servicio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main Image */}
              <div>
                <Label htmlFor="mainImage">Imagen Principal *</Label>
                <p className="text-xs text-gray-500 mb-2">Esta imagen se mostrará en la tarjeta de tu servicio</p>

                {mainImage ? (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                    <ImageWithFallback
                      src={mainImage}
                      alt="Vista previa imagen principal"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setMainImage('')}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="mainImageFile"
                      tabIndex={uploadingMain ? -1 : 0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('mainImageFile')?.click(); } }}
                      className="block"
                    >
                      <div className={`flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed rounded-lg transition-colors ${uploadingMain ? 'bg-gray-50 opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}>
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {uploadingMain ? 'Subiendo...' : 'Subir imagen desde tu computadora'}
                        </span>
                      </div>
                      <input
                        id="mainImageFile"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleMainImageUpload}
                        disabled={uploadingMain}
                      />
                    </label>
                    {uploadingMain && <Progress value={50} className="w-full mt-2" />}
                  </div>
                )}
              </div>

              {/* Portfolio Images */}
              <div>
                <Label>Galería de Imágenes (Máximo 5)</Label>
                <p className="text-xs text-gray-500 mb-3">Muestra ejemplos de tu trabajo o eventos anteriores</p>
                <div className="flex flex-wrap gap-2">
                  {portfolioImages.map((img, index) => (
                    <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border flex-shrink-0">
                      <ImageWithFallback
                        src={img}
                        alt={`Imagen galería ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePortfolioImage(index)}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {portfolioImages.length < 5 && (() => {
                    const isUploading = Object.values(uploadingPortfolio).some(v => v);
                    return (
                      <label
                        htmlFor="portfolioFiles"
                        tabIndex={isUploading ? -1 : 0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('portfolioFiles')?.click(); } }}
                        className="flex-shrink-0 block"
                      >
                        <div className={`w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors gap-1 ${isUploading ? 'bg-gray-50 opacity-70 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}>
                          <Upload className="w-5 h-5 text-blue-500" />
                          <span className="text-xs text-blue-500 font-medium">
                            {isUploading ? 'Subiendo...' : 'Seleccionar'}
                          </span>
                        </div>
                        <input
                          id="portfolioFiles"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handlePortfolioMultiUpload}
                          disabled={isUploading}
                        />
                      </label>
                    );
                  })()}
                </div>
                {Object.values(uploadingPortfolio).some(v => v) && (
                  <Progress value={50} className="w-full mt-2" />
                )}
              </div>
            </CardContent>
          </Card>

                </>
              )}

              {currentStep === 2 && (
                <>
                  {/* Service Plans */}
                  <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Planes de Servicio *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg" style={{ borderColor: formData.allowCustomHourly ? '#10b981' : '#94a3b8', backgroundColor: formData.allowCustomHourly ? '#f0fdf4' : '#f8fafc' }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className={`w-5 h-5 ${formData.allowCustomHourly ? 'text-green-600' : 'text-slate-600'}`} />
                    <Label htmlFor="allowCustomHourly" className="text-base cursor-pointer mb-0">
                      Plan personalizado por horas
                    </Label>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formData.allowCustomHourly
                      ? 'Los clientes pueden crear reservas personalizadas por duración.'
                      : 'Los clientes solo podrán reservar usando los planes predefinidos.'}
                  </p>
                </div>
                <Switch
                  id="allowCustomHourly"
                  checked={formData.allowCustomHourly}
                  onCheckedChange={(checked) => setFormData({ ...formData, allowCustomHourly: checked })}
                />
              </div>

              {formData.allowCustomHourly && (
                <div>
                  <Label htmlFor="pricePerHour">Precio Base por Hora *</Label>
                  <Input
                    id="pricePerHour"
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.pricePerHour}
                    onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
                    placeholder="100"
                    required={formData.allowCustomHourly}
                  />
                </div>
              )}

              {/* Existing Plans */}
              {servicePlans.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Planes agregados:</p>
                  {servicePlans.map((plan) => (
                    <div 
                      key={plan.id} 
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        editingPlanId === plan.id ? 'border-blue-500 bg-blue-50' :
                        plan.popular ? 'border-gold bg-gold/5' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{plan.name}</p>
                          {plan.popular && (
                            <Badge variant="secondary" className="text-xs" style={{ background: 'var(--gold)', color: 'var(--navy-blue)' }}>
                              <Star className="w-3 h-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                          {editingPlanId === plan.id && (
                            <Badge variant="secondary" className="text-xs bg-blue-500 text-white">
                              Editando
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${plan.price}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {(plan as any).saleType === 'unit'
                              ? `${plan.duration} ${String((plan as any).unitLabel || 'unidad(es)')}`
                              : `${plan.duration}h`}
                          </span>
                          <span>{plan.includes.length} incluidos</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditPlan(plan)}
                          title="Editar plan"
                        >
                          <Edit className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemovePlan(plan.id)}
                          title="Eliminar plan"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add/Edit Plan */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm">{editingPlanId ? 'Editar plan:' : 'Agregar nuevo plan:'}</p>
                  {editingPlanId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEditPlan}
                      className="text-gray-600"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Cancelar
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="Nombre del plan"
                    value={currentPlan.name}
                    onChange={(e) => setCurrentPlan({ ...currentPlan, name: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Precio"
                    value={currentPlan.price}
                    onChange={(e) => setCurrentPlan({ ...currentPlan, price: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    value={currentPlan.saleType}
                    onValueChange={(value) => setCurrentPlan({
                      ...currentPlan,
                      saleType: value,
                      unitLabel: value === 'unit' ? (currentPlan.unitLabel || 'unidad(es)') : 'hora(s)'
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time">Por tiempo</SelectItem>
                      <SelectItem value="unit">Por unidad</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder={currentPlan.saleType === 'unit' ? 'Cantidad' : 'Duración (hrs)'}
                    value={currentPlan.duration}
                    onChange={(e) => setCurrentPlan({ ...currentPlan, duration: e.target.value })}
                  />
                </div>

                {currentPlan.saleType === 'unit' && (
                  <Input
                    placeholder="Unidad de venta (ej: unidad(es), porción(es), caja(s))"
                    value={currentPlan.unitLabel}
                    onChange={(e) => setCurrentPlan({ ...currentPlan, unitLabel: e.target.value })}
                  />
                )}
                <Textarea
                  placeholder="Descripción del plan"
                  value={currentPlan.description}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, description: e.target.value })}
                  rows={2}
                />
                <div className="space-y-2">
                  <Label className="text-sm">¿Qué incluye?</Label>
                  {currentPlan.includes.map((include, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Ej: Equipo de sonido profesional"
                        value={include}
                        onChange={(e) => handleIncludeChange(index, e.target.value)}
                      />
                      {currentPlan.includes.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveInclude(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddInclude}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Item
                  </Button>
                </div>
                
                {/* Opción de marcar como popular */}
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-gold/20 bg-gold/5">
                  <Checkbox
                    id="popular-plan"
                    checked={currentPlan.popular}
                    onCheckedChange={(checked) => 
                      setCurrentPlan({ ...currentPlan, popular: checked as boolean })
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                    <Label
                      htmlFor="popular-plan"
                      className="text-sm cursor-pointer select-none"
                    >
                      Marcar como Plan Popular (Destacado)
                    </Label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleAddPlan}
                    className="flex-1"
                  >
                    {editingPlanId ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Actualizar Plan
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Plan
                      </>
                    )}
                  </Button>
                  {editingPlanId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEditPlan}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

                </>
              )}

              {currentStep === 3 && (
                <>
                  <Card className="rounded-2xl border-slate-200 shadow-sm">
                    <CardContent className="grid gap-3 pt-6 sm:grid-cols-4">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Servicio</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">{formData.name || 'Pendiente'}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Ubicación</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">{formData.location || 'Pendiente'}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Categoría</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">{formData.subcategory || formData.category || 'Pendiente'}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Planes</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">{servicePlans.length} configurado(s)</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Terms and Conditions */}
                  <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Términos y Condiciones del Contrato</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Personaliza los términos que se incluirán en los contratos de este servicio
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetToDefaultTerms}
                  className="text-xs"
                >
                  Restaurar Plantilla
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="paymentTerms">Términos de Pago</Label>
                <Textarea
                  id="paymentTerms"
                  value={customTerms.paymentTerms}
                  onChange={(e) => setCustomTerms({ ...customTerms, paymentTerms: e.target.value })}
                  placeholder="Describe los términos de pago (anticipos, métodos de pago, etc.)"
                  rows={5}
                  className="resize-y"
                />
              </div>

              <div>
                <Label htmlFor="cancellationPolicy">Política de Cancelación</Label>
                <Textarea
                  id="cancellationPolicy"
                  value={customTerms.cancellationPolicy}
                  onChange={(e) => setCustomTerms({ ...customTerms, cancellationPolicy: e.target.value })}
                  placeholder="Describe la política de cancelación y reembolsos"
                  rows={5}
                  className="resize-y"
                />
              </div>

              <div>
                <Label>Términos Adicionales</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Agrega cláusulas adicionales específicas para tu servicio
                </p>
                <div className="space-y-2">
                  {customTerms.additionalTerms.map((term, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={term}
                        onChange={(e) => handleUpdateAdditionalTerm(index, e.target.value)}
                        placeholder={`Término adicional ${index + 1}`}
                      />
                      {customTerms.additionalTerms.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAdditionalTerm(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAdditionalTerm}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Término Adicional
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2 text-blue-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="mb-1">
                      <strong>Importante:</strong> Estos términos se copiarán a los contratos cuando un cliente haga una reserva.
                    </p>
                    <p>
                      Los contratos firmados son <strong>inmutables</strong> - si cambias estos términos después, 
                      los contratos existentes mantendrán los términos originales.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

                  <Card className="rounded-2xl border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Notificación</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="whatsappNumber">WhatsApp Business *</Label>
                          <Input
                            id="whatsappNumber"
                            required
                            value={formData.whatsappNumber}
                            onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                            placeholder="Ej: +58 412 1234567"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Los clientes te contactarán después de firmar el contrato
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="email">Correo Electrónico *</Label>
                          <Input
                            id="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="tu@email.com"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Para notificaciones de reservas y contratos
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex items-center justify-between p-4 border rounded-lg" style={{ borderColor: formData.isPublished ? '#10b981' : '#f59e0b', backgroundColor: formData.isPublished ? '#f0fdf4' : '#fef3c7' }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {formData.isPublished ? <Eye className="w-5 h-5 text-green-600" /> : <EyeOff className="w-5 h-5 text-yellow-600" />}
                        <Label htmlFor="isPublished" className="text-base cursor-pointer mb-0">
                          {formData.isPublished ? 'Servicio Publicado' : 'Servicio Oculto'}
                        </Label>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formData.isPublished
                          ? 'Tu servicio es visible para todos los clientes en la búsqueda pública'
                          : 'Tu servicio está oculto y solo tú puedes verlo. Ideal para editar sin mostrarlo aún'}
                      </p>
                    </div>
                    <Switch
                      id="isPublished"
                      checked={formData.isPublished}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                    />
                  </div>

                </>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                {currentStep === 0 && 'Completa lo esencial de tu servicio para seguir.'}
                {currentStep === 1 && 'Agrega detalles visuales para que tu propuesta genere más confianza.'}
                {currentStep === 2 && 'Define al menos un plan para comenzar a recibir reservas.'}
                {currentStep === 3 && 'Revisa el resumen final y guarda cuando todo esté listo.'}
              </p>

              <div className="flex flex-row gap-2">
                <Button type="button" variant="outline" onClick={handleClose} className="hidden sm:flex">
                  Cancelar
                </Button>

                {currentStep > 0 && (
                  <Button type="button" variant="outline" onClick={handlePrevStep} className="flex-1 sm:flex-none">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Anterior
                  </Button>
                )}

                {currentStep < steps.length - 1 ? (
                  <Button type="button" onClick={handleNextStep} className="flex-1 sm:flex-none">
                    Siguiente
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" className="flex-1 sm:flex-none">
                    {existingService ? 'Guardar cambios' : 'Crear servicio'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
