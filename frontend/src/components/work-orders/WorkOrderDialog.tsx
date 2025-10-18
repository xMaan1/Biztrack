'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Loader2, X } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { apiService } from '../../services/ApiService';

interface WorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  workOrder?: any;
  onSuccess: () => void;
}

interface WorkOrderFormData {
  title: string;
  description: string;
  work_order_type: string;
  status: string;
  priority: string;
  planned_start_date: string;
  planned_end_date: string;
  estimated_hours: number;
  location: string;
  instructions: string;
  safety_notes: string;
  quality_requirements: string;
  materials_required: string[];
  estimated_cost: number;
  tags: string[];
}

export default function WorkOrderDialog({
  open,
  onOpenChange,
  mode,
  workOrder,
  onSuccess,
}: WorkOrderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState<WorkOrderFormData>({
    title: '',
    description: '',
    work_order_type: 'production',
    status: 'draft',
    priority: 'medium',
    planned_start_date: '',
    planned_end_date: '',
    estimated_hours: 0,
    location: '',
    instructions: '',
    safety_notes: '',
    quality_requirements: '',
    materials_required: [],
    estimated_cost: 0,
    tags: [],
  });

  const [newMaterial, setNewMaterial] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (workOrder && mode === 'edit') {
      setFormData({
        title: workOrder.title || '',
        description: workOrder.description || '',
        work_order_type: workOrder.work_order_type || 'production',
        status: workOrder.status || 'draft',
        priority: workOrder.priority || 'medium',
        planned_start_date: workOrder.planned_start_date
          ? workOrder.planned_start_date.split('T')[0]
          : '',
        planned_end_date: workOrder.planned_end_date
          ? workOrder.planned_end_date.split('T')[0]
          : '',
        estimated_hours: workOrder.estimated_hours || 0,
        location: workOrder.location || '',
        instructions: workOrder.instructions || '',
        safety_notes: workOrder.safety_notes || '',
        quality_requirements: workOrder.quality_requirements || '',
        materials_required: workOrder.materials_required || [],
        estimated_cost: workOrder.estimated_cost || 0,
        tags: workOrder.tags || [],
      });
    }
    setErrorMessage('');
  }, [workOrder, mode]);

  const isFormValid = () => {
    return (
      formData.title.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.planned_start_date !== '' &&
      formData.planned_end_date !== '' &&
      formData.estimated_hours > 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setErrorMessage('');
    
    if (!isFormValid()) {
      setErrorMessage('Please fill in all required fields');
      return;
    }
    
    setLoading(true);

    try {
      if (mode === 'create') {
        await apiService.post('/work-orders', formData);
      } else {
        await apiService.put(`/work-orders/${workOrder.id}`, formData);
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      setErrorMessage('Failed to save work order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      work_order_type: 'production',
      status: 'draft',
      priority: 'medium',
      planned_start_date: '',
      planned_end_date: '',
      estimated_hours: 0,
      location: '',
      instructions: '',
      safety_notes: '',
      quality_requirements: '',
      materials_required: [],
      estimated_cost: 0,
      tags: [],
    });
    setErrorMessage('');
  };

  const addMaterial = () => {
    if (
      newMaterial.trim() &&
      !formData.materials_required.includes(newMaterial.trim())
    ) {
      setFormData({
        ...formData,
        materials_required: [
          ...formData.materials_required,
          newMaterial.trim(),
        ],
      });
      setNewMaterial('');
    }
  };

  const removeMaterial = (material: string) => {
    setFormData({
      ...formData,
      materials_required: formData.materials_required.filter(
        (m) => m !== material,
      ),
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Work Order' : 'Edit Work Order'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the details to create a new work order'
              : 'Update the work order information'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter work order title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="work_order_type">Type *</Label>
              <Select
                value={formData.work_order_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, work_order_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the work to be performed"
              rows={3}
            />
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="planned_start_date">Planned Start Date *</Label>
              <Input
                id="planned_start_date"
                type="date"
                value={formData.planned_start_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    planned_start_date: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="planned_end_date">Planned End Date *</Label>
              <Input
                id="planned_end_date"
                type="date"
                value={formData.planned_end_date}
                onChange={(e) =>
                  setFormData({ ...formData, planned_end_date: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_hours">Estimated Hours *</Label>
              <Input
                id="estimated_hours"
                type="number"
                min="0"
                step="0.5"
                value={formData.estimated_hours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimated_hours: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.0"
              />
            </div>
          </div>

          {/* Location and Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="e.g., Workshop A, Machine 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_cost">Estimated Cost</Label>
              <Input
                id="estimated_cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.estimated_cost}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimated_cost: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Work Instructions</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) =>
                setFormData({ ...formData, instructions: e.target.value })
              }
              placeholder="Step-by-step instructions for the work"
              rows={4}
            />
          </div>

          {/* Safety and Quality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="safety_notes">Safety Notes</Label>
              <Textarea
                id="safety_notes"
                value={formData.safety_notes}
                onChange={(e) =>
                  setFormData({ ...formData, safety_notes: e.target.value })
                }
                placeholder="Safety precautions and requirements"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality_requirements">Quality Requirements</Label>
              <Textarea
                id="quality_requirements"
                value={formData.quality_requirements}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quality_requirements: e.target.value,
                  })
                }
                placeholder="Quality standards and inspection criteria"
                rows={3}
              />
            </div>
          </div>

          {/* Materials Required */}
          <div className="space-y-2">
            <Label>Materials Required</Label>
            <div className="flex gap-2">
              <Input
                value={newMaterial}
                onChange={(e) => setNewMaterial(e.target.value)}
                placeholder="Add material"
                onKeyPress={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), addMaterial())
                }
              />
              <Button type="button" onClick={addMaterial} variant="outline">
                Add
              </Button>
            </div>
            {formData.materials_required.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.materials_required.map((material, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {material}
                    <button
                      type="button"
                      onClick={() => removeMaterial(material)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag"
                onKeyPress={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), addTag())
                }
              />
              <Button type="button" onClick={addTag} variant="outline">
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
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
            <Button type="submit" disabled={loading || !isFormValid()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create Work Order' : 'Update Work Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
