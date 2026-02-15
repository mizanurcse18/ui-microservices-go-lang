import { AuthModel, UserModel } from '@/auth/lib/models';
import { supabase } from '@/lib/supabase';
import { authService } from '@/services';

/**
 * Supabase adapter that maintains the same interface as the existing auth flow
 * but uses Supabase under the hood.
 */
export const SupabaseAdapter = {
  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthModel> {
    console.log('SupabaseAdapter: Attempting login with email:', email);

    try {
      // Use the new API service for login
      // The API expects username, which could be email or actual username
      const loginResponse = await authService.login({
        username: email, // Backend likely expects username field (may accept email)
        password,
      });

      if (!loginResponse.success || !loginResponse.data) {
        console.error('SupabaseAdapter: Login error from API:', loginResponse.error);
        
        // Check if this is a user credential error (don't fallback in this case)
        if (loginResponse.error && (
          loginResponse.error.includes('Invalid username') || 
          loginResponse.error.includes('Invalid credentials') ||
          loginResponse.error.includes('Invalid password')
        )) {
          // Don't fallback for credential errors, throw the original error
          throw new Error(loginResponse.error || 'Invalid username or password');
        }
        
        console.warn('Falling back to Supabase authentication...');
        
        // Fallback to Supabase if API login fails for other reasons
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('SupabaseAdapter: Login error from Supabase:', error);
          throw new Error(error.message);
        }

        // Transform Supabase session to AuthModel
        return {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        };
      }

      console.log(
        'SupabaseAdapter: Login successful, tokens received:',
        {
          access_token_length: loginResponse.data.access_token?.length,
          refresh_token_length: loginResponse.data.refresh_token?.length,
        }
      );

      // Store user information from the API response
      if (loginResponse.data.user) {
        // Store user data in localStorage for later retrieval
        localStorage.setItem('api_user_data', JSON.stringify(loginResponse.data.user));
      }
      
      // Store both access and refresh tokens in localStorage
      localStorage.setItem('access_token', loginResponse.data.access_token);
      localStorage.setItem('refresh_token', loginResponse.data.refresh_token);
      
      console.log('Login successful, attempting to load dynamic menu');
      // Load dynamic menu after successful login
      SupabaseAdapter.loadDynamicMenu(loginResponse.data.access_token);
      
      // Transform API response to AuthModel
      return {
        access_token: loginResponse.data.access_token,
        refresh_token: loginResponse.data.refresh_token,
      };
    } catch (error) {
      console.error('SupabaseAdapter: Unexpected login error:', error);
      throw error;
    }
  },

  /**
   * Login with OAuth provider (Google, GitHub, etc.)
   */
  async signInWithOAuth(
    provider:
      | 'google'
      | 'github'
      | 'facebook'
      | 'twitter'
      | 'discord'
      | 'slack',
    options?: { redirectTo?: string },
  ): Promise<void> {
    console.log(
      'SupabaseAdapter: Initiating OAuth flow with provider:',
      provider,
    );

    try {
      const redirectTo =
        options?.redirectTo || `${window.location.origin}/auth/callback`;

      console.log('SupabaseAdapter: Using redirect URL:', redirectTo);

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (error) {
        console.error('SupabaseAdapter: OAuth error:', error);
        throw new Error(error.message);
      }

      console.log('SupabaseAdapter: OAuth flow initiated successfully');

      // No need to return anything - the browser will be redirected
    } catch (error) {
      console.error('SupabaseAdapter: Unexpected OAuth error:', error);
      throw error;
    }
  },

  /**
   * Register a new user
   */
  async register(
    email: string,
    password: string,
    password_confirmation: string,
    firstName?: string,
    lastName?: string,
  ): Promise<AuthModel> {
    if (password !== password_confirmation) {
      throw new Error('Passwords do not match');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: email.split('@')[0], // Default username from email
          first_name: firstName || '',
          last_name: lastName || '',
          fullname:
            firstName && lastName ? `${firstName} ${lastName}`.trim() : '',
          created_at: new Date().toISOString(),
        },
      },
    });

    if (error) throw new Error(error.message);

    // Return empty tokens if email confirmation is required
    if (!data.session) {
      return {
        access_token: '',
        refresh_token: '',
      };
    }

    // Transform Supabase session to AuthModel
    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    console.log('Requesting password reset for:', email);

    try {
      // Ensure the redirect URL is properly formatted with a hash for token
      const redirectUrl = `${window.location.origin}/auth/reset-password`;
      console.log('Using redirect URL:', redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error('Password reset request error:', error);
        throw new Error(error.message);
      }

      console.log('Password reset email sent successfully');
    } catch (err) {
      console.error('Unexpected error in password reset:', err);
      throw err;
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(
    password: string,
    password_confirmation: string,
  ): Promise<void> {
    if (password !== password_confirmation) {
      throw new Error('Passwords do not match');
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) throw new Error(error.message);
  },

  /**
   * Request another verification email
   */
  async resendVerificationEmail(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/verify-email`,
      },
    });

    if (error) throw new Error(error.message);
  },

  /**
   * Get current user from the session
   */
  async getCurrentUser(): Promise<UserModel | null> {
    // Try to get user data from API storage first
    const userDataStr = localStorage.getItem('api_user_data');
    if (userDataStr) {
      try {
        const apiUserData = JSON.parse(userDataStr);
        // Map API user data to UserModel
        return {
          username: apiUserData.username || '',
          email: '', // Email not provided by API, use empty string or get from elsewhere
          first_name: '', // Not provided by API
          last_name: '', // Not provided by API
          email_verified: true, // Assume verified since they logged in
          occupation: '',
          company_name: '',
          phone: '',
          roles: [apiUserData.role], // Convert role string to array
          pic: '',
          language: 'en',
          is_admin: apiUserData.role === 'admin',
        };
      } catch (e) {
        console.error('Error parsing user data from API:', e);
      }
    }
    
    // Fallback to Supabase if API user data not available
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;

    return this.getUserProfile();
  },

  /**
   * Get user profile from user metadata
   */
  async getUserProfile(): Promise<UserModel> {
    // Try to get user data from API storage first
    const userDataStr = localStorage.getItem('api_user_data');
    if (userDataStr) {
      try {
        const apiUserData = JSON.parse(userDataStr);
        // Map API user data to UserModel
        return {
          username: apiUserData.username || '',
          email: '', // Email not provided by API, use empty string or get from elsewhere
          first_name: '', // Not provided by API
          last_name: '', // Not provided by API
          email_verified: true, // Assume verified since they logged in
          occupation: '',
          company_name: '',
          phone: '',
          roles: [apiUserData.role], // Convert role string to array
          pic: '',
          language: 'en',
          is_admin: apiUserData.role === 'admin',
        };
      } catch (e) {
        console.error('Error parsing user data from API:', e);
      }
    }
    
    // Fallback to Supabase if API user data not available
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) throw new Error(error?.message || 'User not found');

    // Get user metadata and transform to UserModel format
    const metadata = user.user_metadata || {};

    // Format data to maintain compatibility with existing UI
    return {
      username: metadata.username || '',
      email: user.email || '',
      first_name: metadata.first_name || '',
      last_name: metadata.last_name || '',
      email_verified: user.email_confirmed_at !== null,
      occupation: metadata.occupation || '',
      company_name: metadata.company_name || '',
      phone: metadata.phone || '',
      roles: metadata.roles || [],
      pic: metadata.pic || '',
      language: metadata.language || 'en',
      is_admin: metadata.is_admin || false,
    };
  },

  /**
   * Update user profile (stored in metadata)
   */
  async updateUserProfile(userData: Partial<UserModel>): Promise<UserModel> {
    // Transform from UserModel to metadata format
    const metadata: Record<string, unknown> = {
      username: userData.username,
      first_name: userData.first_name,
      last_name: userData.last_name,
      fullname:
        userData.fullname ||
        `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
      occupation: userData.occupation,
      company_name: userData.company_name,
      phone: userData.phone,
      roles: userData.roles,
      pic: userData.pic,
      language: userData.language,
      is_admin: userData.is_admin,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined fields
    Object.keys(metadata).forEach((key) => {
      if (metadata[key] === undefined) {
        delete metadata[key];
      }
    });

    // Update user metadata
    const { error } = await supabase.auth.updateUser({
      data: metadata,
    });

    if (error) throw new Error(error.message);

    return this.getCurrentUser() as Promise<UserModel>;
  },

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    // Get the refresh token before clearing local storage
    const refreshToken = localStorage.getItem('refresh_token');
    
    // Clear API user data from localStorage
    localStorage.removeItem('api_user_data');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Call the API logout endpoint with refresh token if available
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch (error) {
        console.error('API logout failed:', error);
        // Continue with signout even if API logout fails
      }
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  /**
   * Load dynamic menu after successful login
   */
  async loadDynamicMenu(accessToken?: string): Promise<void> {
    try {
      // Use provided token or get from localStorage
      const token = accessToken || localStorage.getItem('access_token');
      
      if (!token) {
        console.warn('No access token available for menu loading');
        return;
      }
      
      console.log('Dispatching menu load request with token:', token.substring(0, 20) + '...');
      
      // Dispatch a custom event that the menu context can listen to
      window.dispatchEvent(new CustomEvent('menu-load-request', { 
        detail: { accessToken: token } 
      }));
      console.log('Menu load request dispatched successfully');
    } catch (error) {
      console.error('Error dispatching menu load request:', error);
    }
  },
};
