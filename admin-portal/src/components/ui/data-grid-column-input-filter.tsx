import { useEffect, useRef, useState } from 'react';
import { Column } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColumnInputFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
  placeholder?: string;
  className?: string;
}

function ColumnInputFilter<TData, TValue>({
  column,
  placeholder = 'Filter...',
  className,
}: ColumnInputFilterProps<TData, TValue>) {
  const [value, setValue] = useState<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize value from column filter
  useEffect(() => {
    const filterValue = column.getFilterValue() as string;
    if (filterValue !== undefined && filterValue !== value) {
      setValue(filterValue || '');
    }
  }, [column, value]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout with 500ms debounce
    timeoutRef.current = setTimeout(() => {
      column.setFilterValue(newValue || undefined);
    }, 500);
  };

  const handleClear = () => {
    setValue('');
    column.setFilterValue(undefined);
  };

  return (
    <div className={cn('relative', className)}>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="h-8 text-sm pe-8"
      />
      {value && (
        <Button
          mode="icon"
          variant="ghost"
          size="sm"
          className="absolute end-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-muted"
          onClick={handleClear}
          aria-label="Clear filter"
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  );
}

export { ColumnInputFilter, type ColumnInputFilterProps };