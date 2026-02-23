import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { menuService, type MenuItem } from '@/services/modules/menu';
import { toast } from 'sonner';

interface MenuFormData {
  id?: string | number;
  id_str?: string;
  menu_id?: string | number;
  parent_id?: string | number | null;
  title: string;
  translate?: string;
  menu_type?: string;
  type?: string;
  icon?: string;
  url?: string;
  badge?: string;
  target?: string;
  exact?: boolean;
  auth?: string;
  parameters?: Record<string, any>;
  is_visible?: boolean;
  sequence_no?: number;
}

interface MenuFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menu?: MenuFormData;
  parentId?: string | number | null;
  onSave: (menu: MenuItem) => void;
  parents: MenuItem[];
}

export function MenuForm({ open, onOpenChange, menu, parentId, onSave, parents }: MenuFormProps) {
  const isEditMode = menu && menu.id !== undefined;
  const dialogTitle = isEditMode ? 'Edit Menu Item' : 'Add New Menu Item';
  
  const [formData, setFormData] = useState<MenuFormData>({
    id: undefined,
    id_str: undefined,
    menu_id: undefined,
    parent_id: parentId || null,
    title: '',
    translate: '',
    menu_type: 'admin_template',
    type: 'item',
    icon: '',
    url: '',
    badge: '',
    target: '_self',
    exact: false,
    auth: '',
    parameters: {},
    is_visible: true,
    sequence_no: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when menu prop changes
  useEffect(() => {
    if (menu) {
      setFormData({
        id: menu.id,
        id_str: menu.id_str || '',
        menu_id: menu.menu_id,
        parent_id: menu.parent_id || parentId || null,
        title: menu.title,
        translate: menu.translate || '',
        menu_type: menu.menu_type || 'admin_template',
        type: menu.type || 'item',
        icon: menu.icon || '',
        url: menu.url || '',
        badge: menu.badge || '',
        target: menu.target || '_self',
        exact: menu.exact || false,
        auth: menu.auth || '',
        parameters: menu.parameters || {},
        is_visible: menu.is_visible !== undefined ? menu.is_visible : true,
        sequence_no: menu.sequence_no || 0
      });
    } else {
      // Reset form when menu is undefined
      setFormData({
        id: undefined,
        id_str: undefined,
        menu_id: undefined,
        parent_id: parentId || null,
        title: '',
        translate: '',
        menu_type: 'admin_template',
        type: 'item',
        icon: '',
        url: '',
        badge: '',
        target: '_self',
        exact: false,
        auth: '',
        parameters: {},
        is_visible: true,
        sequence_no: 0
      });
    }
  }, [menu, parentId]);

  const validateForm = (): boolean => {
    const { id_str, title, type, url } = formData;
    let isValid = true;
    const newErrors: Record<string, string> = {};

    if (!isEditMode && (!id_str || !String(id_str).trim())) {
      newErrors.id_str = 'Menu ID is required';
      isValid = false;
    }

    if (!title.trim()) {
      newErrors.title = 'Menu title is required';
      isValid = false;
    }

    // Only require URL for 'item' type, not for 'group', 'heading', or 'external'
    if (type === 'item' && (!url || !url.trim())) {
      newErrors.url = 'Menu URL is required';
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

      // Prepare menu data
      const menuData: MenuItem = {
        ...formData,
        parent_id: formData.parent_id || null,
        exact: formData.exact || false,
        is_visible: formData.is_visible !== undefined ? formData.is_visible : true,
        sequence_no: formData.sequence_no || 0,
        parameters: formData.parameters || {}
      };

      // Save the menu
      const response = await menuService.saveMenu(menuData);

      if (response.success && response.data) {
        // Success response - show API message or custom message
        const successMessage = response.message ||
          (isEditMode ? `Menu "${formData.title}" updated successfully` : `Menu "${formData.title}" created successfully`);
        toast.success(successMessage);

        // Call the onSave callback with the saved menu
        onSave(response.data);
        
        // Close the dialog
        onOpenChange(false);
      } else {
        // Failure response - show API message or custom message
        const errorMessage = response.message ||
          (isEditMode ? 'Failed to update menu' : 'Failed to create menu');
        toast.error(errorMessage);
        // Keep modal open for user to correct input
      }
    } catch (error) {
      console.error('Error saving menu:', error);
      // In case of exception, show error but don't close modal
      toast.error(`${isEditMode ? 'Failed to update menu' : 'Failed to create menu'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof MenuFormData, value: string | number | boolean | Record<string, any> | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // const handleParameterChange = (key: string, value: any) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     parameters: {
  //       ...prev.parameters,
  //       [key]: value
  //     }
  //   }));
  // };

  // Function to validate specific field
  const validateField = (field: keyof typeof errors, value: string) => {
    const newErrors = { ...errors };

    if (field === 'id_str' && !isEditMode && !value.trim()) {
      newErrors.id_str = 'Menu ID is required';
    } else if (field === 'title' && !value.trim()) {
      newErrors.title = 'Menu title is required';
    } else if (field === 'url' && formData.type === 'item' && !value.trim()) {
      newErrors.url = 'Menu URL is required';
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
      >
        <div className="relative flex-1 flex flex-col overflow-hidden">
          <DialogHeader className="sticky top-0 bg-background z-[50] py-4 px-6 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>{dialogTitle}</DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Parent Menu</Label>
              <Select
                value={formData.parent_id ? String(formData.parent_id) : 'null'}
                onValueChange={(value) => handleInputChange('parent_id', value === 'null' ? null : value)}
              >
                <SelectTrigger className={errors.parent_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select parent menu (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">No Parent (Top Level)</SelectItem>
                  {parents.filter(p => !menu || String(p.id) !== String(menu.id)).map(parent => (
                    <SelectItem key={parent.id} value={String(parent.id)}>
                      {parent.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">ID *</Label>
              <Input
                placeholder="Enter menu ID (e.g., dashboard-menu)"
                value={formData.id_str ? String(formData.id_str) : ''}
                onChange={(e) => {
                  handleInputChange('id_str', e.target.value);
                  if (errors.id_str) {
                    validateField('id_str', e.target.value);
                  }
                }}
                onBlur={() => validateField('id_str', formData.id_str ? String(formData.id_str) : '')}
                className={errors.id_str ? 'border-red-500' : ''}
              />
              {errors.id_str && <p className="text-red-500 text-xs mt-1">{errors.id_str}</p>}
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">Menu Title *</Label>
              <Input
                placeholder="Enter menu title"
                value={formData.title}
                onChange={(e) => {
                  handleInputChange('title', e.target.value);
                  if (errors.title) {
                    validateField('title', e.target.value);
                  }
                }}
                onBlur={() => validateField('title', formData.title)}
                autoFocus={!isEditMode}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">URL {formData.type === 'item' ? '*' : ''}</Label>
              <Input
                placeholder="Enter menu URL (e.g., /dashboard)"
                value={formData.url || ''}
                onChange={(e) => {
                  handleInputChange('url', e.target.value);
                  if (errors.url) {
                    validateField('url', e.target.value);
                  }
                }}
                onBlur={() => validateField('url', formData.url || '')}
                className={errors.url ? 'border-red-500' : ''}
              />
              {errors.url && <p className="text-red-500 text-xs mt-1">{errors.url}</p>}
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">Translate Key</Label>
              <Input
                placeholder="Enter translation key"
                value={formData.translate || ''}
                onChange={(e) => handleInputChange('translate', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Menu Type</Label>
                <Select
                  value={formData.menu_type || 'admin_template'}
                  onValueChange={(value) => handleInputChange('menu_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin_template">Admin Template</SelectItem>
                    <SelectItem value="app">App</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="navigation">Navigation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-1.5 block">Type</Label>
                <Select
                  value={formData.type || 'item'}
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="item">Item</SelectItem>
                    <SelectItem value="heading">Heading</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Icon</Label>
                <Input
                  placeholder="Enter icon name"
                  value={formData.icon || ''}
                  onChange={(e) => handleInputChange('icon', e.target.value)}
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-1.5 block">Badge</Label>
                <Input
                  placeholder="Enter badge text"
                  value={formData.badge || ''}
                  onChange={(e) => handleInputChange('badge', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Target</Label>
                <Select
                  value={formData.target || '_self'}
                  onValueChange={(value) => handleInputChange('target', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_self">Self</SelectItem>
                    <SelectItem value="_blank">Blank</SelectItem>
                    <SelectItem value="_parent">Parent</SelectItem>
                    <SelectItem value="_top">Top</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-1.5 block">Sequence Number</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter sequence number"
                  value={formData.sequence_no || 0}
                  onChange={(e) => handleInputChange('sequence_no', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">Authorization</Label>
              <Input
                placeholder="Enter authorization requirements"
                value={formData.auth || ''}
                onChange={(e) => handleInputChange('auth', e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="exact"
                checked={!!formData.exact}
                onCheckedChange={(checked) => handleInputChange('exact', checked)}
              />
              <Label htmlFor="exact" className="text-sm font-medium">
                Exact Match
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_visible"
                checked={formData.is_visible !== undefined ? formData.is_visible : true}
                onCheckedChange={(checked) => handleInputChange('is_visible', checked)}
              />
              <Label htmlFor="is_visible" className="text-sm font-medium">
                Visible
              </Label>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">Parameters (JSON)</Label>
              <Textarea
                placeholder='Enter parameters as JSON (e.g., {"key": "value"})'
                value={JSON.stringify(formData.parameters || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleInputChange('parameters', parsed);
                  } catch (error) {
                    // If JSON is invalid, we could show an error, but for simplicity we'll just ignore
                  }
                }}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-background z-[50] py-4 px-6 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  {isEditMode ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  {isEditMode ? 'Update Menu' : 'Add Menu'}
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}