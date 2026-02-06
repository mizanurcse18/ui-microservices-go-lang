// URL Utility Functions
export class UrlUtils {
  // Normalize a URL component to ensure proper formatting
  static normalizePath(path: string): string {
    if (!path) return '';
    
    // Remove trailing slashes
    let normalized = path.endsWith('/') ? path.slice(0, -1) : path;
    
    // Ensure leading slash for path components (but not for full URLs)
    if (!normalized.startsWith('http') && !normalized.startsWith('/')) {
      normalized = `/${normalized}`;
    }
    
    return normalized;
  }

  // Join URL components with proper slash handling
  static joinUrlParts(...parts: string[]): string {
    if (parts.length === 0) return '';
    
    return parts
      .map((part, index) => {
        if (index === 0) {
          // First part (base URL) - remove trailing slash
          return part.endsWith('/') ? part.slice(0, -1) : part;
        } else {
          // Other parts - ensure leading slash, remove trailing slash
          return this.normalizePath(part);
        }
      })
      .join('');
  }

  // Build complete API URL
  static buildApiUrl(baseUrl: string, module: string, apiVersion: string, endpoint: string): string {
    return this.joinUrlParts(baseUrl, module, apiVersion, endpoint);
  }
}