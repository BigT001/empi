/**
 * Simple in-memory rate limiting for admin login
 * Tracks failed login attempts per IP address
 * 
 * Production: Use Redis or distributed cache instead
 */

interface RateLimitEntry {
  attempts: number;
  firstAttemptTime: number;
  lockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const MAX_ATTEMPTS = 5;           // Max attempts
const TIME_WINDOW = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes lockout after max attempts

/**
 * Check if an IP address is rate limited
 */
export function isRateLimited(ipAddress: string): boolean {
  const entry = rateLimitStore.get(ipAddress);
  
  if (!entry) {
    return false;
  }

  // Check if lockout period has expired
  if (entry.lockedUntil && Date.now() > entry.lockedUntil) {
    console.log(`[RateLimit] Lockout expired for IP: ${ipAddress}`);
    rateLimitStore.delete(ipAddress);
    return false;
  }

  // Check if currently locked
  if (entry.lockedUntil) {
    const minutesLeft = Math.ceil((entry.lockedUntil - Date.now()) / 60000);
    console.log(`[RateLimit] ⚠️ IP locked: ${ipAddress} (${minutesLeft} minutes remaining)`);
    return true;
  }

  // Check if time window has expired
  if (Date.now() - entry.firstAttemptTime > TIME_WINDOW) {
    console.log(`[RateLimit] Time window expired for IP: ${ipAddress}`);
    rateLimitStore.delete(ipAddress);
    return false;
  }

  return false;
}

/**
 * Record a failed login attempt
 */
export function recordFailedAttempt(ipAddress: string): void {
  const entry = rateLimitStore.get(ipAddress) || {
    attempts: 0,
    firstAttemptTime: Date.now(),
  };

  entry.attempts += 1;
  console.log(`[RateLimit] Failed attempt ${entry.attempts}/${MAX_ATTEMPTS} for IP: ${ipAddress}`);

  // Lock account after max attempts
  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION;
    console.log(`[RateLimit] 🔒 IP locked for 30 minutes: ${ipAddress}`);
  }

  rateLimitStore.set(ipAddress, entry);
}

/**
 * Clear rate limit for an IP (called on successful login)
 */
export function clearRateLimit(ipAddress: string): void {
  if (rateLimitStore.has(ipAddress)) {
    console.log(`[RateLimit] ✅ Cleared rate limit for IP: ${ipAddress}`);
    rateLimitStore.delete(ipAddress);
  }
}

/**
 * Get remaining time for lockout (in milliseconds)
 */
export function getLockoutRemainingTime(ipAddress: string): number {
  const entry = rateLimitStore.get(ipAddress);
  
  if (!entry || !entry.lockedUntil) {
    return 0;
  }

  const remaining = entry.lockedUntil - Date.now();
  return remaining > 0 ? remaining : 0;
}

/**
 * Get remaining attempts before lockout
 */
export function getRemainingAttempts(ipAddress: string): number {
  const entry = rateLimitStore.get(ipAddress);
  
  if (!entry) {
    return MAX_ATTEMPTS;
  }

  // Reset if time window expired
  if (Date.now() - entry.firstAttemptTime > TIME_WINDOW) {
    rateLimitStore.delete(ipAddress);
    return MAX_ATTEMPTS;
  }

  return Math.max(0, MAX_ATTEMPTS - entry.attempts);
}

/**
 * Cleanup: Remove expired entries (call periodically)
 * In production, this would be handled by Redis TTL
 */
export function cleanupExpiredEntries(): void {
  let cleaned = 0;
  for (const [ip, entry] of rateLimitStore.entries()) {
    // Remove if time window expired and not locked
    if (!entry.lockedUntil && Date.now() - entry.firstAttemptTime > TIME_WINDOW) {
      rateLimitStore.delete(ip);
      cleaned++;
    }
    // Remove if lockout expired
    else if (entry.lockedUntil && Date.now() > entry.lockedUntil) {
      rateLimitStore.delete(ip);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[RateLimit] Cleaned up ${cleaned} expired entries`);
  }
}

// Cleanup every 10 minutes
setInterval(cleanupExpiredEntries, 10 * 60 * 1000);
