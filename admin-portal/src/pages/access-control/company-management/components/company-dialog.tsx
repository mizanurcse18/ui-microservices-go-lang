import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { CircleCheck, Eye, EyeOff, Plus, Save, X, Loader2, Calendar, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { GenericCombobox } from '@/components/ui/generic-combobox';
import { Switch } from '@/components/ui/switch';
import { companyService } from '@/services/modules/company';

interface CompanyData {
  id: number | string;
  name: string;
  domain: string;
  category: string;
  seq_no: number;
  is_default: boolean;
  status: string;
  company_status: string;
  address: string;
  tin: string;
  bin: string;
  company_logo_path: string | File;
  email: string;
  employee_range: string;
  funded: number;
}

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: CompanyData;
  onRefresh?: () => void;
}

export function CompanyDialog({ open, onOpenChange, company, onRefresh }: CompanyDialogProps) {
  const isEditMode = company && (typeof company.id === 'number' ? company.id > 0 : parseInt(company.id) > 0);
  const dialogTitle = isEditMode ? 'Edit Company' : 'Add New Company';
  
  const [formData, setFormData] = useState<CompanyData>({
    id: 0,
    name: '',
    domain: '',
    category: '',
    seq_no: 0,
    is_default: false,
    status: 'active',
    company_status: 'pending',
    address: '',
    tin: '',
    bin: '',
    company_logo_path: '',
    email: '',
    employee_range: '',
    funded: new Date().getFullYear()
  });
  
  const [errors, setErrors] = useState({
    name: '',
    domain: '',
    category: '',
    seq_no: '',
    email: '',
    tin: '',
    bin: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoInputMode, setLogoInputMode] = useState<'upload' | 'url'>('upload');
  
  // Generate year options for the select dropdown
  const generateYearOptions = () => {
    return Array.from({ length: 120 }, (_, i) => {
      const year = 2025 - i;
      return { value: year.toString(), label: year.toString() };
    });
  };

  // Update form data when company prop changes
  useEffect(() => {
    if (company) {
      setFormData({
        id: company.id,
        name: company.name,
        domain: company.domain,
        category: company.category,
        seq_no: company.seq_no,
        is_default: company.is_default,
        status: company.status,
        company_status: company.company_status,
        address: company.address,
        tin: company.tin,
        bin: company.bin,
        company_logo_path: company.company_logo_path,
        email: company.email,
        employee_range: company.employee_range,
        funded: company.funded
      });
      // Set initial logo preview if there's an existing logo path
      if (company.company_logo_path && typeof company.company_logo_path === 'string') {
        setLogoPreview(company.company_logo_path);
        // Set the input mode based on whether the logo path looks like a URL
        setLogoInputMode(company.company_logo_path.startsWith('http') ? 'url' : 'upload');
      } else if (company.company_logo_path instanceof File) {
        setLogoInputMode('upload');
      }
    } else {
      setFormData({
        id: 0,
        name: '',
        domain: '',
        category: '',
        seq_no: 0,
        is_default: false,
        status: 'active',
        company_status: 'pending',
        address: '',
        tin: '',
        bin: '',
        company_logo_path: '',
        email: '',
        employee_range: '',
        funded: new Date().getFullYear()
      });
      setLogoPreview(null);
      setLogoInputMode('upload');
    }
  }, [company]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit');
        return;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        // Store the file in state for later upload
        setFormData(prev => ({
          ...prev,
          company_logo_path: file // Store the actual File object
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle URL change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({
      ...prev,
      company_logo_path: url
    }));
    
    // Update preview if it's a valid image URL
    if (url && url.startsWith('http')) {
      setLogoPreview(url);
    } else {
      setLogoPreview(null);
    }
  };

  const validateForm = (): boolean => {
    const { name, domain, category, seq_no, email, tin, bin } = formData;
    let isValid = true;
    const newErrors = {
      name: '',
      domain: '',
      category: '',
      seq_no: '',
      email: '',
      tin: '',
      bin: ''
    };
    
    if (!name.trim()) {
      newErrors.name = 'Company name is required';
      isValid = false;
    }
    
    if (!domain.trim()) {
      newErrors.domain = 'Domain is required';
      isValid = false;
    } else {
      // Enhanced domain validation supporting multi-level domains like .com.bd
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/;
      if (!domainRegex.test(domain)) {
        newErrors.domain = 'Invalid domain format';
        isValid = false;
      }
    }
    
    if (!category) {
      newErrors.category = 'Category is required';
      isValid = false;
    }
    
    if (seq_no === null || seq_no === undefined || seq_no < 0) {
      newErrors.seq_no = 'Sequence number must be a positive number';
      isValid = false;
    }
    
    if (email && email.trim()) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Invalid email format';
        isValid = false;
      }
    }
    
    if (tin && tin.trim() && tin.length < 5) {
      newErrors.tin = 'TIN must be at least 5 characters';
      isValid = false;
    }
    
    if (bin && bin.trim() && bin.length < 5) {
      newErrors.bin = 'BIN must be at least 5 characters';
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
      
      // Debug: Log form data before processing
      console.log('Form data before submission:', formData);
      console.log('is_default in formData:', formData.is_default, 'type:', typeof formData.is_default);
      
      // Prepare company data
      const companyData: any = {
        name: formData.name,
        domain: formData.domain,
        category: formData.category,
        seq_no: formData.seq_no,
        is_default: formData.is_default,
        status: formData.status,
        company_status: formData.company_status,
        address: formData.address,
        tin: formData.tin,
        bin: formData.bin,
        email: formData.email,
        employee_range: formData.employee_range,
        funded: formData.funded
      };
      
      // Explicitly ensure is_default is always boolean and present
      companyData.is_default = Boolean(formData.is_default);
      console.log('After explicit boolean conversion - is_default:', companyData.is_default, 'type:', typeof companyData.is_default);
      
      // Handle logo path - if it's a File, we would need to upload it separately
      // For now, we'll send the string value if it exists
      if (typeof formData.company_logo_path === 'string') {
        companyData.company_logo_path = formData.company_logo_path;
      } else {
        // In a real implementation, we would upload the file here and get the actual path
        // For now, we'll skip sending the logo path since we can't upload the file
        companyData.company_logo_path = '';
      }
      
      // Include ID for update operations
      if (isEditMode && formData.id) {
        companyData.id = typeof formData.id === 'number' ? formData.id : parseInt(formData.id as string, 10);
      }
      
      // Debug: Log the company data being sent
      console.log('Company data being sent:', companyData);
      console.log('is_default value:', companyData.is_default, 'type:', typeof companyData.is_default);
      
      // Single API call for both create and update
      const response = await companyService.saveCompany(companyData);
      console.log('Company save response:', response);
      
      // Handle response based on status
      if (response.success && response.data) {
        // Success response - show API message or custom message
        const successMessage = response.message || 
          (isEditMode ? `Company "${formData.name}" updated successfully` : `Company "${formData.name}" created successfully`);
        toast.success(successMessage);
        
        // Call refresh function if provided
        if (onRefresh) {
          onRefresh();
        }
        
        // Reset form and close modal
        setFormData({ 
          id: 0, 
          name: '', 
          domain: '',
          category: '',
          seq_no: 0,
          is_default: false,
          status: 'active',
          company_status: 'pending',
          address: '',
          tin: '',
          bin: '',
          company_logo_path: '',
          email: '',
          employee_range: '',
          funded: new Date().getFullYear()
        });
        onOpenChange(false);
      } else {
        // Failure response - show API message or custom message
        const errorMessage = response.message || 
          (isEditMode ? 'Failed to update company' : 'Failed to create company');
        toast.error(errorMessage);
        // Keep modal open for user to correct input
      }
    } catch (error) {
      console.error('Error saving company:', error);
      // In case of exception, show error but don't close modal
      toast.error(`${isEditMode ? 'Failed to update company' : 'Failed to create company'} (N/A)`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CompanyData, value: string | number | boolean | File) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Function to validate on blur
  const validateOnBlur = () => {
    validateForm();
  };

  // Function to validate specific field
  const validateField = (field: keyof typeof errors, value: string) => {
    const newErrors = { ...errors };
    
    if (field === 'domain') {
      if (!value.trim()) {
        newErrors.domain = 'Domain is required';
      } else {
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/;
        if (!domainRegex.test(value)) {
          newErrors.domain = 'Invalid domain format';
        } else {
          newErrors.domain = '';
        }
      }
    } else if (field === 'email' && value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        newErrors.email = 'Invalid email format';
      } else {
        newErrors.email = '';
      }
    } else if (field === 'tin' && value.trim() && value.length < 5) {
      newErrors.tin = 'TIN must be at least 5 characters';
    } else if (field === 'bin' && value.trim() && value.length < 5) {
      newErrors.bin = 'BIN must be at least 5 characters';
    } else if (field === 'name' && !value.trim()) {
      newErrors.name = 'Company name is required';
    } else if (field === 'seq_no' && (value === '' || parseInt(value) < 0)) {
      newErrors.seq_no = 'Sequence number must be a positive number';
    } else {
      newErrors[field] = '';
    }
    
    setErrors(newErrors);
  };

  // Category options
  const categoryOptions = [
    { value: 'b2b', label: 'B2B' },
    { value: 'b2c', label: 'B2C' },
    { value: 'government', label: 'Government' },
    { value: 'non-profit', label: 'Non-Profit' },
    { value: 'education', label: 'Education' },
    { value: 'healthcare', label: 'Healthcare' }
  ];

  // Status options
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  // Company status options
  const companyStatusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  // Employee range options
  const employeeRangeOptions = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-100', label: '51-100 employees' },
    { value: '101-500', label: '101-500 employees' },
    { value: '501-1000', label: '501-1000 employees' },
    { value: '1000+', label: '1000+ employees' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Company Name *</Label>
                <Input
                  placeholder="Enter company name"
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
                <Label className="text-sm font-medium mb-1.5 block">Domain *</Label>
                <Input
                  placeholder="Enter domain (e.g., company.com or paystation.com.bd)"
                  value={formData.domain}
                  onChange={(e) => handleInputChange('domain', e.target.value)}
                  className={errors.domain ? 'border-red-500' : ''}
                />
                {errors.domain && <p className="text-red-500 text-xs mt-1">{errors.domain}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <GenericCombobox
                  label="Category *"
                  value={formData.category}
                  onChange={(value) => handleInputChange('category', value as string)}
                  options={categoryOptions.map(option => ({ id: option.value, name: option.label }))}
                  placeholder="Select category"
                  error={errors.category}
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Sequence Number *</Label>
                <Input
                  type="number"
                  placeholder="Enter sequence number"
                  value={formData.seq_no || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('seq_no', value === '' ? 0 : parseInt(value) || 0);
                    if (errors.seq_no && (value === '' || parseInt(value) < 0)) {
                      validateField('seq_no', value);
                    } else if (value !== '' && parseInt(value) >= 0) {
                      setErrors(prev => ({ ...prev, seq_no: '' }));
                    }
                  }}
                  onBlur={() => validateField('seq_no', formData.seq_no.toString())}
                  className={errors.seq_no ? 'border-red-500' : ''}
                />
                {errors.seq_no && <p className="text-red-500 text-xs mt-1">{errors.seq_no}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <GenericCombobox
                  label="Status"
                  value={formData.status}
                  onChange={(value) => handleInputChange('status', value as string)}
                  options={statusOptions.map(option => ({ id: option.value, name: option.label }))}
                  placeholder="Select status"
                />
              </div>
              
              <div>
                <GenericCombobox
                  label="Company Status"
                  value={formData.company_status}
                  onChange={(value) => handleInputChange('company_status', value as string)}
                  options={companyStatusOptions.map(option => ({ id: option.value, name: option.label }))}
                  placeholder="Select company status"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Email</Label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => {
                    handleInputChange('email', e.target.value);
                    if (errors.email && e.target.value.trim()) {
                      validateField('email', e.target.value);
                    } else if (!e.target.value.trim()) {
                      setErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  onBlur={() => validateField('email', formData.email)}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              
              <div>
                <GenericCombobox
                  label="Employee Range"
                  value={formData.employee_range}
                  onChange={(value) => handleInputChange('employee_range', value as string)}
                  options={employeeRangeOptions.map(option => ({ id: option.value, name: option.label }))}
                  placeholder="Select employee range"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">TIN</Label>
                <Input
                  placeholder="Enter TIN"
                  value={formData.tin}
                  onChange={(e) => {
                    handleInputChange('tin', e.target.value);
                    if (errors.tin && e.target.value.trim()) {
                      validateField('tin', e.target.value);
                    } else if (!e.target.value.trim()) {
                      setErrors(prev => ({ ...prev, tin: '' }));
                    }
                  }}
                  onBlur={() => validateField('tin', formData.tin)}
                  className={errors.tin ? 'border-red-500' : ''}
                />
                {errors.tin && <p className="text-red-500 text-xs mt-1">{errors.tin}</p>}
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-1.5 block">BIN</Label>
                <Input
                  placeholder="Enter BIN"
                  value={formData.bin}
                  onChange={(e) => {
                    handleInputChange('bin', e.target.value);
                    if (errors.bin && e.target.value.trim()) {
                      validateField('bin', e.target.value);
                    } else if (!e.target.value.trim()) {
                      setErrors(prev => ({ ...prev, bin: '' }));
                    }
                  }}
                  onBlur={() => validateField('bin', formData.bin)}
                  className={errors.bin ? 'border-red-500' : ''}
                />
                {errors.bin && <p className="text-red-500 text-xs mt-1">{errors.bin}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <GenericCombobox
                  label="Funded Year"
                  value={formData.funded.toString()}
                  onChange={(value) => handleInputChange('funded', parseInt(value as string))}
                  options={generateYearOptions().map(option => ({ id: option.value, name: option.label }))}
                  placeholder="Select or search for year"
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => handleInputChange('is_default', checked as boolean)}
                />
                <Label htmlFor="is_default">Set as Default Company</Label>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Company Logo</Label>
              
              {/* Toggle between Upload and URL */}
              <div className="flex space-x-4 mb-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="logo-upload-option"
                    name="logo-input-mode"
                    checked={logoInputMode === 'upload'}
                    onChange={() => setLogoInputMode('upload')}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="logo-upload-option" className="text-sm">Upload</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="logo-url-option"
                    name="logo-input-mode"
                    checked={logoInputMode === 'url'}
                    onChange={() => setLogoInputMode('url')}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="logo-url-option" className="text-sm">URL</Label>
                </div>
              </div>
              
              <div className="space-y-3">
                {/* Logo Preview */}
                {logoPreview && (
                  <div className="flex justify-center">
                    <img 
                      src={logoPreview} 
                      alt="Logo Preview" 
                      className="max-h-20 max-w-full object-contain border rounded"
                    />
                  </div>
                )}
                
                {/* Conditional rendering based on input mode */}
                {logoInputMode === 'upload' ? (
                  <div className="flex flex-col space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="logo-upload"
                        onChange={handleFileUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        <span>Upload Image</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      placeholder="Enter logo URL"
                      value={typeof formData.company_logo_path === 'string' ? formData.company_logo_path : ''}
                      onChange={handleUrlChange}
                      className="pl-10"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      <span>http://</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Address</Label>
              <Textarea
                placeholder="Enter company address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
              />
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
                  {isEditMode ? 'Update Company' : 'Add Company'}
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}