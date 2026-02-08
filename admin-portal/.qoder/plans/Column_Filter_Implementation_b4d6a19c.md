# Column Filter Implementation Plan

## Overview
Add filter input fields below each table header column when `isFilter=true` is set in column configuration. The filters will work similarly to existing search functionality but applied per column individually.

## Implementation Steps

### 1. Update DataGrid Types
**File:** `src/components/ui/data-grid/data-grid.types.ts`
- Add `isFilter?: boolean` property to `ColumnConfig` interface
- This will allow configuration of which columns should display filter inputs

### 2. Create Column Input Filter Component
**File:** `src/components/ui/data-grid-column-input-filter.tsx`
- Create a reusable filter input component that integrates with react-table's filtering system
- Implement debounce functionality to prevent excessive API calls (500ms delay as per memory guidelines)
- Support both text and numeric filtering
- Include clear button functionality

### 3. Update User Table Component
**File:** `src/pages/access-control/user-management/components/user-table.tsx`
- Add column filter state management using `ColumnFiltersState` from react-table
- Implement filter state persistence and API integration
- Modify column configuration to include `isFilter: true` for relevant columns
- Update the `filteredData` memo to use column filters instead of manual filtering
- Add filter reset functionality

### 4. Update Column Header Integration
- Modify the column header rendering to include filter inputs when `isFilter=true`
- Ensure proper styling and spacing for filter inputs below headers
- Handle filter state changes and propagate to table state

### 5. API Integration
- Update the API service to accept column filter parameters
- Modify the user service to handle column-based filtering
- Ensure proper pagination works with column filters

### 6. User Experience Enhancements
- Add visual indicators for active filters
- Implement filter persistence across pagination
- Add "Clear All Filters" functionality
- Ensure responsive design for filter inputs

## Technical Considerations

### Performance
- Implement debounce (500ms) for filter input changes to prevent excessive API calls
- Use `useMemo` for filter state to prevent unnecessary re-renders
- Maintain existing pagination and sorting behavior

### State Management
- Track filter state separately from global search
- Preserve filter state when navigating between pages
- Reset filters appropriately when needed

### Styling
- Ensure filter inputs align properly with column headers
- Maintain consistent spacing and visual hierarchy
- Follow existing design system patterns

## Files to Modify
1. `src/components/ui/data-grid/data-grid.types.ts` - Add isFilter property
2. `src/components/ui/data-grid-column-input-filter.tsx` - New component
3. `src/pages/access-control/user-management/components/user-table.tsx` - Main implementation
4. `src/services/modules/user.ts` - Update API service if needed

## Testing Considerations
- Verify filter inputs appear only for columns with `isFilter=true`
- Test filtering functionality with various data types
- Ensure pagination works correctly with active filters
- Test filter persistence and reset functionality
- Verify performance with debounce implementation