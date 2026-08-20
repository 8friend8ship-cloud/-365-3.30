export const BIBLE1_BACKEND = Object.freeze({
  appId: 'APP_BIBLE365',
  canonicalSpreadsheetId: '1HK4ATRZ-lSZ4fyuZi4ypHodgGZK1kBMsEFkAxOm9904',
  baseUrl: (import.meta.env.VITE_BIBLE1_API_URL || '').trim(),
  contract: 'BIBLE1_UNIFIED_DELIVERY_V1',
});

export function requireBible1BackendUrl(): string {
  if (!BIBLE1_BACKEND.baseUrl) {
    throw new Error('VITE_BIBLE1_API_URL is not configured. Bible1 unified backend is required.');
  }
  return BIBLE1_BACKEND.baseUrl;
}
