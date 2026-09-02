/**
 * Syncs the JWT token to a plain cookie so Next.js Edge middleware
 * can read it for server-side route protection.
 *
 * Intentionally NOT HttpOnly : we need JS to set/clear it from the client.
 * The token itself is already validated by the backend on every API call,
 * so this cookie is used only for middleware route gating, not auth trust.
 */

const COOKIE_NAME = "token";
// 7 days : match your JWT expiry
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function setAuthCookie(token: string) {
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearAuthCookie() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}