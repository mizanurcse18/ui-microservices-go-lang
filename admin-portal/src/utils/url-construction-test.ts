// Test URL construction after fix
import { BaseApiService } from '@/services/modules/base-api-service';

class TestService extends BaseApiService {
  constructor() {
    super('http://localhost:8080', 'v1');
  }
  
  testUrlConstruction() {
    // Test the buildUrl method with a module-based endpoint
    const url = this.buildUrl('/auth/api/v1/users/paginate');
    console.log('Test URL:', url);
    return url;
  }
}

// Run the test
const testService = new TestService();
const resultUrl = testService.testUrlConstruction();
console.log('Expected: http://localhost:8080/auth/api/v1/users/paginate');
console.log('Actual:   ', resultUrl);
console.log('Match:', resultUrl === 'http://localhost:8080/auth/api/v1/users/paginate');