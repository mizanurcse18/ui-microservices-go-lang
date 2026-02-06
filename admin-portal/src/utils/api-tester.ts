import { authService } from '@/services';

/**
 * Test function to verify the API integration is working
 */
export async function testApiIntegration() {
  try {
    console.log('Testing API integration...');
    
    // Test login with sample credentials
    const response = await authService.login({
      username: 'mizan', // Use the sample from the curl command
      password: 'Mizan@123',
    });
    
    if (response.success && response.data) {
      console.log('✅ Login successful!');
      console.log('Access token length:', response.data.access_token?.length);
      console.log('Refresh token length:', response.data.refresh_token?.length);
      console.log('User data:', response.data.user);
      return true;
    } else {
      console.error('❌ Login failed:', response.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error during API test:', error);
    return false;
  }
}