// API Module Constants
// Centralized location for all API module names to ensure consistency

export const API_MODULES = {
  AUTH: 'auth',
  HRM: 'hrm',
  MAIL: 'mail',
  // Add other modules as needed
} as const;

export type ApiModule = keyof typeof API_MODULES;