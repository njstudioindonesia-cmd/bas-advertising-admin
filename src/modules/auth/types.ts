export type UserRole = "customer" | "admin" | "vendor" | "driver";

export interface UserProfile {
  id: string;
  role: UserRole;
  fullName: string | null;
  phone: string | null;
  hubId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionUser {
  id: string;
  username: string;
  role: UserRole;
  fullName?: string | null;
  phone?: string | null;
  hubId?: string | null;
}

export interface TokenPayload {
  userId: string;
  username: string;
  role: UserRole;
  hubId?: string | null;
  expiresAt: number;
}
