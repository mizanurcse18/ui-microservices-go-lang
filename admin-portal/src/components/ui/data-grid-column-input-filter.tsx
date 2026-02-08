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
  const [value, setValue] = useState<string>('');
  const [operator, setOperator] = useState<FilterOperator>(defaultOperator);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Filter operators for this specific column
  const columnOperators = FILTER_OPERATORS.filter(op => 
    supportedOperators.includes(op.value as FilterOperator)
  );
  
  // Initialize value and operator from column filter
  useEffect(() => {
    const filterValue = column.getFilterValue() as { value: string; operator: FilterOperator } | string;
    
    if (typeof filterValue === 'object' && filterValue !== null) {
      if (filterValue.value !== undefined && filterValue.value !== value) {
        setValue(filterValue.value || '');
      }
      if (filterValue.operator && filterValue.operator !== operator) {
        setOperator(filterValue.operator);
      }
    } else if (typeof filterValue === 'string' && filterValue !== value) {
      setValue(filterValue || '');
    }
  }, [column, value, operator]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout with 500ms debounce
    timeoutRef.current = setTimeout(() => {
      const filterData = newValue ? { value: newValue, operator } : undefined;
      column.setFilterValue(filterData);
    }, 500);
  };

  const handleOperatorChange = (newOperator: FilterOperator) => {
    setOperator(newOperator);
    
    // Apply filter immediately when operator changes
    const filterData = value ? { value, operator: newOperator } : undefined;
    column.setFilterValue(filterData);
  };

  const handleClear = () => {
    setValue('');
    setOperator(defaultOperator);
    column.setFilterValue(undefined);
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
    </div>
  );
}

export { ColumnInputFilter, type ColumnInputFilterProps };