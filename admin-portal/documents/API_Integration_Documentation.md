# API Integration Documentation

## Overview

This document outlines the changes made to integrate a custom API for authentication in place of the default Supabase authentication. The implementation allows the application to use a custom backend API while maintaining the existing frontend structure and fallback capabilities.

## Changes Made

### 1. Service Architecture Updates

#### Modular Service Structure
- Created a modular service architecture in `src/services/modules/`
- Implemented base API service with generic HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Added API versioning support (v1, v2, v3 capability)
- Implemented automatic authentication token injection

#### Auth Module
- Created dedicated auth module at `src/services/modules/auth/`
- Implemented `AuthService` with methods for login, registration, password reset, etc.
- Configured base URL to follow the pattern: `http://localhost:8080/auth/api/v1`

### 2. API Response Handling

#### Base API Service Enhancement (`src/services/modules/base-api-service.ts`)
- Updated `handleResponse` method to handle nested API response structure
- Added support for responses with format: `{ status: "success", data: {...}, message: "..." }`
- Implemented proper extraction of data from the nested `data` field when status is "success"
- Added comprehensive error handling for various response scenarios
- Added debug logging for troubleshooting network requests

#### URL Construction
- Updated `buildUrl` method to properly construct URLs with API versioning
- URLs follow the pattern: `{BASE_URL}/{module}/api/{version}{endpoint}`
- Example: `http://localhost:8080/auth/api/v1/login`

### 3. Authentication Adapter Updates

#### Supabase Adapter Modification (`src/auth/adapters/supabase-adapter.ts`)
- Modified the `login` function to use the custom API service instead of Supabase
- Changed from `supabase.auth.signInWithPassword()` to `authService.login()`
- Updated to send credentials in the format expected by the custom API: `{ username: email, password }`
- Added fallback mechanism to use Supabase authentication if the custom API fails
- Updated `getCurrentUser` and `getUserProfile` methods to prioritize API user data
- Modified `logout` method to clear API user data from localStorage
- Added localStorage management for API user data

### 4. Environment Configuration

#### Updated .env File
- Added `VITE_API_BASE_URL=http://localhost:8080` to configure the base API URL
- Maintains Supabase configuration for fallback functionality

### 5. Data Model Updates

#### Auth Service Interfaces (`src/services/modules/auth/auth-service.ts`)
- Updated `LoginRequest` interface to expect `username` field instead of `email`
- Updated `LoginResponse` interface to match the actual API response structure:
  ```typescript
  interface LoginResponse {
    access_token: string;
    refresh_token: string;
    user: {
      active: boolean;
      id: string;
      role: string;
      username: string;
    };
  }
  ```

#### User Profile Mapping
- Updated user profile mapping to handle API response format
- Maps API user data to the existing `UserModel` interface
- Handles missing fields with appropriate defaults

### 6. Error Handling and Fallback Mechanism

#### Graceful Degradation
- Implemented fallback to Supabase authentication if custom API fails
- Added comprehensive error logging for debugging
- Maintains existing user experience even if custom API is unavailable

#### Network Error Handling
- Added try-catch blocks around all API calls
- Implemented proper error propagation to the UI
- Added user-friendly error messages

## API Endpoint Details

### Login Endpoint
- **URL**: `http://localhost:8080/auth/api/v1/login`
- **Method**: POST
- **Request Body**:
  ```json
  {
    "username": "user@example.com",
    "password": "user_password"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": "success",
    "status_code": "0000",
    "message": "Login successful",
    "data": {
      "access_token": "jwt_access_token",
      "refresh_token": "jwt_refresh_token",
      "user": {
        "active": true,
        "id": "user_id",
        "role": "user_role",
        "username": "username"
      }
    }
  }
  ```

## Implementation Notes

### User Data Storage
- API user data is stored in localStorage under the key `'api_user_data'`
- This allows retrieval of user information without additional API calls
- Data is cleared on logout

### Token Management
- Access and refresh tokens are managed through the existing auth helper system
- Tokens are stored in localStorage using the existing mechanism
- Maintains compatibility with existing auth flow

### Backward Compatibility
- All existing interfaces and contracts are maintained
- Existing Supabase functionality remains as fallback
- No breaking changes to the component layer

## Files Modified

1. `src/services/modules/base-api-service.ts` - Enhanced API response handling
2. `src/services/modules/auth/auth-service.ts` - Updated API interfaces
3. `src/auth/adapters/supabase-adapter.ts` - Modified authentication logic
4. `.env` - Added API base URL configuration
5. `src/utils/api-tester.ts` - Added API testing utility (optional)

## Testing the Integration

### Manual Testing
1. Ensure your backend server is running on `http://localhost:8080`
2. Navigate to the login page (`/auth/signin`)
3. Enter valid credentials that work with your backend API
4. Verify that login succeeds and tokens are stored properly
5. Check that user information is retrieved correctly

### Debugging
- Enable browser console logging to see API request/response details
- Check localStorage for stored tokens and user data
- Verify the backend API endpoint is accessible with the curl command:
  ```bash
  curl --location 'http://localhost:8080/auth/api/v1/login' \
  --header 'Content-Type: application/json' \
  --data-raw '{"username":"mizan","password":"Mizan@123"}'
  ```

## Troubleshooting

### Common Issues

1. **"Failed to fetch" Error**
   - Backend server may not be running
   - CORS policy may be blocking requests
   - Network connectivity issues

2. **CORS Errors**
   - Configure your backend to allow requests from your frontend origin
   - Example for Express.js:
     ```javascript
     app.use(cors({
       origin: ['http://localhost:5173', 'http://localhost:3000'] // your frontend URL
     }));
     ```

3. **Authentication Fails**
   - Verify the username/password combination works with your backend
   - Check that the API response format matches expectations
   - Confirm the backend is returning the correct structure

### Fallback Behavior
If the custom API fails, the system will automatically fall back to Supabase authentication, allowing the application to continue functioning while you resolve backend issues.