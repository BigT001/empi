// Free error tracking - no subscriptions needed
import { ErrorTracker } from "./errorTracker";

export const captureImageUploadError = (error: Error, context: {
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  step?: 'reading' | 'compressing' | 'uploading' | 'validation';
}) => {
  const device = getDeviceType();
  ErrorTracker.logMobileUploadError(
    `${context.step || 'unknown'} error: ${error.message}`,
    error,
    {
      fileName: context.fileName,
      fileSize: context.fileSize,
      fileType: context.fileType,
      imageCount: 1,
    }
  );

  // Also log to console in development
  console.error(`[${device}] Image upload error at step "${context.step}":`, {
    message: error.message,
    fileName: context.fileName,
    fileSize: context.fileSize,
    fileType: context.fileType,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  });
};

export const captureUploadSuccess = (fileCount: number, totalSize: number) => {
  const device = getDeviceType();
  console.log(`✅ [${device}] Product uploaded: ${fileCount} images, ${totalSize} bytes`);

  // Log successful upload for analytics
  ErrorTracker.logError(
    'upload_success',
    `Product uploaded with ${fileCount} images`,
    undefined,
    {
      page: 'admin',
      action: 'product_upload',
      imageCount: fileCount,
      totalSize: totalSize,
      device: device,
    }
  );
};

export const getDeviceType = () => {
  if (typeof navigator === 'undefined') return 'unknown';
  
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/mobile/.test(ua)) return 'mobile';
  return 'desktop';
};
