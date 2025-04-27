/**
 * Security utility functions for WSB Trading application
 */

/**
 * Check if the current connection is secure (HTTPS)
 * @returns boolean indicating if the connection is secure
 */
export const isSecureConnection = (): boolean => {
  return window.location.protocol === 'https:';
};

/**
 * Redirect to HTTPS if currently on HTTP
 * @returns void
 */
export const enforceHTTPS = (): void => {
  if (
    window.location.protocol !== 'https:' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    window.location.href = window.location.href.replace('http:', 'https:');
  }
};

/**
 * Check if the current origin is allowed based on CSP
 * @param url - The URL to check
 * @returns boolean indicating if the origin is allowed
 */
export const isAllowedOrigin = (url: string): boolean => {
  // Add your allowed domains here
  const allowedOrigins = [
    'cdn.tailwindcss.com',
    'cdnjs.cloudflare.com',
    window.location.hostname
  ];
  
  try {
    const urlObj = new URL(url);
    return allowedOrigins.includes(urlObj.hostname);
  } catch {
    return false;
  }
};
