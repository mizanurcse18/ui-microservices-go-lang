import { BaseApiService, type ApiResponse } from '../base-api-service';
import { API_MODULES } from '@/config/api-modules';

interface LoginRequest {
  username: string; // API accepts username which could be email
  password: string;
}

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

interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

interface MenuResponse {
  id: string;
  title: string;
  path?: string;
  icon?: string;
  disabled?: boolean;
  heading?: string;
  collapse?: boolean;
  collapseTitle?: string;
  expandTitle?: string;
  children?: MenuResponse[];
}

class AuthService extends BaseApiService {
  private static instance: AuthService;
  
  private constructor(apiVersion: string = 'v1') {
    // Use the base URL with the API version path
    super(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080', apiVersion);
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return await this.postModule<LoginResponse, LoginRequest>('auth', 'login', credentials);
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<any>> {
    return await this.postModule('auth', 'register', userData);
  }

  async forgotPassword(request: ForgotPasswordRequest): Promise<ApiResponse<any>> {
    return await this.postModule('auth', 'forgot-password', request);
  }

  async resetPassword(request: ResetPasswordRequest): Promise<ApiResponse<any>> {
    return await this.postModule('auth', 'reset-password', request);
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<LoginResponse>> {
    return await this.postModule<LoginResponse, { refresh_token: string }>('auth', 'refresh', { refresh_token: refreshToken });
  }

  async logout(refreshToken: string): Promise<ApiResponse<any>> {
    return await this.postModule('auth', 'logout', { refresh_token: refreshToken });
  }

  async verifyEmail(token: string): Promise<ApiResponse<any>> {
    // For GET requests with query params, we can still use the regular get method
    return await this.get(`/auth/api/v1/verify-email?token=${token}`);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<any>> {
    return await this.postModule('auth', 'change-password', {
      currentPassword,
      newPassword
    });
  }

  async getMenu(): Promise<ApiResponse<MenuResponse[]>> {
    console.log('Getting menu...');
    return await this.get<MenuResponse[]>(`/auth/api/v1/menus`);
  }
}

// Singleton instance
const authService = AuthService.getInstance();

export { authService, AuthService, type LoginRequest, type LoginResponse, type RegisterRequest };