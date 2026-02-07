// Test script for error handler functionality
import { defaultErrorHandler, ERROR_CODES } from '@/services/error-handler';

// Test cases for different error scenarios
const testCases = [
  // Authentication errors that should trigger redirect
  {
    name: 'Expired Token Error',
    response: {
      status: 'failure',
      status_code: '0411',
      message: 'Token has expired',
      success: false
    },
    shouldRedirect: true
  },
  {
    name: 'Invalid Token Error',
    response: {
      status: 'failure',
      status_code: '0410',
      message: 'Invalid token provided',
      success: false
    },
    shouldRedirect: true
  },
  {
    name: 'Unauthorized Error',
    response: {
      status: 'failure',
      status_code: '0401',
      message: 'Authentication required',
      success: false
    },
    shouldRedirect: true
  },
  // Non-authentication errors
  {
    name: 'Validation Error',
    response: {
      status: 'failure',
      status_code: '0421',
      message: 'Validation failed',
      success: false
    },
    shouldRedirect: false
  },
  {
    name: 'Success Response',
    response: {
      status: 'success',
      status_code: '0000',
      message: 'Operation completed successfully',
      data: { id: 1, name: 'Test User' },
      success: true
    },
    shouldRedirect: false
  }
];

console.log('🧪 Testing Error Handler Implementation\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log('Input:', JSON.stringify(testCase.response, null, 2));
  
  // Process the response
  const result = defaultErrorHandler.processApiResponse(testCase.response);
  
  console.log('Output:', JSON.stringify(result, null, 2));
  console.log('Requires Auth Redirect:', defaultErrorHandler.requiresAuthRedirect(testCase.response));
  console.log('Error Category:', defaultErrorHandler.getResponseCategory(testCase.response));
  console.log('Human Message:', defaultErrorHandler.getResponseMessage(testCase.response));
  console.log('---\n');
});

// Test error code utilities
console.log('🔧 Testing Error Code Utilities\n');

console.log('Is Authentication Error (0401):', 
  ERROR_CODES.UNAUTHORIZED, '->', 
  require('@/services/error-codes').isAuthenticationError('0401'));

console.log('Is Authentication Error (0421):', 
  ERROR_CODES.VALIDATION_ERROR, '->', 
  require('@/services/error-codes').isAuthenticationError('0421'));

console.log('Get Error Message (0401):', 
  require('@/services/error-codes').getErrorMessage('0401'));

console.log('Get Error Message (0411):', 
  require('@/services/error-codes').getErrorMessage('0411'));

console.log('\n✅ Error handler tests completed');