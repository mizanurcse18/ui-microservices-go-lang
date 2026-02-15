import { useEffect, useRef, useState } from 'react';
import { Column } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FILTER_OPERATORS, FilterOperator, getOperatorSymbol } from '@/components/ui/data-grid/data-grid.types';

interface ColumnInputFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
  placeholder?: string;
  className?: string;
  defaultOperator?: FilterOperator;
  supportedOperators?: FilterOperator[];
}

function ColumnInputFilter<TData, TValue>({
  column,
  placeholder = 'Filter...',
  className,
  defaultOperator = 'like',
  supportedOperators = ['eq', 'ne', 'like'],
}: ColumnInputFilterProps<TData, TValue>) {
  const [value, setValue] = useState<string>();
  const [operator, setOperator] = useState<FilterOperator>(defaultOperator);
  const textTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const operatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef(false);
  
  // Filter operators for this specific column
  const columnOperators = FILTER_OPERATORS.filter(op => 
    supportedOperators.includes(op.value as FilterOperator)
  );
  
  // Initialize value and operator from column filter - only for external changes
  useEffect(() => {
    // Skip synchronization when user is actively updating
    if (isUpdatingRef.current) return;
    
    const filterValue = column.getFilterValue() as { value: string; operator: FilterOperator } | string | undefined;
    
    // Only sync when filter is externally cleared (undefined)
    if (filterValue === undefined && (value !== undefined || operator !== defaultOperator)) {
      // Reset to default state when filter is cleared externally
      setValue(undefined);
      setOperator(defaultOperator);
    } else if (typeof filterValue === 'object' && filterValue !== null) {
      if (filterValue.value !== undefined && filterValue.value !== value) {
        setValue(filterValue.value || '');
      }
    } else if (typeof filterValue === 'string' && filterValue !== value) {
      setValue(filterValue || '');
    }
    // Don't sync operator changes back to state - let user selection persist
  }, [column.getFilterValue()]);
  
  // Cleanup function to reset updating flag
  useEffect(() => {
    return () => {
      isUpdatingRef.current = false;
      if (textTimeoutRef.current) {
        clearTimeout(textTimeoutRef.current);
      }
      if (operatorTimeoutRef.current) {
        clearTimeout(operatorTimeoutRef.current);
      }
    };
  }, []);
  
  // Reset updating flag when component becomes inactive or when external filter changes
  useEffect(() => {
    const filterValue = column.getFilterValue();
    if ((value === '' && filterValue === undefined) || filterValue !== undefined) {
      isUpdatingRef.current = false;
    }
  }, [value, column.getFilterValue()]);

  const handleChange = (newValue: string) => {
    // Set updating flag to prevent state sync interference
    isUpdatingRef.current = true;
    setValue(newValue);
    
    // Clear existing timeout
    if (textTimeoutRef.current) {
      clearTimeout(textTimeoutRef.current);
    }
    
    // Set new timeout with 500ms debounce
    textTimeoutRef.current = setTimeout(() => {
      const filterData = newValue ? { value: newValue, operator } : undefined;
      column.setFilterValue(filterData);
      // Reset updating flag after API call
      isUpdatingRef.current = false;
    }, 500);
  };

  const handleOperatorChange = (newOperator: FilterOperator) => {
    console.log(`🔍 Operator changed from ${operator} to ${newOperator}`);
    isUpdatingRef.current = true;
    setOperator(newOperator);
    
    // Clear existing timeout
    if (operatorTimeoutRef.current) {
      clearTimeout(operatorTimeoutRef.current);
    }
    
    // Set new timeout with 800ms debounce for operator changes
    operatorTimeoutRef.current = setTimeout(() => {
      const filterData = value ? { value, operator: newOperator } : undefined;
      console.log(`🔍 Applying filter with operator: ${newOperator}, value: ${value}`);
      column.setFilterValue(filterData);
      isUpdatingRef.current = false;
    }, 800);
  };

  const handleClear = () => {
    isUpdatingRef.current = true;
    setValue('');
    setOperator(defaultOperator);
    column.setFilterValue(undefined);
    isUpdatingRef.current = false;
  };

  return (
    <div className={cn('flex gap-1 items-start', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-10 p-0 font-mono text-xs"
            title={columnOperators.find(op => op.value === operator)?.label}
          >
            {getOperatorSymbol(operator)}
            <ChevronDown className="size-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {columnOperators.map((op) => (
            <DropdownMenuItem
              key={op.value}
              onClick={() => handleOperatorChange(op.value as FilterOperator)}
              className={cn(
                'flex items-center justify-between',
                operator === op.value && 'bg-accent'
              )}
            >
              <span>{op.label}</span>
              <span className="font-mono text-xs">{op.symbol}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <div className="relative flex-1">
        <Input
          placeholder={placeholder}
          value={value || ''}
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
    </div>
  );
}

export { ColumnInputFilter, type ColumnInputFilterProps };