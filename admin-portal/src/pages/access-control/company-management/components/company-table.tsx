'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  Row,
  RowSelectionState,
  SortingState,
  ColumnFiltersState,
  useReactTable,
} from '@tanstack/react-table';
import { EllipsisVertical, Settings2, X, Plus } from 'lucide-react';
import { toast } from 'sonner';


import { CompanyDialog } from './company-dialog';

import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { companyService } from '@/services/modules/company';
import { ContentLoader } from '@/components/common/content-loader';
import { ColumnInputFilter } from '@/components/ui/data-grid-column-input-filter';
import { 
  Company, 
  PaginatedCompaniesResponse
} from '@/services/modules/company';

// Configuration for the company table
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
      title: '',
      accessorKey: 'id',
      enableSorting: false,
      enableHiding: false,
      size: 51,
    },
    {
      id: 'logo',
      title: 'Logo',
      accessorKey: 'company_logo_path',
      enableSorting: false,
      isFilter: false,
      size: 60
    },
    {
      id: 'name',
      title: 'Company Name',
      accessorKey: 'name',
      enableSorting: true,
      isFilter: true,
      defaultOperator: 'like',
      supportedOperators: ['eq', 'ne', 'like'],
      size: 200
    },
    {
      id: 'domain',
      title: 'Domain',
      accessorKey: 'domain',
      enableSorting: true,
      isFilter: true,
      defaultOperator: 'like',
      supportedOperators: ['eq', 'ne', 'like'],
      size: 150
    },
    {
      id: 'category',
      title: 'Category',
      accessorKey: 'category',
      enableSorting: true,
      isFilter: true,
      defaultOperator: 'eq',
      supportedOperators: ['eq', 'ne'],
      size: 120
    },
    {
      id: 'status',
      title: 'Status',
      accessorKey: 'status',
      enableSorting: true,
      isFilter: true,
      defaultOperator: 'eq',
      supportedOperators: ['eq', 'ne'],
      size: 100
    },
    {
      id: 'company_status',
      title: 'Company Status',
      accessorKey: 'company_status',
      enableSorting: true,
      isFilter: true,
      defaultOperator: 'eq',
      supportedOperators: ['eq', 'ne'],
      size: 120
    },
    {
      id: 'seq_no',
      title: 'Sequence',
      accessorKey: 'seq_no',
      enableSorting: true,
      isFilter: false,
      size: 100
    },
    {
      id: 'email',
      title: 'Email',
      accessorKey: 'email',
      enableSorting: true,
      isFilter: true,
      defaultOperator: 'like',
      supportedOperators: ['eq', 'ne', 'like'],
      size: 200
    },
    {
      id: 'actions',
      title: 'Actions',
      enableSorting: false,
      size: 80,
    }
  ]
};

