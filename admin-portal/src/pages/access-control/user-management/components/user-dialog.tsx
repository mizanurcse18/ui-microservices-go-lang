import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { CircleCheck, Eye, EyeOff, Plus, Save, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { userService } from '@/services/modules/user';

interface UserData {
  id: number | string;
  name: string;
  email: string;
  password?: string;
  confirmPassword?: string;
}

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserData;
  onSave?: (userData: UserData) => void;
  onRefresh?: () => void;
}

export function UserDialog({ open, onOpenChange, user, onSave, onRefresh }: UserDialogProps) {
  const isEditMode = user && (typeof user.id === 'number' ? user.id > 0 : parseInt(user.id) > 0);
  const dialogTitle = isEditMode ? 'Edit User' : 'Add New User';
  
  const [formData, setFormData] = useState<UserData>({
    id: 0,
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Update form data when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id,
        name: user.name,
        email: user.email,
        password: '',
        confirmPassword: ''
      });
    } else {
      setFormData({
        id: 0,
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const validateForm = (): boolean => {
    const { name, email, password, confirmPassword } = formData;
    let isValid = true;
    const newErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Invalid email format';
        isValid = false;
      }
    }
    
    // If it's add mode or password is provided, validate it
    if (!isEditMode || password) {
      if (!password) {
        newErrors.password = isEditMode ? '' : 'Password is required';
        if (!isEditMode) {
          isValid = false;
        }
      } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters long';
        isValid = false;
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
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
      
      // Prepare user data - include ID for updates, exclude for creates
      const userData: any = {
        name: formData.name,
        email: formData.email
      };
      
      // Include ID for update operations
      if (isEditMode && formData.id) {
        userData.id = typeof formData.id === 'number' ? formData.id : parseInt(formData.id as string, 10);
      }
      
      // Include password only if provided
      if (formData.password) {
        userData.password = formData.password;
      }
      
      // Single API call for both create and update
      const response = await userService.saveUser(userData);
      console.log('User save response:', response);
      
      // Handle response based on status
      if (response.success && response.data) {
        // Success response - show API message or custom message
        const successMessage = response.message || 
          (isEditMode ? `User "${formData.name}" updated successfully` : `User "${formData.name}" created successfully`);
        toast.success(successMessage);
        
        // Call refresh function if provided
        if (onRefresh) {
          onRefresh();
        }
        
        // Reset form and close modal
        setFormData({ id: 0, name: '', email: '', password: '', confirmPassword: '' });
        setShowPassword(false);
        setShowConfirmPassword(false);
        onOpenChange(false);
      } else {
        // Failure response - show API message or custom message
        const errorMessage = response.message || 
          (isEditMode ? 'Failed to update user' : 'Failed to create user');
        toast.error(errorMessage);
        // Keep modal open for user to correct input
      }
    } catch (error) {
      console.error('Error saving user:', error);
      // In case of exception, show error but don't close modal
      toast.error(`${isEditMode ? 'Failed to update user' : 'Failed to create user'} (N/A)`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof UserData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Function to validate on blur
  const validateOnBlur = () => {
    validateForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
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
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Name</label>
            <Input
              placeholder="Enter user name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onBlur={validateOnBlur}
              autoFocus
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <Input
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onBlur={validateOnBlur}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {isEditMode ? 'New Password (optional)' : 'Password'}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={isEditMode ? "Enter new password (leave blank to keep current)" : "Enter password"}
                value={formData.password || ''}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onBlur={validateOnBlur}
                className={errors.password ? 'border-red-500' : ''}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            {isEditMode && (
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to keep the current password
              </p>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {isEditMode ? 'Confirm New Password (optional)' : 'Confirm Password'}
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder={isEditMode ? "Confirm new password" : "Confirm password"}
                value={formData.confirmPassword || ''}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                onBlur={validateOnBlur}
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>
        </div>
        <DialogFooter>
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
                {isEditMode ? 'Update User' : 'Add User'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}