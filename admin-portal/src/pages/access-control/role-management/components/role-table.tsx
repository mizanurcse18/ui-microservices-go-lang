'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  RowSelectionState,
  SortingState,
  ColumnFiltersState,
  useReactTable,
} from '@tanstack/react-table';
import { EllipsisVertical, Settings2, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { RoleDialog } from './role-dialog';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
  CardToolbar,
} from '@/components/ui/card';
import { DataGrid, useDataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridColumnVisibility } from '@/components/ui/data-grid-column-visibility';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from '@/components/ui/data-grid-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { roleService } from '@/services/modules/role';
import { ContentLoader } from '@/components/common/content-loader';
import { ColumnInputFilter } from '@/components/ui/data-grid-column-input-filter';
import { 
  Role, 
  PaginatedRolesResponse
} from '@/services/modules/role';

// Configuration for the role table
const dataGridConfig = {
  enableRowSelection: true,
  enableColumnVisibility: true,
  enableColumnPinning: true,
  enableColumnMoving: true,
  pageSizeOptions: [5, 10, 20, 50],
  defaultPageSize: 10,
  columns: [
    {
      id: 'selection',
      title: 'Select',
      accessorKey: 'id',
      enableSorting: false,
      enableHiding: false,
      size: 51,
    },
    {
      id: 'name',
      title: 'Role Name',
      accessorKey: 'name',
      enableSorting: true,
      isFilter: true,
      defaultOperator: 'like',
      supportedOperators: ['eq', 'ne', 'like'],
      size: 200
    },
    {
      id: 'description',
      title: 'Description',
      accessorKey: 'description',
      enableSorting: true,
      isFilter: true,
      defaultOperator: 'like',
      supportedOperators: ['eq', 'ne', 'like'],
      size: 300
    },
    {
      id: 'application_id',
      title: 'Application ID',
      accessorKey: 'application_id',
      enableSorting: true,
      isFilter: true,
      defaultOperator: 'eq',
      supportedOperators: ['eq', 'ne'],
      size: 120
    },
    {
      id: 'company_id',
      title: 'Company ID',
      accessorKey: 'company_id',
      enableSorting: true,
      isFilter: true,
      defaultOperator: 'like',
      supportedOperators: ['eq', 'ne', 'like'],
      size: 150
    },
    {
      id: 'created_at',
      title: 'Created At',
      accessorKey: 'created_at',
      enableSorting: true,
      isFilter: false,
      size: 180
    },
    {
      id: 'actions',
      title: 'Actions',
      enableSorting: false,
      size: 80,
    }
  ]
};

