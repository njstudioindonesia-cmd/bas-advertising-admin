const loginAttempts = new Map<string, { count: number; expiresAt: number }>();

export function checkLoginRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.expiresAt) {
    loginAttempts.set(ip, { count: 1, expiresAt: now + 15 * 60 * 1000 });
    return { allowed: true, remainingAttempts: 4 };
  }

  if (record.count >= 5) {
    const retryAfterSeconds = Math.ceil((record.expiresAt - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  record.count += 1;
  return { allowed: true, remainingAttempts: 5 - record.count };
}

export function resetLoginRateLimit(ip: string) {
  loginAttempts.delete(ip);
}
