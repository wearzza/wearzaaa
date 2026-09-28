export function hashPassword(pw: string): string {
  return btoa(pw + '__wearza__');
}

export function verifyPassword(pw: string, hash: string): boolean {
  return hashPassword(pw) === hash;
}

export const ADMIN_EMAIL = 'infowearzaa@gmail.com';
export const ADMIN_PASSWORD = '12345678';
