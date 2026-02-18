// ─── Auth Types ─────────────────────────────────────────────────

/** Public user data (never includes password hash) */
export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  createdAt: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface AuthError {
  error: string;
  field?: string;
}

/** Decoded JWT payload */
export interface JwtPayload {
  userId: string;
  username: string;
}
