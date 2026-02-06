// Test script for dynamic menu functionality
// Run this in the browser console after logging in

console.log('=== Dynamic Menu Test Script ===');

// Test 1: Check if menu context is available
console.log('1. Checking menu context availability...');
if (window.reloadMenu) {
  console.log('✓ Menu reload function is available globally');
} else {
  console.log('✗ Menu reload function not found');
}

// Test 2: Try to manually reload menu
console.log('2. Testing manual menu reload...');
try {
  if (window.reloadMenu) {
    window.reloadMenu().then(() => {
      console.log('✓ Manual menu reload completed');
    }).catch((error) => {
      console.log('✗ Manual menu reload failed:', error);
    });
  }
} catch (error) {
  console.log('✗ Error during manual reload test:', error);
}

// Test 3: Check localStorage for access token
console.log('3. Checking access token...');
const accessToken = localStorage.getItem('access_token');
if (accessToken) {
  console.log('✓ Access token found (first 20 chars):', accessToken.substring(0, 20) + '...');
} else {
  console.log('✗ No access token found');
}

// Test 4: Simulate menu load request event
console.log('4. Testing event-based menu loading...');
try {
  if (accessToken) {
    const event = new CustomEvent('menu-load-request', {
      detail: { accessToken }
    });
    window.dispatchEvent(event);
    console.log('✓ Menu load request event dispatched');
  } else {
    console.log('✗ Cannot test event dispatch without access token');
  }
} catch (error) {
  console.log('✗ Error during event dispatch test:', error);
}

// Test 5: Check if menu data structure is valid
console.log('5. Checking menu data structure...');
// This would require access to the React context, which isn't available in console
console.log('Note: Full menu structure validation requires React DevTools');

console.log('=== Test Script Complete ===');
console.log('Check the browser console for detailed logs and any errors.');