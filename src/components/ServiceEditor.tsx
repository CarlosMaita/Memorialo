import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ServicePlan } from '../types';
import { Plus, Trash2, DollarSign, Clock, Check, Image, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ServiceEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (service: any) => void;
  existingService?: any;
  categories: string[];
}

export function ServiceEditor({ open, onClose, onSave, existingService, categories }: ServiceEditorProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    location: '',
    pricePerHour: '',
    responseTime: '24 horas',
    bio: ''
  });

  const [servicePlans, setServicePlans] = useState<ServicePlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState({
    name: '',
    price: '',
    duration: '',
    description: '',
    includes: ['']
  });

  const [specialties, setSpecialties] = useState<string[]>(['']);
  const [availability, setAvailability] = useState<string[]>([]);
  const [mainImage, setMainImage] = useState('');
  const [portfolioImages, setPortfolioImages] = useState<string[]>(['']);

  useEffect(() => {
    if (open) {
      if (existingService) {
        // Cargar datos del servicio existente
        setFormData({
          name: existingService.name,
          category: existingService.category,
          description: existingService.bio,
          location: existingService.location,
          pricePerHour: existingService.pricePerHour.toString(),
          responseTime: existingService.responseTime,
          bio: existingService.bio
        });
        setServicePlans(existingService.servicePlans || []);
        setSpecialties(existingService.specialties || ['']);
        setAvailability(existingService.availability || []);
        setMainImage(existingService.image || '');
        setPortfolioImages(existingService.portfolio && existingService.portfolio.length > 0 ? existingService.portfolio : ['']);
      } else {
        // Resetear formulario para nuevo servicio
        setFormData({
          name: '',
          category: '',
          description: '',
          location: '',
          pricePerHour: '',
          responseTime: '24 horas',
          bio: ''
        });
        setServicePlans([]);
        setCurrentPlan({
          name: '',
          price: '',
          duration: '',
          description: '',
          includes: ['']
        });
        setSpecialties(['']);
        setAvailability([]);
        setMainImage('');
        setPortfolioImages(['']);
      }
    }
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
    if (portfolioImages.length > 1) {
      setPortfolioImages(portfolioImages.filter((_, i) => i !== index));
    }
  };

  const handlePortfolioImageChange = (index: number, value: string) => {
    const updated = [...portfolioImages];
    updated[index] = value;
    setPortfolioImages(updated);
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

    const newPlan: ServicePlan = {
      id: `plan-${Date.now()}`,
      name: currentPlan.name,
      price: parseFloat(currentPlan.price),
      duration: parseFloat(currentPlan.duration),
      description: currentPlan.description,
      includes: currentPlan.includes.filter(i => i.trim() !== '')
    };

    setServicePlans([...servicePlans, newPlan]);
    setCurrentPlan({
      name: '',
      price: '',
      duration: '',
      description: '',
      includes: ['']
    });
    toast.success('Plan agregado exitosamente');
  };

  const handleRemovePlan = (planId: string) => {
    setServicePlans(servicePlans.filter(p => p.id !== planId));
  };

  const handleToggleAvailability = (day: string) => {
    if (availability.includes(day)) {
      setAvailability(availability.filter(d => d !== day));
    } else {
      setAvailability([...availability, day]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.location) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (servicePlans.length === 0) {
      toast.error('Debes agregar al menos un plan de servicio');
      return;
    }

    const filteredPortfolio = portfolioImages.filter(img => img.trim() !== '');
    
    const service = {
      id: existingService?.id || `service-${Date.now()}`,
      name: formData.name,
      category: formData.category,
      bio: formData.bio || formData.description,
      location: formData.location,
      pricePerHour: parseFloat(formData.pricePerHour) || servicePlans[0].price / servicePlans[0].duration,
      responseTime: formData.responseTime,
      specialties: specialties.filter(s => s.trim() !== ''),
      availability: availability,
      servicePlans: servicePlans,
      image: mainImage || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
      portfolio: filteredPortfolio.length > 0 ? filteredPortfolio : [],
      verified: existingService?.verified || false,
      rating: existingService?.rating || 5,
      reviews: existingService?.reviews || 0,
      bookingsCompleted: existingService?.bookingsCompleted || 0
    };

    onSave(service);
    toast.success(existingService ? 'Servicio actualizado' : 'Servicio creado exitosamente');
    onClose();
  };

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingService ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
          </DialogTitle>
          <DialogDescription>
            Completa la información de tu servicio para que los clientes puedan encontrarte
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre del Servicio *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Mariachi Los Camperos"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoría *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Ubicación *</Label>
                  <Input
                    id="location"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ciudad, Estado"
                  />
                </div>
                <div>
                  <Label htmlFor="pricePerHour">Precio Base por Hora</Label>
                  <Input
                    id="pricePerHour"
                    type="number"
                    value={formData.pricePerHour}
                    onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
                    placeholder="100"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Descripción del Servicio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Describe tu servicio, experiencia y qué te hace especial..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="responseTime">Tiempo de Respuesta</Label>
                <Select
                  value={formData.responseTime}
                  onValueChange={(value) => setFormData({ ...formData, responseTime: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 hora">1 hora</SelectItem>
                    <SelectItem value="24 horas">24 horas</SelectItem>
                    <SelectItem value="48 horas">48 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Specialties */}
          <Card>
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
          <Card>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Imágenes del Servicio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main Image */}
              <div>
                <Label htmlFor="mainImage">Imagen Principal *</Label>
                <p className="text-xs text-gray-500 mb-2">Esta imagen se mostrará en la tarjeta de tu servicio</p>
                <Input
                  id="mainImage"
                  value={mainImage}
                  onChange={(e) => setMainImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  💡 Puedes usar URLs de Unsplash, Imgur, o cualquier servicio de imágenes
                </p>
                {mainImage && (
                  <div className="mt-3 relative w-full h-48 rounded-lg overflow-hidden border">
                    <ImageWithFallback
                      src={mainImage}
                      alt="Vista previa imagen principal"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Portfolio Images */}
              <div>
                <Label>Galería de Imágenes (Máximo 5)</Label>
                <p className="text-xs text-gray-500 mb-3">Muestra ejemplos de tu trabajo o eventos anteriores</p>
                <div className="space-y-3">
                  {portfolioImages.map((img, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={img}
                          onChange={(e) => handlePortfolioImageChange(index, e.target.value)}
                          placeholder={`URL de imagen ${index + 1}`}
                        />
                        {portfolioImages.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleRemovePortfolioImage(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {img && (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                          <ImageWithFallback
                            src={img}
                            alt={`Vista previa ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  {portfolioImages.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddPortfolioImage}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Imagen ({portfolioImages.length}/5)
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Plans */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Planes de Servicio *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Plans */}
              {servicePlans.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Planes agregados:</p>
                  {servicePlans.map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{plan.name}</p>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${plan.price}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {plan.duration}h
                          </span>
                          <span>{plan.includes.length} incluidos</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePlan(plan.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Plan */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm">Agregar nuevo plan:</p>
                <div className="grid grid-cols-3 gap-3">
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
                  <Input
                    type="number"
                    placeholder="Duración (hrs)"
                    value={currentPlan.duration}
                    onChange={(e) => setCurrentPlan({ ...currentPlan, duration: e.target.value })}
                  />
                </div>
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
                <Button
                  type="button"
                  onClick={handleAddPlan}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Plan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {existingService ? 'Actualizar Servicio' : 'Crear Servicio'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
