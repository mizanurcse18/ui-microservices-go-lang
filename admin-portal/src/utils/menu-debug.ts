// Utility functions for debugging menu loading issues

export const testMenuLoading = async () => {
  console.log('=== Menu Loading Debug Test ===');
  
  // Check if access token exists
  const accessToken = localStorage.getItem('access_token');
  console.log('Access token exists:', !!accessToken);
  if (accessToken) {
    console.log('Token preview:', accessToken.substring(0, 20) + '...');
  }
  
  // Check if menu context is available
  const menuContext = (window as any).menuContext;
  console.log('Menu context available:', !!menuContext);
  
  // Try to manually trigger menu load
  if (accessToken) {
    console.log('Attempting manual menu load...');
    try {
      // Import and test the auth service directly
      const authModule = await import('@/services/modules/auth/auth-service');
      const authServiceInstance = new authModule.AuthService();
      
      console.log('Calling authService.getMenu()...');
      const menuResult = await authServiceInstance.getMenu();
      console.log('Menu API result:', menuResult);
      
      if (menuResult.success && menuResult.data) {
        console.log('Menu data received:', menuResult.data.length, 'items');
        console.log('Sample menu item:', menuResult.data[0]);
      } else {
        console.error('Menu API failed:', menuResult.error);
      }
    } catch (error) {
      console.error('Error testing menu loading:', error);
    }
  }
  
  console.log('=== End Debug Test ===');
};

// Add to window for easy access
if (typeof window !== 'undefined') {
  (window as any).testMenuLoading = testMenuLoading;
}