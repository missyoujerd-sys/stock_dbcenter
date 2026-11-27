const XOR_SALT = 'NKP_IT_STOCK_DB_QR_2569';
const TOKEN_PREFIX = 'NKP1.';

function xorBytes(bytes, salt) {
  const saltBytes = new TextEncoder().encode(salt);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    out[i] = bytes[i] ^ saltBytes[i % saltBytes.length];
  }
  return out;
}

function toBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encode username & password into a compact URL-safe token for QR Auto-Login.
 */
export function encodeAutoLoginToken(username, password) {
  const payload = JSON.stringify({ u: username.trim(), p: password });
  const rawBytes = new TextEncoder().encode(payload);
  const obfuscated = xorBytes(rawBytes, XOR_SALT);
  return `${TOKEN_PREFIX}${toBase64Url(obfuscated)}`;
}

/**
 * Decode an auto-login QR token back into { username, password }, or null if invalid.
 */
export function decodeAutoLoginToken(token) {
  if (!token || typeof token !== 'string' || !token.startsWith(TOKEN_PREFIX)) {
    return null;
  }
  try {
    const encoded = token.slice(TOKEN_PREFIX.length);
    const obfuscated = fromBase64Url(encoded);
    const rawBytes = xorBytes(obfuscated, XOR_SALT);
    const parsed = JSON.parse(new TextDecoder().decode(rawBytes));
    if (parsed && typeof parsed.u === 'string' && typeof parsed.p === 'string') {
      return { username: parsed.u, password: parsed.p };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Build the complete Auto-Login URL for QR generation.
 */
export function buildAutoLoginUrl(baseOrigin, username, password) {
  const cleanOrigin = (baseOrigin || window.location.origin).replace(/\/+$/, '');
  const token = encodeAutoLoginToken(username, password);
  return `${cleanOrigin}/login?qr=${encodeURIComponent(token)}`;
}

/**
 * Check whether an email belongs to one of the two super-admin accounts (isAdmin_2).
 */
export function isAdmin2Email(email) {
  if (!email) return false;
  const lower = email.toLowerCase();
  const env = import.meta.env;
  return (
    (Boolean(env.VITE_ADMIN_EMAIL1) && lower === env.VITE_ADMIN_EMAIL1.toLowerCase()) ||
    (Boolean(env.VITE_ADMIN_EMAIL2) && lower === env.VITE_ADMIN_EMAIL2.toLowerCase())
  );
}
