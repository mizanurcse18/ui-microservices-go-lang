import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Plus, Save, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { roleService } from '@/services/modules/role';

interface RoleData {
  id?: string | number;
  name: string;
  description: string;
}

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: RoleData;
  onRefresh?: () => void;
}

export function RoleDialog({ open, onOpenChange, role, onRefresh }: RoleDialogProps) {
  const isEditMode = role && role.id !== undefined && Number(role.id) > 0;
  const dialogTitle = isEditMode ? 'Edit Role' : 'Add New Role';
  
  const [formData, setFormData] = useState<RoleData>({
    name: '',
    description: ''
  });
  
  const [errors, setErrors] = useState({
    name: '',
    description: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update form data when role prop changes
  useEffect(() => {
    if (role) {
      setFormData({
        id: role.id,
        name: role.name,
        description: role.description
      });
    } else {
      setFormData({
        name: '',
        description: ''
      });
    }
  }, [role]);
  
  const validateForm = (): boolean => {
    const { name, description } = formData;
    let isValid = true;
    const newErrors = {
      name: '',
      description: ''
    };
    
    if (!name.trim()) {
      newErrors.name = 'Role name is required';
      isValid = false;
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSave = async () => {
    const isValid = validateForm();
    if (!isValid) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Prepare role data (application_id and company_id will be set by backend)
      const roleData: any = {
        name: formData.name,
        description: formData.description
      };
      
      // Include ID for update operations
      if (isEditMode && formData.id) {
        roleData.id = Number(formData.id);
      }
      
      // Single API call for both create and update
      const response = await roleService.saveRole(roleData);
      console.log('Role save response:', response);
      
      // Handle response based on status
      if (response.success && response.data) {
        // Success response - show API message or custom message
        const successMessage = response.message || 
          (isEditMode ? `Role "${formData.name}" updated successfully` : `Role "${formData.name}" created successfully`);
        toast.success(successMessage);
        
        // Call refresh function if provided
        if (onRefresh) {
          onRefresh();
        }
        
        // Reset form and close modal
        setFormData({ 
          name: '', 
          description: ''
        });
        onOpenChange(false);
      } else {
        // Failure response - show API message or custom message
        const errorMessage = response.message || 
          (isEditMode ? 'Failed to update role' : 'Failed to create role');
        toast.error(errorMessage);
        // Keep modal open for user to correct input
      }
    } catch (error) {
      console.error('Error saving role:', error);
      // In case of exception, show error but don't close modal
      toast.error(`${isEditMode ? 'Failed to update role' : 'Failed to create role'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleInputChange = (field: keyof RoleData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  

  
  // Function to validate specific field
  const validateField = (field: keyof typeof errors, value: string) => {
    const newErrors = { ...errors };
    
    if (field === 'name' && !value.trim()) {
      newErrors.name = 'Role name is required';
    } else if (field === 'description' && !value.trim()) {
      newErrors.description = 'Description is required';
    } else {
      newErrors[field] = '';
    }
    
    setErrors(newErrors);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            const isValid = validateForm();
            if (isValid) {
              handleSave();
            }
          }
        }}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="relative flex-1 flex flex-col overflow-hidden">
          <DialogHeader className="sticky top-0 bg-background z-[50] py-4 px-6 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>{dialogTitle}</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="absolute right-4 top-4 h-6 w-6 rounded-full p-0 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Role Name *</Label>
              <Input
                placeholder="Enter role name"
                value={formData.name}
                onChange={(e) => {
                  handleInputChange('name', e.target.value);
                  if (errors.name) {
                    validateField('name', e.target.value);
                  }
                }}
                onBlur={() => validateField('name', formData.name)}
                autoFocus
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Description *</Label>
              <Textarea
                placeholder="Enter role description"
                value={formData.description}
                onChange={(e) => {
                  handleInputChange('description', e.target.value);
                  if (errors.description) {
                    validateField('description', e.target.value);
                  }
                }}
                onBlur={() => validateField('description', formData.description)}
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
            

          </div>
          
          <DialogFooter className="sticky bottom-0 bg-background z-[50] py-4 px-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSave} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  {isEditMode ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {isEditMode ? 'Update Role' : 'Add Role'}
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}