const RoleTable = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: dataGridConfig.defaultPageSize || 10,
  });
  
  // State for Add Role Dialog
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  
  // State for Edit Role Dialog
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  
  // State for Delete Confirmation Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  // State to track if we're currently fetching data to prevent unwanted state updates
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ]);
  
  // Column filters state
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  // Debug column filters changes
  useEffect(() => {
    console.log('📊 Column filters changed:', columnFilters);
  }, [columnFilters]);
  
  // Ref for filter change debouncing
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup timeout ref on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Key to force re-render of filter components when clearing filters
  const [filterResetKey, setFilterResetKey] = useState(0);
  
  // Column visibility state with localStorage persistence
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('role-table-column-visibility');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Persist column visibility to localStorage
  useEffect(() => {
    localStorage.setItem('role-table-column-visibility', JSON.stringify(columnVisibility));
  }, [columnVisibility]);
  
  // Track if this is the initial render
  const isFirstRender = useRef(true);
  
  // Memoize sorting to prevent unnecessary re-renders
  const memoizedSorting = useMemo(() => sorting, [sorting[0]?.id, sorting[0]?.desc]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [totalRoles, setTotalRoles] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Refs to track the current request ID and previous sorting state
  const currentRequestId = useRef<string>('');
  
  // Initial data load - only run on mount
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('🔄 Loading initial role data');
      try {
        setLoading(true);
        
        // Prepare request filters for initial load
        const filters = {
          page: 1,
          pageSize: dataGridConfig.defaultPageSize || 10,
          sortBy: 'name',
          sortOrder: 'asc' as 'asc' | 'desc',
          columnFilters: [] as Array<{ id: string; value: any; operator?: string }>
        };
        
        console.log(`🔍 Initial API Request: Page ${filters.page}, PageSize: ${filters.pageSize}`);
        
        // Use roleService to make the API request
        const response = await roleService.getRolesPaginated(filters);
        
        if (response.success && response.data) {
          // Handle the API response format
          const paginatedData = response.data as PaginatedRolesResponse;
          setRoles(paginatedData.roles);
          setTotalRoles(paginatedData.total);
          setTotalPages(paginatedData.totalPages);
        } else {
          setError(response.error || 'Failed to fetch roles');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        console.error('Error fetching initial roles:', err);
      } finally {
        setLoading(false);
        isFirstRender.current = false; // Mark that initial load is complete
      }
    };
    
    loadInitialData();
  }, []); // Empty dependency array for initial load only
  
  // Extract fetchRoles function for reusability
  const fetchRoles = async () => {
    const requestId = `${pagination.pageIndex}-${pagination.pageSize}-${JSON.stringify(sorting[0])}`;
    
    // If there's already a request in flight, don't start a new one
    if (isFetching && currentRequestId.current === requestId) {
      console.log('🔄 Request already in flight, skipping...');
      return;
    }
    
    // SET REQUEST ID BEFORE making the API call to prevent race conditions
    currentRequestId.current = requestId;
    setIsFetching(true);
    
    try {
      setLoading(true);
      
      // Prepare request filters
      const filters = {
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        sortBy: sorting[0]?.id,
        sortOrder: (sorting[0]?.desc ? 'desc' : 'asc') as 'asc' | 'desc',
        columnFilters: columnFilters.map(filter => {
          const filterValue = filter.value as { value: string; operator: string } | string;
          return {
            id: filter.id,
            value: typeof filterValue === 'object' && filterValue !== null ? filterValue.value : filterValue,
            operator: typeof filterValue === 'object' && filterValue !== null ? filterValue.operator : 'like'
          };
        })
      };
      
      console.log(`🔍 API Request: Page ${filters.page}, PageSize: ${filters.pageSize}, Sorting: ${JSON.stringify(sorting[0])}`);
      console.log(`🆔 Setting request ID to: ${requestId}`);
      console.log(`🆔 Current request ID is now: ${currentRequestId.current}`);
      if (columnFilters.length > 0) {
        console.log(`🔍 Filters sent:`, filters.columnFilters);
      }
      
      // Use roleService to make the API request
      const response = await roleService.getRolesPaginated(filters);
      
      // Only update state if this response is for the most recent request
      const isCurrentRequest = currentRequestId.current === requestId;
      const paginationStillValid = 
        pagination.pageIndex === (filters.page - 1) && 
        pagination.pageSize === filters.pageSize;
      
      if (isCurrentRequest && paginationStillValid) {
        if (response.success && response.data) {
          // Handle the API response format
          const paginatedData = response.data as PaginatedRolesResponse;
          setRoles(paginatedData.roles);
          setTotalRoles(paginatedData.total);
          setTotalPages(paginatedData.totalPages);
        } else {
          setError(response.error || 'Failed to fetch roles');
        }
      } else {
        console.log(`🔄 Ignoring stale response. Expected ID: ${requestId}, Current ID: ${currentRequestId.current}`);
        console.log(`🔄 Pagination still valid: ${paginationStillValid}`);
      }
    } catch (err) {
      // Only update error state if this is the most recent request
      if (currentRequestId.current === requestId) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        console.error('Error fetching roles:', err);
      }
    } finally {
      // Only update loading state if this is the most recent request
      if (currentRequestId.current === requestId) {
        setLoading(false);
      }
      setIsFetching(false);
    }
  };

  // Fetch roles from API when pagination/sorting changes
  // Note: columnFilters changes are handled separately to prevent instant API calls
  useEffect(() => {
    // Skip if this is the first render (initial data load handles this)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Generate a unique request ID for this specific request
    const requestId = `${pagination.pageIndex}-${pagination.pageSize}-${JSON.stringify(memoizedSorting)}`;
    currentRequestId.current = requestId;
    
    fetchRoles();
    
    // Return cleanup function to clear request ID on unmount
    return () => {
      currentRequestId.current = '';
    };
  }, [pagination.pageIndex, pagination.pageSize, memoizedSorting]);
  
  // Handle column filters changes with debouncing to prevent instant API calls
  useEffect(() => {
    // Skip if this is the first render
    if (isFirstRender.current) {
      return;
    }
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout with 800ms debounce for filter changes
    timeoutRef.current = setTimeout(() => {
      console.log('🔍 Filter change detected, triggering API call');
      const requestId = `${pagination.pageIndex}-${pagination.pageSize}-${JSON.stringify(memoizedSorting)}-filter`;
      currentRequestId.current = requestId;
      fetchRoles();
    }, 800);
    
    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [columnFilters]);

  // Use roles directly since we removed client-side filtering
  const filteredData = roles;

  // Reset all filters
  const resetAllFilters = () => {
    setColumnFilters([]);
    // Increment reset key to force re-render of filter components
    setFilterResetKey(prev => prev + 1);
    // Reset to first page when clearing filters
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  };

  // Check if any filters are active
  const hasActiveFilters = columnFilters.length > 0;

  // Build columns dynamically from configuration
  const columns = useMemo<ColumnDef<Role>[]>(
    () => {
      const cols: ColumnDef<Role>[] = [];

      // Add selection column
      if (dataGridConfig.enableRowSelection) {
        cols.push({
          id: 'selection',
          header: () => <DataGridTableRowSelectAll />,
          cell: ({ row }) => <DataGridTableRowSelect row={row} />,
          enableSorting: false,
          enableHiding: false,
          size: 51,
        });
      }

      // Add configured columns
      dataGridConfig.columns
        .filter(col => col.id !== 'selection')
        .forEach(config => {
          const column: ColumnDef<Role> = {
            id: config.id,
            header: ({ column }) => (
              <div className="flex flex-col gap-1">
                <DataGridColumnHeader title={config.title} column={column} />
                {config.isFilter && (
                  <ColumnInputFilter 
                    key={`${config.id}-${filterResetKey}`}
                    column={column} 
                    placeholder={`Filter ${config.title}...`} 
                    className="mt-1 mb-1"
                    defaultOperator={config.defaultOperator as any}
                    supportedOperators={config.supportedOperators as any}
                  />
                )}
              </div>
            ),
            enableSorting: config.enableSorting ?? true,
            size: config.size,
          };

          if (config.accessorKey) {
            (column as any).accessorKey = config.accessorKey;
          }

          if ((config as any).accessorFn) {
            (column as any).accessorFn = (config as any).accessorFn;
          }

          // Handle specific cell rendering based on column ID
          if (config.id === 'application_id') {
            column.cell = ({ row }) => (
              <Badge size="lg" variant="info" appearance="light">
                {row.original.application_id || 'N/A'}
              </Badge>
            );
          } else if (config.id === 'created_at') {
            column.cell = ({ row }) => {
              const createdAt = row.original.created_at;
              if (!createdAt) return 'N/A';
              const date = new Date(createdAt);
              return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            };
          } else if (config.id === 'actions') {
            column.cell = ({ row }) => {
              const handleCopyId = () => {
                navigator.clipboard.writeText(String(row.original.id));
                toast.success(`Role ID copied: ${row.original.id}`);
              };

              const handleEdit = async () => {
                try {
                  console.log('📝 Edit button clicked for role:', row.original.id);
                  // Fetch fresh role data from the API
                  const response = await roleService.getRoleById(row.original.id);
                  
                  if (response.success && response.data) {
                    console.log('✅ Role data fetched successfully:', response.data);
                    // Set the editing role with fresh data from the API
                    setEditingRole(response.data);
                    setIsEditRoleDialogOpen(true);
                  } else {
                    toast.error(response.error || 'Failed to fetch role details');
                  }
                } catch (error) {
                  console.error('❌ Error fetching role details:', error);
                  toast.error('Failed to fetch role details');
                }
              };

              const handleDeleteClick = (e: React.MouseEvent) => {
                e.stopPropagation(); // Prevent dropdown from closing
                // Set the role to be deleted and open confirmation dialog
                setRoleToDelete(row.original);
                setIsDeleteDialogOpen(true);
              };

              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="size-7" mode="icon" variant="ghost">
                      <EllipsisVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="end">
                    <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyId}>Copy ID</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={handleDeleteClick}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            };
          } else if ((config as any).cell) {
            column.cell = (config as any).cell;
          }

          // Add filter component if isFilter is true
          if (config.isFilter) {
            column.filterFn = 'includesString';
          }

          cols.push(column);
        });

      return cols;
    },
    [filterResetKey]
  );

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: totalPages,
    getRowId: (row: Role) => String(row.id),
    state: {
      pagination,
      sorting: memoizedSorting,
      rowSelection,
      columnFilters,
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    columnResizeMode: 'onChange',
    manualPagination: true,
    manualFiltering: true,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    enableRowSelection: dataGridConfig.enableRowSelection,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  } as any);

  const Toolbar = () => {
    const { table } = useDataGrid();

    const toolbarButtonsConfig = [
      {
        id: 'add-role',
        label: 'Add Role',
        icon: <Plus size={16} />,
        variant: 'primary' as const,
        onClick: () => {
          setIsAddRoleDialogOpen(true);
        }
      }
    ];

    return (
      <CardToolbar>
        {toolbarButtonsConfig.map(button => (
          <Button
            key={button.id}
            variant={button.variant}
            onClick={button.onClick}
          >
            {button.icon}
            {button.label}
          </Button>
        ))}
        
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={resetAllFilters}
          >
            <X size={16} className="me-2" />
            Clear Filters
          </Button>
        )}
        {dataGridConfig.enableColumnVisibility && (
          <DataGridColumnVisibility
            table={table}
            trigger={
              <Button variant="outline">
                <Settings2 />
                Columns
              </Button>
            }
          />
        )}
      </CardToolbar>
    );
  };

  if (loading) {
    return <ContentLoader />;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <DataGrid
        table={table as any}
        recordCount={totalRoles}
        tableLayout={{
          columnsPinnable: dataGridConfig.enableColumnPinning ?? true,
          columnsMovable: dataGridConfig.enableColumnMoving ?? true,
          columnsVisibility: dataGridConfig.enableColumnVisibility ?? true,
          cellBorder: true,
        }}
      >
        <Card>
          <CardHeader>
            <CardHeading>
              <div className="flex items-center gap-2.5">
              </div>
            </CardHeading>
            <Toolbar />
          </CardHeader>
          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter>
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{roleToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              variant="destructive" 
              onClick={async () => {
                if (!roleToDelete) return;
                
                try {
                  const response = await roleService.deleteRole(roleToDelete.id);
                  if (response.success) {
                    toast.success(`Role "${roleToDelete.name}" deleted successfully`);
                    fetchRoles(); // Refresh the table
                  } else {
                    toast.error(response.error || 'Failed to delete role');
                  }
                } catch (error) {
                  console.error('❌ Error deleting role:', error);
                  toast.error('Failed to delete role');
                } finally {
                  // Close the dialog and reset state
                  setIsDeleteDialogOpen(false);
                  setRoleToDelete(null);
                }
              }}
            >
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Role Dialog Components */}
      <RoleDialog
        open={isAddRoleDialogOpen}
        onOpenChange={() => {
          setIsAddRoleDialogOpen(false);
        }}
        onRefresh={fetchRoles}
      />
      
      <RoleDialog
        open={isEditRoleDialogOpen}
        onOpenChange={() => {
          setIsEditRoleDialogOpen(false);
        }}
        role={isEditRoleDialogOpen && editingRole ? {
          id: editingRole.id,
          name: editingRole.name,
          description: editingRole.description
        } : undefined}
        onRefresh={fetchRoles}
      />
    </>
  );
};

export { RoleTable };