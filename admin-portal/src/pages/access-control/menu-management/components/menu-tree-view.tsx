import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, Plus, Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MenuItem } from '@/services/modules/menu';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from '@/components/ui/context-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface TreeNodeProps {
  node: MenuItem;
  level?: number;
  onNodeClick?: (node: MenuItem) => void;
  onContextMenu?: (event: React.MouseEvent, node: MenuItem) => void;
  expandedNodes?: Set<string | number>;
  onToggleExpand?: (id: string | number) => void;
  onAddChild?: (parentId: string | number) => void;
  onEdit?: (node: MenuItem) => void;
  onDelete?: (node: MenuItem) => void;
  onConfirmDelete?: (node: MenuItem) => void;
  isEditLoading?: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level = 0,
  onNodeClick,
  onContextMenu,
  expandedNodes = new Set(),
  onToggleExpand,
  onAddChild,
  onEdit,
  onDelete,
  onConfirmDelete,
  isEditLoading = false
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id || '');
  const marginLeft = `${level * 20}px`;

  const handleClick = () => {
    if (hasChildren) {
      onToggleExpand?.(node.id || '');
    }
    onNodeClick?.(node);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu?.(e, node);
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddChild?.(node.id || '');
  };

  const handleEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditLoading) return;
    await onEdit?.(node);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConfirmDelete?.(node);
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-2 px-3 hover:bg-accent rounded-md cursor-pointer transition-colors group ${
          isExpanded ? 'bg-accent' : ''
        }`}
        style={{ marginLeft }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 mr-1"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand?.(node.id || '');
            }}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </Button>
        )}
        
        {!hasChildren && <div className="w-6 h-6 mr-1"></div>}
        
        <div className="mr-2">
          {hasChildren ? (
            isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />
          ) : (
            <FileText size={16} />
          )}
        </div>
        
        <span className="flex-1 truncate">{node.title}</span>
        
        <div className="flex space-x-1 opacity-0 group-hover:opacity-100">
          {node.type === 'group' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleAddChild}
              title="Add Child Menu"
            >
              <Plus size={14} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleEdit}
            title={isEditLoading ? "Loading..." : "Edit Menu"}
            disabled={isEditLoading}
          >
            {isEditLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Edit3 size={14} />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive"
            onClick={handleDelete}
            title="Delete Menu"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="ml-0">
          {node.children?.map((child) => (
            <TreeNode
              key={child.id || Math.random().toString()}
              node={child}
              level={level + 1}
              onNodeClick={onNodeClick}
              onContextMenu={onContextMenu}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onConfirmDelete={onConfirmDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface MenuTreeViewProps {
  data: MenuItem[];
  onNodeClick?: (node: MenuItem) => void;
  onNodeContextMenu?: (event: React.MouseEvent, node: MenuItem) => void;
  onAddChild?: (parentId: string | number) => void;
  onEdit?: (node: MenuItem) => void;
  onDelete?: (node: MenuItem) => void;
  onConfirmDelete?: (node: MenuItem) => void;
  isEditLoading?: boolean;
}

export const MenuTreeView: React.FC<MenuTreeViewProps> = ({
  data,
  onNodeClick,
  onNodeContextMenu,
  onAddChild,
  onEdit,
  onDelete,
  onConfirmDelete,
  isEditLoading = false
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string | number>>(new Set());
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const toggleExpand = useCallback((id: string | number) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Auto-expand first level nodes initially
  useEffect(() => {
    const initialExpanded = new Set<string | number>();
    data.forEach(node => {
      if (node.children && node.children.length > 0) {
        initialExpanded.add(node.id || '');
      }
    });
    setExpandedNodes(initialExpanded);
  }, [data]);

  const handleConfirmDelete = (node: MenuItem) => {
    setItemToDelete(node);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (itemToDelete && onDelete) {
      try {
        onDelete(itemToDelete);
      } finally {
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
      }
    }
  };

  return (
    <>
      <div className="space-y-1">
        {data.map((node) => (
          <ContextMenu key={node.id || Math.random().toString()}>
            <ContextMenuTrigger>
              <TreeNode
                node={node}
                onNodeClick={onNodeClick}
                onContextMenu={onNodeContextMenu}
                expandedNodes={expandedNodes}
                onToggleExpand={toggleExpand}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onDelete={onDelete}
                onConfirmDelete={handleConfirmDelete}
                isEditLoading={isEditLoading}
              />
            </ContextMenuTrigger>
            <ContextMenuContent>
              {node.type === 'group' && (
                <ContextMenuItem onClick={() => onAddChild?.(node.id || '')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Child Menu
                </ContextMenuItem>
              )}
              <ContextMenuItem onClick={() => onEdit?.(node)} disabled={isEditLoading}>
                {isEditLoading ? (
                  <div className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Edit3 className="mr-2 h-4 w-4" />
                )}
                {isEditLoading ? "Loading..." : "Edit Menu"}
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem className="text-destructive" onClick={() => handleConfirmDelete(node)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Menu
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the menu "{itemToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              variant="destructive" 
              onClick={handleDeleteConfirmed}
            >
              Delete Menu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};