const CompanyTable = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: dataGridConfig.defaultPageSize || 10,
  });
  
  // State for Add Company Dialog
  const [isAddCompanyDialogOpen, setIsAddCompanyDialogOpen] = useState(false);
  
  // State for Edit Company Dialog
  const [isEditCompanyDialogOpen, setIsEditCompanyDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  
  // State for Delete Confirmation Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  // State to track if we're currently fetching data to prevent unwanted state updates
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ]);
  
  // Column filters state
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  // Key to force re-render of filter components when clearing filters
  const [filterResetKey, setFilterResetKey] = useState(0);
  
  // Track if this is the initial render
  const isFirstRender = useRef(true);
  
  // Memoize sorting to prevent unnecessary re-renders
  const memoizedSorting = useMemo(() => sorting, [sorting[0]?.id, sorting[0]?.desc]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalCompanies, setTotalCompanies] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Refs to track the current request ID and previous sorting state
  const currentRequestId = useRef<string>('');
  const previousSortingRef = useRef<string>(JSON.stringify(sorting));
  
  // Initial data load - only run on mount
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('🔄 Loading initial company data');
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
        
        // Use companyService to make the API request
        const response = await companyService.getCompaniesPaginated(filters);
        
        if (response.success && response.data) {
          // Handle the API response format
          const paginatedData = response.data as PaginatedCompaniesResponse;
          setCompanies(paginatedData.companies);
          setTotalCompanies(paginatedData.total);
          setTotalPages(paginatedData.totalPages);
        } else {
          setError(response.error || 'Failed to fetch companies');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        console.error('Error fetching initial companies:', err);
      } finally {
        setLoading(false);
        isFirstRender.current = false; // Mark that initial load is complete
      }
    };
    
    loadInitialData();
  }, []); // Empty dependency array for initial load only
  
  // Extract fetchCompanies function for reusability
  const fetchCompanies = async () => {
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
      
      // Use companyService to make the API request
      const response = await companyService.getCompaniesPaginated(filters);
      
      // Only update state if this response is for the most recent request
      const isCurrentRequest = currentRequestId.current === requestId;
      const paginationStillValid = 
        pagination.pageIndex === (filters.page - 1) && 
        pagination.pageSize === filters.pageSize;
      
      if (isCurrentRequest && paginationStillValid) {
        if (response.success && response.data) {
          // Handle the API response format
          const paginatedData = response.data as PaginatedCompaniesResponse;
          setCompanies(paginatedData.companies);
          setTotalCompanies(paginatedData.total);
          setTotalPages(paginatedData.totalPages);
        } else {
          setError(response.error || 'Failed to fetch companies');
        }
      } else {
        console.log(`🔄 Ignoring stale response. Expected ID: ${requestId}, Current ID: ${currentRequestId.current}`);
        console.log(`🔄 Pagination still valid: ${paginationStillValid}`);
      }
    } catch (err) {
      // Only update error state if this is the most recent request
      if (currentRequestId.current === requestId) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        console.error('Error fetching companies:', err);
      }
    } finally {
      // Only update loading state if this is the most recent request
      if (currentRequestId.current === requestId) {
        setLoading(false);
      }
      setIsFetching(false);
    }
  };

  // Fetch companies from API when pagination/sorting/columnFilters changes
  useEffect(() => {
    // Skip if this is the first render (initial data load handles this)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Generate a unique request ID for this specific request
    const requestId = `${pagination.pageIndex}-${pagination.pageSize}-${JSON.stringify(memoizedSorting)}`;
    currentRequestId.current = requestId;
    
    fetchCompanies();
    
    // Return cleanup function to clear request ID on unmount
    return () => {
      currentRequestId.current = '';
    };
  }, [pagination.pageIndex, pagination.pageSize, memoizedSorting, columnFilters]);

  // Use companies directly since we removed client-side filtering
  const filteredData = companies;

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
  const columns = useMemo<ColumnDef<Company>[]>(
    () => {
      const cols: ColumnDef<Company>[] = [];

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
          const column: ColumnDef<Company> = {
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
                    defaultOperator={config.defaultOperator}
                    supportedOperators={config.supportedOperators}
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

          if (config.accessorFn) {
            (column as any).accessorFn = config.accessorFn;
          }

          // Handle specific cell rendering based on column ID
          if (config.id === 'logo') {
            column.cell = ({ row }) => (
              <div className="flex items-center justify-center">
                <Avatar className="size-10 border-2 border-gray-200">
                  <AvatarImage
                    src={row.original.company_logo_path}
                    alt={row.original.name}
                  />
                  <AvatarFallback className="bg-gray-100 text-gray-600 font-medium">
                    {row.original.name?.charAt(0)?.toUpperCase() || 'C'}
                  </AvatarFallback>
                </Avatar>
              </div>
            );
          } else if (config.id === 'status') {
            column.cell = ({ row }) => (
              <Badge
                size="lg"
                variant={row.original.status === 'active' ? 'success' : 'secondary'}
                appearance="light"
                shape="circle"
              >
                <BadgeDot className={row.original.status === 'active' ? 'bg-success' : 'bg-secondary'} />
                {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
              </Badge>
            );
          } else if (config.id === 'company_status') {
            column.cell = ({ row }) => {
              let variant: 'primary' | 'success' | 'destructive' | 'warning' | 'secondary' = 'secondary';
              if (row.original.company_status === 'approved') variant = 'success';
              else if (row.original.company_status === 'pending') variant = 'warning';
              else if (row.original.company_status === 'rejected') variant = 'destructive';
              
              return (
                <Badge size="lg" variant={variant} appearance="light">
                  {row.original.company_status.charAt(0).toUpperCase() + row.original.company_status.slice(1)}
                </Badge>
              );
            };
          } else if (config.id === 'category') {
            column.cell = ({ row }) => (
              <Badge size="lg" variant="info" appearance="light">
                {row.original.category.toUpperCase()}
              </Badge>
            );
          } else if (config.id === 'actions') {
            column.cell = ({ row }) => {
              const handleCopyId = () => {
                navigator.clipboard.writeText(String(row.original.id));
                toast.success(`Company ID copied: ${row.original.id}`);
              };

              const handleEdit = async () => {
                try {
                  console.log('📝 Edit button clicked for company:', row.original.id);
                  // Fetch fresh company data from the API
                  const response = await companyService.getCompanyById(row.original.id);
                  
                  if (response.success && response.data) {
                    console.log('✅ Company data fetched successfully:', response.data);
                    // Set the editing company with fresh data from the API
                    setEditingCompany(response.data);
                    setIsEditCompanyDialogOpen(true);
                  } else {
                    toast.error(response.error || 'Failed to fetch company details');
                  }
                } catch (error) {
                  console.error('❌ Error fetching company details:', error);
                  toast.error('Failed to fetch company details');
                }
              };

              const handleDeleteClick = (e: React.MouseEvent) => {
                e.stopPropagation(); // Prevent dropdown from closing
                // Set the company to be deleted and open confirmation dialog
                setCompanyToDelete(row.original);
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
          } else if (config.cell) {
            column.cell = config.cell;
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
    getRowId: (row: Company) => String(row.id),
    state: {
      pagination,
      sorting: memoizedSorting,
      rowSelection,
      columnFilters,
    },
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
        id: 'add-company',
        label: 'Add Company',
        icon: <Plus size={16} />,
        variant: 'primary' as const,
        onClick: () => {
          setIsAddCompanyDialogOpen(true);
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
        recordCount={totalCompanies}
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
              Are you sure you want to delete the company "{companyToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              variant="destructive" 
              onClick={async () => {
                if (!companyToDelete) return;
                
                try {
                  const response = await companyService.deleteCompany(companyToDelete.id);
                  if (response.success) {
                    toast.success(`Company "${companyToDelete.name}" deleted successfully`);
                    fetchCompanies(); // Refresh the table
                  } else {
                    toast.error(response.error || 'Failed to delete company');
                  }
                } catch (error) {
                  console.error('❌ Error deleting company:', error);
                  toast.error('Failed to delete company');
                } finally {
                  // Close the dialog and reset state
                  setIsDeleteDialogOpen(false);
                  setCompanyToDelete(null);
                }
              }}
            >
              Delete Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Company Dialog Components */}
      <CompanyDialog
        open={isAddCompanyDialogOpen}
        onOpenChange={(open) => {
          setIsAddCompanyDialogOpen(false);
        }}
        onRefresh={fetchCompanies}
      />
      
      <CompanyDialog
        open={isEditCompanyDialogOpen}
        onOpenChange={(open) => {
          setIsEditCompanyDialogOpen(false);
        }}
        company={isEditCompanyDialogOpen && editingCompany ? {
          id: editingCompany.id,
          name: editingCompany.name,
          domain: editingCompany.domain,
          category: editingCompany.category,
          seq_no: editingCompany.seq_no,
          is_default: editingCompany.is_default,
          status: editingCompany.status,
          company_status: editingCompany.company_status,
          address: editingCompany.address,
          tin: editingCompany.tin,
          bin: editingCompany.bin,
          company_logo_path: editingCompany.company_logo_path,
          email: editingCompany.email,
          employee_range: editingCompany.employee_range,
          funded: editingCompany.funded
        } : undefined}
        onRefresh={fetchCompanies}
      />
    </>
  );
};

export { CompanyTable };