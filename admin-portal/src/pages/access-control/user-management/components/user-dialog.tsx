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

  const validateForm = (): string | null => {
    const { name, email, password, confirmPassword } = formData;
    
    if (!name.trim()) {
      return 'Name is required';
    }
    
    if (!email.trim()) {
      return 'Email is required';
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    
    // If it's add mode or password is provided, validate it
    if (!isEditMode || password) {
      if (!password) {
        return isEditMode ? '' : 'Password is required';
      }
      
      if (password.length < 6) {
        return 'Password must be at least 6 characters long';
      }
      
      if (password !== confirmPassword) {
        return 'Passwords do not match';
      }
    }
    
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
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
        userData.id = typeof formData.id === 'number' ? formData.id.toString() : formData.id;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !validateForm()) {
            e.preventDefault();
            handleSave();
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
              autoFocus
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <Input
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
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
            disabled={!!validateForm() || isSubmitting}
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