// Simple in-memory store for invalidated session IDs
// In production, this should use Redis or a database
const invalidatedSessions = new Set<string>();

export function invalidateSession(sessionId: string) {
  console.log('[InvalidSessions] Invalidating session:', sessionId);
  invalidatedSessions.add(sessionId);
}

export function isSessionInvalid(sessionId: string): boolean {
  const isInvalid = invalidatedSessions.has(sessionId);
  if (isInvalid) {
    console.log('[InvalidSessions] Session is invalid:', sessionId);
  }
  return isInvalid;
}

export function clearInvalidatedSessions() {
  invalidatedSessions.clear();
}
