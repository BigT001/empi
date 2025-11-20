// Simple client-side error tracking utility
// Logs errors to an API endpoint and stores locally

type ErrorContext = {
  page?: string;
  action?: string;
  userAgent?: string;
  url?: string;
  [key: string]: any;
};

export class ErrorTracker {
  private static readonly API_ENDPOINT = '/api/errors';
  private static readonly STORAGE_KEY = 'empi_errors';
  private static readonly MAX_LOCAL_ERRORS = 50;

  /**
   * Log an error with optional context
   */
  static async logError(
    type: string,
    message: string,
    error?: Error | unknown,
    context?: ErrorContext
  ): Promise<void> {
    try {
      const stack = error instanceof Error ? error.stack : undefined;
      const errorData = {
        type,
        message,
        stack,
        context: context || {},
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        url: typeof window !== 'undefined' ? window.location.href : '',
        timestamp: new Date().toISOString(),
      };

      // Log to console in development - use appropriate log level
      if (process.env.NODE_ENV === 'development') {
        const isSuccess = type.includes('success') || type.includes('Success');
        const isWarning = type.includes('warning') || type.includes('Warning');
        
        if (isSuccess) {
          console.log(`[${type}]`, message, { context });
        } else if (isWarning) {
          console.warn(`[${type}]`, message, { error, context });
        } else {
          console.error(`[${type}]`, message, { error, context });
        }
      }

      // Save to localStorage (for offline support)
      this.saveToLocalStorage(errorData);

      // Send to API (non-blocking)
      this.sendToAPI(errorData).catch((err) => {
        console.warn('Failed to send error to API:', err);
      });
    } catch (err) {
      console.error('Error in ErrorTracker.logError:', err);
    }
  }

  /**
   * Log mobile-specific upload errors
   */
  static logMobileUploadError(
    message: string,
    error?: Error | unknown,
    fileInfo?: {
      fileName?: string;
      fileSize?: number;
      fileType?: string;
      imageCount?: number;
    }
  ): void {
    this.logError('mobile_upload', message, error, {
      page: 'admin',
      action: 'image_upload',
      ...fileInfo,
    });
  }

  /**
   * Log image compression errors
   */
  static logCompressionError(
    message: string,
    error?: Error | unknown,
    imageInfo?: {
      originalSize?: number;
      imageIndex?: number;
      mimeType?: string;
    }
  ): void {
    this.logError('image_compression', message, error, {
      page: 'admin',
      action: 'compress_image',
      ...imageInfo,
    });
  }

  /**
   * Get all logged errors from localStorage
   */
  static getLocalErrors(): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear all logged errors from localStorage
   */
  static clearLocalErrors(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  /**
   * Get errors of a specific type
   */
  static getErrorsByType(type: string): any[] {
    return this.getLocalErrors().filter((err) => err.type === type);
  }

  /**
   * Get most recent errors
   */
  static getRecentErrors(limit = 10): any[] {
    return this.getLocalErrors().slice(-limit);
  }

  // Private methods

  private static saveToLocalStorage(errorData: any): void {
    try {
      const errors = this.getLocalErrors();
      errors.push(errorData);

      // Keep only recent errors (max 50)
      const trimmed = errors.slice(-this.MAX_LOCAL_ERRORS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
    } catch (err) {
      console.warn('Failed to save error to localStorage:', err);
    }
  }

  private static async sendToAPI(errorData: any): Promise<void> {
    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      });

      if (!response.ok) {
        console.warn(`API error log response: ${response.status}`);
      }
    } catch (err) {
      // Network error, will be retried on next sync
      console.warn('Network error logging to API:', err);
    }
  }
}
