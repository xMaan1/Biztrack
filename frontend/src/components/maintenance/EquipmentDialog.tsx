import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Badge } from '@/src/components/ui/badge';
import { X } from 'lucide-react';
import {
  EquipmentCreate,
  MaintenanceCategory,
  EquipmentStatus,
} from '@/src/models/maintenance';
import { maintenanceService } from '@/src/services/MaintenanceService';

interface EquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEquipmentCreated: () => void;
}

export function EquipmentDialog({
  open,
  onOpenChange,
  onEquipmentCreated,
}: EquipmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<EquipmentCreate>>({
    name: '',
    model: '',
    serial_number: '',
    manufacturer: '',
    category: MaintenanceCategory.GENERAL,
    location: '',
    status: EquipmentStatus.OPERATIONAL,
    installation_date: '',
    warranty_expiry: '',
    maintenance_interval_hours: 0,
    operating_hours: 0,
    specifications: {},
    assigned_technicians: [],
    critical_spare_parts: [],
    operating_instructions: '',
    safety_guidelines: [],
    tags: [],
  });

  const [newTechnician, setNewTechnician] = useState('');
  const [newSparePart, setNewSparePart] = useState('');
  const [newSafetyGuideline, setNewSafetyGuideline] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

  const handleInputChange = (
    field: keyof EquipmentCreate,
    value: any,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addArrayItem = (
    field: keyof EquipmentCreate,
    value: string,
    setter: (value: string) => void,
  ) => {
    if (value.trim()) {
      const currentArray = (formData[field] as string[]) || [];
      handleInputChange(field, [...currentArray, value.trim()]);
      setter('');
    }
  };

  const removeArrayItem = (
    field: keyof EquipmentCreate,
    index: number,
  ) => {
    const currentArray = (formData[field] as string[]) || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    handleInputChange(field, newArray);
  };

  const addSpecification = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      const currentSpecs = formData.specifications || {};
      handleInputChange('specifications', {
        ...currentSpecs,
        [newSpecKey.trim()]: newSpecValue.trim(),
      });
      setNewSpecKey('');
      setNewSpecValue('');
    }
  };

  const removeSpecification = (key: string) => {
    const currentSpecs = formData.specifications || {};
    const newSpecs = { ...currentSpecs };
    delete newSpecs[key];
    handleInputChange('specifications', newSpecs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      // Prepare data for submission - convert empty strings to null for optional fields
      const submitData = {
        ...formData,
        installation_date: formData.installation_date || null,
        warranty_expiry: formData.warranty_expiry || null,
        model: formData.model || null,
        serial_number: formData.serial_number || null,
        manufacturer: formData.manufacturer || null,
        location: formData.location || null,
        operating_instructions: formData.operating_instructions || null,
      };

      await maintenanceService.createEquipment(submitData as EquipmentCreate);
      onEquipmentCreated();
      onOpenChange(false);
      // Reset form
      setFormData({
        name: '',
        model: '',
        serial_number: '',
        manufacturer: '',
        category: MaintenanceCategory.GENERAL,
        location: '',
        status: EquipmentStatus.OPERATIONAL,
        installation_date: '',
        warranty_expiry: '',
        maintenance_interval_hours: 0,
        operating_hours: 0,
        specifications: {},
        assigned_technicians: [],
        critical_spare_parts: [],
        operating_instructions: '',
        safety_guidelines: [],
        tags: [],
      });
    } catch (error) {
      alert('Failed to create equipment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Equipment</DialogTitle>
          <DialogDescription>
            Add a new piece of equipment to your inventory
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Equipment Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter equipment name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="Model number"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="serial_number">Serial Number</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => handleInputChange('serial_number', e.target.value)}
                  placeholder="Serial number"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                placeholder="Manufacturer name"
              />
            </div>
          </div>

          {/* Category and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MaintenanceCategory).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(EquipmentStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location and Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Equipment location"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="installation_date">Installation Date</Label>
              <Input
                id="installation_date"
                type="date"
                value={formData.installation_date}
                onChange={(e) => handleInputChange('installation_date', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
              <Input
                id="warranty_expiry"
                type="date"
                value={formData.warranty_expiry}
                onChange={(e) => handleInputChange('warranty_expiry', e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maintenance_interval_hours">Maintenance Interval (hours)</Label>
              <Input
                id="maintenance_interval_hours"
                type="number"
                min="0"
                value={formData.maintenance_interval_hours}
                onChange={(e) => handleInputChange('maintenance_interval_hours', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Operating Hours */}
          <div className="grid gap-2">
            <Label htmlFor="operating_hours">Operating Hours</Label>
            <Input
              id="operating_hours"
              type="number"
              min="0"
              step="0.1"
              value={formData.operating_hours}
              onChange={(e) => handleInputChange('operating_hours', parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Operating Instructions */}
          <div className="grid gap-2">
            <Label htmlFor="operating_instructions">Operating Instructions</Label>
            <Textarea
              id="operating_instructions"
              value={formData.operating_instructions}
              onChange={(e) => handleInputChange('operating_instructions', e.target.value)}
              placeholder="Operating instructions and procedures"
              rows={3}
            />
          </div>

          {/* Arrays - Assigned Technicians */}
          <div className="grid gap-2">
            <Label>Assigned Technicians</Label>
            <div className="flex gap-2">
              <Input
                value={newTechnician}
                onChange={(e) => setNewTechnician(e.target.value)}
                placeholder="Add technician ID or name"
                onKeyPress={(e) => e.key === 'Enter' && addArrayItem('assigned_technicians', newTechnician, setNewTechnician)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayItem('assigned_technicians', newTechnician, setNewTechnician)}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData.assigned_technicians || []).map((tech, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tech}
                  <button
                    type="button"
                    onClick={() => removeArrayItem('assigned_technicians', index)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Arrays - Critical Spare Parts */}
          <div className="grid gap-2">
            <Label>Critical Spare Parts</Label>
            <div className="flex gap-2">
              <Input
                value={newSparePart}
                onChange={(e) => setNewSparePart(e.target.value)}
                placeholder="Add critical spare part"
                onKeyPress={(e) => e.key === 'Enter' && addArrayItem('critical_spare_parts', newSparePart, setNewSparePart)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayItem('critical_spare_parts', newSparePart, setNewSparePart)}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData.critical_spare_parts || []).map((part, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {part}
                  <button
                    type="button"
                    onClick={() => removeArrayItem('critical_spare_parts', index)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Arrays - Safety Guidelines */}
          <div className="grid gap-2">
            <Label>Safety Guidelines</Label>
            <div className="flex gap-2">
              <Input
                value={newSafetyGuideline}
                onChange={(e) => setNewSafetyGuideline(e.target.value)}
                placeholder="Add safety guideline"
                onKeyPress={(e) => e.key === 'Enter' && addArrayItem('safety_guidelines', newSafetyGuideline, setNewSafetyGuideline)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayItem('safety_guidelines', newSafetyGuideline, setNewSafetyGuideline)}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData.safety_guidelines || []).map((guideline, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {guideline}
                  <button
                    type="button"
                    onClick={() => removeArrayItem('safety_guidelines', index)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Arrays - Tags */}
          <div className="grid gap-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag"
                onKeyPress={(e) => e.key === 'Enter' && addArrayItem('tags', newTag, setNewTag)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayItem('tags', newTag, setNewTag)}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData.tags || []).map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeArrayItem('tags', index)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Specifications */}
          <div className="grid gap-2">
            <Label>Specifications</Label>
            <div className="flex gap-2">
              <Input
                value={newSpecKey}
                onChange={(e) => setNewSpecKey(e.target.value)}
                placeholder="Specification key"
              />
              <Input
                value={newSpecValue}
                onChange={(e) => setNewSpecValue(e.target.value)}
                placeholder="Specification value"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addSpecification}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(formData.specifications || {}).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="flex items-center gap-1">
                  {key}: {value}
                  <button
                    type="button"
                    onClick={() => removeSpecification(key)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Equipment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
