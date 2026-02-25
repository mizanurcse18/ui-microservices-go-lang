import { useState, useEffect } from 'react';
import { Plus, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MenuTreeView } from './components/menu-tree-view';
import { MenuForm } from './components/menu-form';
import { menuService, type MenuItem } from '@/services/modules/menu';
import { ContentLoader } from '@/components/common/content-loader';
import { toast } from 'sonner';

export function MenuManagementPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddMenuDialogOpen, setIsAddMenuDialogOpen] = useState<boolean>(false);
  const [isEditMenuDialogOpen, setIsEditMenuDialogOpen] = useState<boolean>(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | number | null>(null);
  const [isEditLoading, setIsEditLoading] = useState<boolean>(false);

  // Load menus on component mount
  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await menuService.getMenusTree();
      
      if (response.success && response.data) {
        setMenus(response.data);
      } else {
        setError(response.error || 'Failed to load menus');
        toast.error(response.error || 'Failed to load menus');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      toast.error('Failed to load menus');
      console.error('Error loading menus:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (node: MenuItem) => {
    console.log('Node clicked:', node);
  };

  const handleNodeContextMenu = (_event: React.MouseEvent, node: MenuItem) => {
    console.log('Context menu opened for:', node);
  };

  const handleAddChild = (parentId: string | number) => {
    setSelectedParentId(parentId);
    setEditingMenu(null);
    setIsAddMenuDialogOpen(true);
  };

  const handleEdit = async (node: MenuItem) => {
    try {
      setIsEditLoading(true);
      const response = await menuService.getMenuById(node.id || '');
      
      if (response.success && response.data) {
        setEditingMenu(response.data);
        setIsEditMenuDialogOpen(true);
      } else {
        toast.error(response.error || 'Failed to load menu data');
      }
    } catch (error) {
      console.error('Error loading menu for edit:', error);
      toast.error('Failed to load menu data');
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDelete = async (node: MenuItem) => {
    try {
      const response = await menuService.deleteMenu(node.id || '');
      if (response.success) {
        toast.success(`Menu "${node.title}" deleted successfully`);
        loadMenus(); // Refresh the menu tree
      } else {
        toast.error(response.error || 'Failed to delete menu');
      }
    } catch (error) {
      console.error('Error deleting menu:', error);
      toast.error('Failed to delete menu');
    }
  };

  const handleMenuSave = (savedMenu: MenuItem) => {
    toast.success(`Menu "${savedMenu.title}" saved successfully`);
    loadMenus(); // Refresh the menu tree
    setIsAddMenuDialogOpen(false);
    setIsEditMenuDialogOpen(false);
    setEditingMenu(null);
    setSelectedParentId(null);
  };

  const handleChangeParent = async (sourceNodeId: string | number, newParentId: string | number | null) => {
    try {
      // Find the source node to get its current data
      const findNode = (nodes: MenuItem[], id: string | number): MenuItem | null => {
        for (const node of nodes) {
          if (node.id === id) return node;
          if (node.children) {
            const found = findNode(node.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const sourceNode = findNode(menus, sourceNodeId);
      if (!sourceNode) {
        toast.error('Menu item not found');
        return;
      }

      // Check if trying to set a node as its own parent
      if (sourceNodeId === newParentId) {
        toast.error('Cannot set a menu as its own parent');
        return;
      }

      // Check for circular dependency - preventing a node from becoming a child of its own child
      const isDescendant = (parentNodes: MenuItem[], targetId: string | number): boolean => {
        for (const node of parentNodes) {
          if (node.id === targetId) return true;
          if (node.children && isDescendant(node.children, targetId)) return true;
        }
        return false;
      };

      if (sourceNode.children && isDescendant(sourceNode.children, newParentId || '')) {
        toast.error('Cannot move menu to its own child');
        return;
      }

      console.log('Moving menu:', {
        sourceId: sourceNodeId,
        sourceTitle: sourceNode.title,
        newParentId: newParentId
      });

      // Use the new change-parent endpoint
      const response = await menuService.changeMenuParent(sourceNodeId, newParentId);
      if (response.success) {
        toast.success(`Menu "${sourceNode.title}" moved successfully`);
        loadMenus(); // Refresh the menu tree
      } else {
        toast.error(response.error || 'Failed to move menu');
      }
    } catch (error) {
      console.error('Error changing parent:', error);
      toast.error('Failed to move menu');
    }
  };

  const handleRefresh = () => {
    loadMenus();
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
          <div className="mt-2">
            <Button onClick={loadMenus} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
        <div className="flex space-x-3">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setIsAddMenuDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Menu
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menu Tree Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 min-h-[500px]">
            {menus.length > 0 ? (
              <MenuTreeView
                data={menus}
                onNodeClick={handleNodeClick}
                onNodeContextMenu={handleNodeContextMenu}
                onAddChild={handleAddChild}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onChangeParent={handleChangeParent}
                isEditLoading={isEditLoading}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <FileText className="h-12 w-12 mb-3" />
                <p>No menus found. Create your first menu using the "Add Menu" button.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Menu Dialog */}
      <MenuForm
        open={isAddMenuDialogOpen}
        onOpenChange={setIsAddMenuDialogOpen}
        parentId={selectedParentId}
        onSave={handleMenuSave}
        parents={menus}
      />

      {/* Edit Menu Dialog */}
      <MenuForm
        open={isEditMenuDialogOpen}
        onOpenChange={setIsEditMenuDialogOpen}
        menu={editingMenu || undefined}
        onSave={handleMenuSave}
        parents={menus}
      />
    </div>
  );
}