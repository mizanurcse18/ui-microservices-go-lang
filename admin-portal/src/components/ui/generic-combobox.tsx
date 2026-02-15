import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

interface Option {
  id: string | number;
  name: string;
  bullet?: string; // Optional CSS class for bullet styling
}

interface GenericComboboxProps {
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  onSearch?: (searchTerm: string) => Promise<Option[]>;
  className?: string;
}

export function GenericCombobox({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  label,
  error,
  disabled = false,
  loading = false,
  onSearch,
  className = ''
}: GenericComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [dynamicOptions, setDynamicOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize dynamic options when onSearch is not provided or when options change
  useEffect(() => {
    if (!onSearch) {
      setDynamicOptions(options);
    }
  }, [options, onSearch]);

  // Filter options based on search value if onSearch is not provided
  const filteredOptions = onSearch 
    ? dynamicOptions 
    : dynamicOptions.filter(option =>
        option.name.toLowerCase().includes(searchValue.toLowerCase())
      );

  const selectedOption = options.find(option => option.id === value);

  // Handle search input changes
  const handleSearchChange = async (value: string) => {
    setSearchValue(value);
    
    // If onSearch function is provided, call it to get dynamic options
    if (onSearch) {
      setIsLoading(true);
      try {
        const results = await onSearch(value);
        setDynamicOptions(results);
      } catch (error) {
        console.error('Search error:', error);
        setDynamicOptions([]); // Show empty state if search fails
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={className}>
      {label && <Label className="text-sm font-medium mb-1.5 block">{label}</Label>}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`w-full justify-between ${error ? 'border-red-500' : ''}`}
            disabled={disabled || isLoading}
          >
            <span className="truncate">
              {selectedOption ? selectedOption.name : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search options..." 
              value={searchValue}
              onValueChange={handleSearchChange}
            />
            <CommandList>
              <CommandEmpty>No option found.</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={String(option.id)}
                    onSelect={(currentValue) => {
                      onChange(currentValue !== String(value) ? currentValue : '');
                      setOpen(false);
                      setSearchValue(''); // Clear search after selection
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === option.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="inline-flex items-center gap-1.5">
                      {option.bullet && (
                        <span
                          className={cn(
                            'size-2 rounded-full',
                            option.bullet
                          )}
                        ></span>
                      )}
                      <span
                        className={cn(
                          'text-medium text-foreground',
                        )}
                      >
                        {option.name}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}