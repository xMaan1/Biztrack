'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import {
  Plus,
  X,
  Factory,
  Package,
  Wrench,
  CheckSquare,
  Star,
  Clock,
  Flag,
  AlertTriangle,
} from 'lucide-react';
import {
  ProductionPlanResponse as ProductionPlan,
  ProductionPlanCreate,
  ProductionPlanUpdate,
  ProductionPriority,
  ProductionType,
  MaterialRequirement,
  LaborRequirement,
} from '../../models/production';
import ProductionService from '../../services/ProductionService';
import { useAuth } from '../../hooks/useAuth';

interface ProductionPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  plan: ProductionPlan | null;
  onSuccess: () => void;
}

export default function ProductionPlanDialog({
  open,
  onOpenChange,
  mode,
  plan,
  onSuccess,
}: ProductionPlanDialogProps) {
  const { } = useAuth();
  const { getCurrencySymbol } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<ProductionPlanCreate>>({
    title: '',
    description: '',
    production_type: ProductionType.BATCH,
    priority: ProductionPriority.MEDIUM,
    target_quantity: 0,
    unit_of_measure: 'pieces',
    production_line: '',
    equipment_required: [],
    materials_required: [],
    labor_requirements: [],
    estimated_material_cost: 0,
    estimated_labor_cost: 0,
    quality_standards: '',
    inspection_points: [],
    tolerance_specs: [],
    tags: [],
  });

  const [newMaterial, setNewMaterial] = useState<Partial<MaterialRequirement>>({
    material_name: '',
    quantity: 0,
    unit: 'pieces',
    cost_per_unit: 0,
  });

  const [newLabor, setNewLabor] = useState<Partial<LaborRequirement>>({
    role: '',
    hours_required: 0,
    hourly_rate: 0,
  });

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (plan && mode === 'edit') {
      setFormData({
        title: plan.title,
        description: plan.description,
        production_type: plan.production_type,
        priority: plan.priority,
        planned_start_date: plan.planned_start_date,
        planned_end_date: plan.planned_end_date,
        target_quantity: plan.target_quantity,
        unit_of_measure: plan.unit_of_measure,
        production_line: plan.production_line,
        equipment_required: plan.equipment_required,
        materials_required: plan.materials_required,
        labor_requirements: plan.labor_requirements,
        estimated_material_cost: plan.estimated_material_cost,
        estimated_labor_cost: plan.estimated_labor_cost,
        quality_standards: plan.quality_standards,
        inspection_points: plan.inspection_points,
        tolerance_specs: plan.tolerance_specs,
        tags: plan.tags,
      });
    } else {
      resetForm();
    }
  }, [plan, mode, open]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      production_type: ProductionType.BATCH,
      priority: ProductionPriority.MEDIUM,
      target_quantity: 0,
      unit_of_measure: 'pieces',
      production_line: '',
      equipment_required: [],
      materials_required: [],
      labor_requirements: [],
      estimated_material_cost: 0,
      estimated_labor_cost: 0,
      quality_standards: '',
      inspection_points: [],
      tolerance_specs: [],
      tags: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.target_quantity) return;

    try {
      setLoading(true);
      if (mode === 'create') {
        const service = new ProductionService();
        await service.createProductionPlan(formData as ProductionPlanCreate);
      } else if (plan) {
        const service = new ProductionService();
        await service.updateProductionPlan(
          plan.id,
          formData as ProductionPlanUpdate,
        );
      }
      onSuccess();
      resetForm();
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const addMaterial = () => {
    if (
      newMaterial.material_name &&
      newMaterial.quantity &&
      newMaterial.cost_per_unit
    ) {
      const material: MaterialRequirement = {
        material_id: Date.now().toString(),
        material_name: newMaterial.material_name,
        quantity: newMaterial.quantity,
        unit: newMaterial.unit || 'pieces',
        cost_per_unit: newMaterial.cost_per_unit,
        total_cost: newMaterial.quantity * newMaterial.cost_per_unit,
      };
      setFormData({
        ...formData,
        materials_required: [...(formData.materials_required || []), material],
        estimated_material_cost:
          (formData.estimated_material_cost || 0) + material.total_cost,
      });
      setNewMaterial({
        material_name: '',
        quantity: 0,
        unit: 'pieces',
        cost_per_unit: 0,
      });
    }
  };

  const removeMaterial = (index: number) => {
    const materials = [...(formData.materials_required || [])];
    const removed = materials.splice(index, 1)[0];
    setFormData({
      ...formData,
      materials_required: materials,
      estimated_material_cost:
        (formData.estimated_material_cost || 0) - removed.total_cost,
    });
  };

  const addLabor = () => {
    if (newLabor.role && newLabor.hours_required && newLabor.hourly_rate) {
      const labor: LaborRequirement = {
        role: newLabor.role,
        hours_required: newLabor.hours_required,
        hourly_rate: newLabor.hourly_rate,
        total_cost: newLabor.hours_required * newLabor.hourly_rate,
      };
      setFormData({
        ...formData,
        labor_requirements: [...(formData.labor_requirements || []), labor],
        estimated_labor_cost:
          (formData.estimated_labor_cost || 0) + labor.total_cost,
      });
      setNewLabor({ role: '', hours_required: 0, hourly_rate: 0 });
    }
  };

  const removeLabor = (index: number) => {
    const labor = [...(formData.labor_requirements || [])];
    const removed = labor.splice(index, 1)[0];
    setFormData({
      ...formData,
      labor_requirements: labor,
      estimated_labor_cost:
        (formData.estimated_labor_cost || 0) - removed.total_cost,
    });
  };

  const addTag = () => {
    if (newTag && !formData.tags?.includes(newTag)) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag],
      });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: (formData.tags || []).filter((t) => t !== tag),
    });
  };

  const getPriorityIcon = (priority: ProductionPriority) => {
    switch (priority) {
      case ProductionPriority.LOW:
        return <Clock className="h-4 w-4" />;
      case ProductionPriority.MEDIUM:
        return <Flag className="h-4 w-4" />;
      case ProductionPriority.HIGH:
        return <AlertTriangle className="h-4 w-4" />;
      case ProductionPriority.URGENT:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Flag className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: ProductionType) => {
    switch (type) {
      case ProductionType.BATCH:
        return <Package className="h-4 w-4" />;
      case ProductionType.CONTINUOUS:
        return <Factory className="h-4 w-4" />;
      case ProductionType.JOB_SHOP:
        return <Wrench className="h-4 w-4" />;
      case ProductionType.ASSEMBLY:
        return <CheckSquare className="h-4 w-4" />;
      case ProductionType.CUSTOM:
        return <Star className="h-4 w-4" />;
      default:
        return <Factory className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            {mode === 'create'
              ? 'Create Production Plan'
              : 'Edit Production Plan'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Production plan title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="production_type">Production Type</Label>
              <Select
                value={formData.production_type}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    production_type: value as ProductionType,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProductionType.BATCH}>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(ProductionType.BATCH)}
                      Batch
                    </div>
                  </SelectItem>
                  <SelectItem value={ProductionType.CONTINUOUS}>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(ProductionType.CONTINUOUS)}
                      Continuous
                    </div>
                  </SelectItem>
                  <SelectItem value={ProductionType.JOB_SHOP}>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(ProductionType.JOB_SHOP)}
                      Job Shop
                    </div>
                  </SelectItem>
                  <SelectItem value={ProductionType.ASSEMBLY}>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(ProductionType.ASSEMBLY)}
                      Assembly
                    </div>
                  </SelectItem>
                  <SelectItem value={ProductionType.CUSTOM}>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(ProductionType.CUSTOM)}
                      Custom
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    priority: value as ProductionPriority,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProductionPriority.LOW}>
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(ProductionPriority.LOW)}
                      Low
                    </div>
                  </SelectItem>
                  <SelectItem value={ProductionPriority.MEDIUM}>
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(ProductionPriority.MEDIUM)}
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value={ProductionPriority.HIGH}>
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(ProductionPriority.HIGH)}
                      High
                    </div>
                  </SelectItem>
                  <SelectItem value={ProductionPriority.URGENT}>
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(ProductionPriority.URGENT)}
                      Urgent
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_quantity">Target Quantity *</Label>
              <Input
                id="target_quantity"
                type="number"
                value={formData.target_quantity || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    target_quantity: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_of_measure">Unit of Measure</Label>
              <Input
                id="unit_of_measure"
                value={formData.unit_of_measure || ''}
                onChange={(e) =>
                  setFormData({ ...formData, unit_of_measure: e.target.value })
                }
                placeholder="pieces"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="production_line">Production Line</Label>
              <Input
                id="production_line"
                value={formData.production_line || ''}
                onChange={(e) =>
                  setFormData({ ...formData, production_line: e.target.value })
                }
                placeholder="Production line identifier"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Production plan description"
              rows={3}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="planned_start_date">Planned Start Date</Label>
              <Input
                id="planned_start_date"
                type="datetime-local"
                value={formData.planned_start_date || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    planned_start_date: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="planned_end_date">Planned End Date</Label>
              <Input
                id="planned_end_date"
                type="datetime-local"
                value={formData.planned_end_date || ''}
                onChange={(e) =>
                  setFormData({ ...formData, planned_end_date: e.target.value })
                }
              />
            </div>
          </div>

          {/* Materials Required */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Materials Required</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMaterial}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Input
                placeholder="Material name"
                value={newMaterial.material_name || ''}
                onChange={(e) =>
                  setNewMaterial({
                    ...newMaterial,
                    material_name: e.target.value,
                  })
                }
              />
              <Input
                type="number"
                placeholder="Quantity"
                value={newMaterial.quantity || ''}
                onChange={(e) =>
                  setNewMaterial({
                    ...newMaterial,
                    quantity: parseInt(e.target.value) || 0,
                  })
                }
              />
              <Input
                placeholder="Unit"
                value={newMaterial.unit || ''}
                onChange={(e) =>
                  setNewMaterial({ ...newMaterial, unit: e.target.value })
                }
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Cost per unit"
                value={newMaterial.cost_per_unit || ''}
                onChange={(e) =>
                  setNewMaterial({
                    ...newMaterial,
                    cost_per_unit: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            {formData.materials_required &&
              formData.materials_required.length > 0 && (
                <div className="space-y-2">
                  {formData.materials_required.map((material, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                    >
                      <span className="flex-1">{material.material_name}</span>
                      <span className="text-sm text-gray-500">
                        {material.quantity} {material.unit}
                      </span>
                      <span className="text-sm font-medium">
                        {getCurrencySymbol()}{material.total_cost}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMaterial(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="text-sm text-gray-500">
                    Total Material Cost: $
                    {formData.estimated_material_cost || 0}
                  </div>
                </div>
              )}
          </div>

          {/* Labor Requirements */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Labor Requirements</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLabor}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Labor
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                placeholder="Role"
                value={newLabor.role || ''}
                onChange={(e) =>
                  setNewLabor({ ...newLabor, role: e.target.value })
                }
              />
              <Input
                type="number"
                placeholder="Hours required"
                value={newLabor.hours_required || ''}
                onChange={(e) =>
                  setNewLabor({
                    ...newLabor,
                    hours_required: parseInt(e.target.value) || 0,
                  })
                }
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Hourly rate"
                value={newLabor.hourly_rate || ''}
                onChange={(e) =>
                  setNewLabor({
                    ...newLabor,
                    hourly_rate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            {formData.labor_requirements &&
              formData.labor_requirements.length > 0 && (
                <div className="space-y-2">
                  {formData.labor_requirements.map((labor, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                    >
                      <span className="flex-1">{labor.role}</span>
                      <span className="text-sm text-gray-500">
                        {labor.hours_required}h
                      </span>
                      <span className="text-sm font-medium">
                        {getCurrencySymbol()}{labor.total_cost}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLabor(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="text-sm text-gray-500">
                    Total Labor Cost: {getCurrencySymbol()}{formData.estimated_labor_cost || 0}
                  </div>
                </div>
              )}
          </div>

          {/* Quality Standards */}
          <div className="space-y-2">
            <Label htmlFor="quality_standards">Quality Standards</Label>
            <Textarea
              id="quality_standards"
              value={formData.quality_standards || ''}
              onChange={(e) =>
                setFormData({ ...formData, quality_standards: e.target.value })
              }
              placeholder="Quality standards and requirements"
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-32"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTag}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? 'Saving...'
                : mode === 'create'
                  ? 'Create Plan'
                  : 'Update Plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
