import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Badge } from "@/src/components/ui/badge";
import { X } from "lucide-react";
import {
  MaintenanceScheduleCreate,
  MaintenanceType,
  MaintenancePriority,
  MaintenanceCategory,
  EquipmentResponse,
} from "@/src/models/maintenance";
import { maintenanceService } from "@/src/services/MaintenanceService";

interface MaintenanceScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduleCreated: () => void;
}

export function MaintenanceScheduleDialog({
  open,
  onOpenChange,
  onScheduleCreated,
}: MaintenanceScheduleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [equipment, setEquipment] = useState<EquipmentResponse[]>([]);
  const [formData, setFormData] = useState<Partial<MaintenanceScheduleCreate>>({
    title: "",
    description: "",
    maintenance_type: MaintenanceType.PREVENTIVE,
    priority: MaintenancePriority.MEDIUM,
    category: MaintenanceCategory.GENERAL,
    equipment_id: "",
    location: "",
    scheduled_date: "",
    estimated_duration_hours: 1,
    estimated_cost: 0,
    required_parts: [],
    required_tools: [],
    safety_requirements: [],
    maintenance_procedures: [],
    tags: [],
  });

  const [newPart, setNewPart] = useState("");
  const [newTool, setNewTool] = useState("");
  const [newSafetyReq, setNewSafetyReq] = useState("");
  const [newProcedure, setNewProcedure] = useState("");
  const [newTag, setNewTag] = useState("");

  // Fetch equipment list when dialog opens
  useEffect(() => {
    if (open) {
      fetchEquipment();
    }
  }, [open]);

  const fetchEquipment = async () => {
    try {
      const equipmentList = await maintenanceService.getEquipmentList(0, 100);
      setEquipment(equipmentList);
    } catch (error) {
      console.error("Failed to fetch equipment:", error);
    }
  };

  const handleInputChange = (
    field: keyof MaintenanceScheduleCreate,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addArrayItem = (
    field: keyof MaintenanceScheduleCreate,
    value: string,
    setter: (value: string) => void
  ) => {
    if (value.trim()) {
      const currentArray = (formData[field] as string[]) || [];
      handleInputChange(field, [...currentArray, value.trim()]);
      setter("");
    }
  };

  const removeArrayItem = (
    field: keyof MaintenanceScheduleCreate,
    index: number
  ) => {
    const currentArray = (formData[field] as string[]) || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    handleInputChange(field, newArray);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.equipment_id || !formData.scheduled_date) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      
      // Prepare data for submission - convert empty strings to null for optional fields
      const submitData = {
        ...formData,
        description: formData.description || null,
        location: formData.location || null,
        assigned_technician_id: formData.assigned_technician_id || null,
      };

      await maintenanceService.createMaintenanceSchedule(submitData as MaintenanceScheduleCreate);
      onScheduleCreated();
      onOpenChange(false);
      // Reset form
      setFormData({
        title: "",
        description: "",
        maintenance_type: MaintenanceType.PREVENTIVE,
        priority: MaintenancePriority.MEDIUM,
        category: MaintenanceCategory.GENERAL,
        equipment_id: "",
        location: "",
        scheduled_date: "",
        estimated_duration_hours: 1,
        estimated_cost: 0,
        required_parts: [],
        required_tools: [],
        safety_requirements: [],
        maintenance_procedures: [],
        tags: [],
      });
    } catch (error) {
      console.error("Failed to create maintenance schedule:", error);
      alert("Failed to create maintenance schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Maintenance Schedule</DialogTitle>
          <DialogDescription>
            Schedule a new maintenance task for your equipment
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter maintenance schedule title"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe the maintenance task"
                rows={3}
              />
            </div>
          </div>

          {/* Maintenance Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="maintenance_type">Maintenance Type *</Label>
              <Select
                value={formData.maintenance_type}
                onValueChange={(value) => handleInputChange("maintenance_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MaintenanceType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MaintenancePriority).map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
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
              <Label htmlFor="equipment_id">Equipment *</Label>
              <Select
                value={formData.equipment_id}
                onValueChange={(value) => handleInputChange("equipment_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.name} - {eq.model || "No Model"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Schedule and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="scheduled_date">Scheduled Date *</Label>
              <Input
                id="scheduled_date"
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => handleInputChange("scheduled_date", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="estimated_duration_hours">Duration (hours)</Label>
              <Input
                id="estimated_duration_hours"
                type="number"
                min="0.5"
                step="0.5"
                value={formData.estimated_duration_hours}
                onChange={(e) => handleInputChange("estimated_duration_hours", parseFloat(e.target.value))}
              />
            </div>
          </div>

          {/* Location and Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="Maintenance location"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="estimated_cost">Estimated Cost ($)</Label>
              <Input
                id="estimated_cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.estimated_cost}
                onChange={(e) => handleInputChange("estimated_cost", parseFloat(e.target.value))}
              />
            </div>
          </div>

          {/* Arrays - Required Parts */}
          <div className="grid gap-2">
            <Label>Required Parts</Label>
            <div className="flex gap-2">
              <Input
                value={newPart}
                onChange={(e) => setNewPart(e.target.value)}
                placeholder="Add required part"
                onKeyPress={(e) => e.key === "Enter" && addArrayItem("required_parts", newPart, setNewPart)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayItem("required_parts", newPart, setNewPart)}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData.required_parts || []).map((part, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {part}
                  <button
                    type="button"
                    onClick={() => removeArrayItem("required_parts", index)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Arrays - Required Tools */}
          <div className="grid gap-2">
            <Label>Required Tools</Label>
            <div className="flex gap-2">
              <Input
                value={newTool}
                onChange={(e) => setNewTool(e.target.value)}
                placeholder="Add required tool"
                onKeyPress={(e) => e.key === "Enter" && addArrayItem("required_tools", newTool, setNewTool)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayItem("required_tools", newTool, setNewTool)}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData.required_tools || []).map((tool, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tool}
                  <button
                    type="button"
                    onClick={() => removeArrayItem("required_tools", index)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Arrays - Safety Requirements */}
          <div className="grid gap-2">
            <Label>Safety Requirements</Label>
            <div className="flex gap-2">
              <Input
                value={newSafetyReq}
                onChange={(e) => setNewSafetyReq(e.target.value)}
                placeholder="Add safety requirement"
                onKeyPress={(e) => e.key === "Enter" && addArrayItem("safety_requirements", newSafetyReq, setNewSafetyReq)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayItem("safety_requirements", newSafetyReq, setNewSafetyReq)}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData.safety_requirements || []).map((req, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {req}
                  <button
                    type="button"
                    onClick={() => removeArrayItem("safety_requirements", index)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Arrays - Maintenance Procedures */}
          <div className="grid gap-2">
            <Label>Maintenance Procedures</Label>
            <div className="flex gap-2">
              <Input
                value={newProcedure}
                onChange={(e) => setNewProcedure(e.target.value)}
                placeholder="Add maintenance procedure"
                onKeyPress={(e) => e.key === "Enter" && addArrayItem("maintenance_procedures", newProcedure, setNewProcedure)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayItem("maintenance_procedures", newProcedure, setNewProcedure)}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData.maintenance_procedures || []).map((procedure, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {procedure}
                  <button
                    type="button"
                    onClick={() => removeArrayItem("maintenance_procedures", index)}
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
                onKeyPress={(e) => e.key === "Enter" && addArrayItem("tags", newTag, setNewTag)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayItem("tags", newTag, setNewTag)}
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
                    onClick={() => removeArrayItem("tags", index)}
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
              {loading ? "Creating..." : "Create Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
