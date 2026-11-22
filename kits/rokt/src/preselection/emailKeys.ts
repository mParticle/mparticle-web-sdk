import { isEmpty, isString, readOwnValue } from '../utils';

export const ENCRYPTED_KEY_SUFFIX = 'enc';

const EMAIL_CLASS_KEYS = ['email', 'emailsha256'];

function emailClassKeys(mappedEmailSha256Key?: string): string[] {
  return isString(mappedEmailSha256Key) && mappedEmailSha256Key !== ''
    ? [...EMAIL_CLASS_KEYS, mappedEmailSha256Key.toLowerCase()]
    : EMAIL_CLASS_KEYS;
}

// An attribute or identity key that holds the shopper's email, raw, hashed or encrypted (the key plus enc), in any
// casing.
export function isPreselectEmailKey(key: string, mappedEmailSha256Key?: string): boolean {
  const lower = key.toLowerCase();
  return emailClassKeys(mappedEmailSha256Key).some(
    (emailKey) => lower === emailKey || lower === emailKey + ENCRYPTED_KEY_SUFFIX,
  );
}

// An encrypted form of an email-class key. Its ciphertext changes on every call, so the dedupe digest keys it by
// presence only.
export function isEncryptedEmailKey(key: string, mappedEmailSha256Key?: string): boolean {
  const lower = key.toLowerCase();
  return emailClassKeys(mappedEmailSha256Key).some((emailKey) => lower === emailKey + ENCRYPTED_KEY_SUFFIX);
}

export function hasPreselectEmail(attributes: Record<string, unknown>, mappedEmailSha256Key?: string): boolean {
  return Object.keys(attributes).some(
    (key) => isPreselectEmailKey(key, mappedEmailSha256Key) && !isEmpty(readOwnValue(attributes, key)),
  );
}
