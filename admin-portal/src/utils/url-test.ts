// Test file to verify URL construction
import { apiClient } from '@/services/api-client';

// Test the URL construction
console.log('Testing URL construction...');

// This would be called like:
// apiClient.post('auth', '/users/paginate', requestBody)

// For testing purposes, let's manually test the URL building logic
const testBaseUrl = 'http://localhost:8080';
const testModule = 'auth';
const testApiVersion = '/api/v1';
const testEndpoint = '/users/paginate';

// Simulate the URL construction logic
const formattedModule = testModule.startsWith('/') ? testModule : `/${testModule}`;
const baseUrl = testBaseUrl.endsWith('/') ? testBaseUrl.slice(0, -1) : testBaseUrl;
const apiVersion = testApiVersion.startsWith('/') ? testApiVersion : `/${testApiVersion}`;
const endpointPath = testEndpoint.startsWith('/') ? testEndpoint : `/${testEndpoint}`;

const constructedUrl = `${baseUrl}${formattedModule}${apiVersion}${endpointPath}`;
console.log('Constructed URL:', constructedUrl);

// Expected: http://localhost:8080/auth/api/v1/users/paginate
console.log('Expected URL: http://localhost:8080/auth/api/v1/users/paginate');
console.log('Match:', constructedUrl === 'http://localhost:8080/auth/api/v1/users/paginate');