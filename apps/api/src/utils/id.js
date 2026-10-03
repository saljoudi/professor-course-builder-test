import crypto from 'node:crypto';

const PUBLIC_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function makePublicId(length = 8) {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += PUBLIC_ALPHABET[crypto.randomInt(0, PUBLIC_ALPHABET.length)];
  }
  return out;
}

export function makeInternalId(prefix = 'id') {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function slugify(value) {
  const slug = String(value || 'course')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42);
  return slug || 'course';
}

export function makeRenderServiceName(courseName, publicId) {
  return `${slugify(courseName)}-${publicId.toLowerCase()}`.slice(0, 63);
}
