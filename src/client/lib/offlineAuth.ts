const offlineAuthKey = 'offlineAuth';

export interface OfflineAuthRecord {
  email: string;
  user: { id: string; name: string; email: string };
  salt: string;
  hash: string;
  lastLogin: number;
}

function encodeBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function generateSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return encodeBase64(bytes.buffer);
}

async function hashCredentials(email: string, password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const normalized = `${salt}:${email.toLowerCase()}:${password}`;
  const data = encoder.encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return encodeBase64(digest);
}

export function getOfflineAuth(): OfflineAuthRecord | null {
  const stored = localStorage.getItem(offlineAuthKey);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as OfflineAuthRecord;
  } catch {
    return null;
  }
}

export async function storeOfflineAuth(
  email: string,
  password: string,
  user: { id: string; name: string; email: string },
): Promise<void> {
  const salt = generateSalt();
  const hash = await hashCredentials(email, password, salt);
  const record: OfflineAuthRecord = {
    email: email.toLowerCase(),
    user,
    salt,
    hash,
    lastLogin: Date.now(),
  };
  localStorage.setItem(offlineAuthKey, JSON.stringify(record));
}

export async function validateOfflineLogin(email: string, password: string) {
  const record = getOfflineAuth();
  if (!record) {
    throw new Error("Internet connection is required for the first login.");
  }

  if (record.email !== email.toLowerCase()) {
    throw new Error("No offline credentials found for this account.");
  }

  const hash = await hashCredentials(email, password, record.salt);
  if (hash !== record.hash) {
    throw new Error("Invalid email or password.");
  }

  record.lastLogin = Date.now();
  localStorage.setItem(offlineAuthKey, JSON.stringify(record));
  localStorage.setItem('user', JSON.stringify(record.user));
  return record.user;
}
