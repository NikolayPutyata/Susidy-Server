import { getEnvVar } from './getEnvVar.js';

const isSecure = getEnvVar('COOKIE_SECURE', 'false') === 'true';

export const getSessionCookieOptions = () => ({
  httpOnly: true,
  secure: isSecure,
  sameSite: isSecure ? 'none' : 'lax',
});
