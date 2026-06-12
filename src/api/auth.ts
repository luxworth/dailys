import { apiFetch } from './client';
import { LoginRequest, RegisterRequest, TokenPair, UserPublic } from './types';
import { saveTokens } from './tokenStorage';

export async function registerUser(payload: RegisterRequest): Promise<TokenPair> {
  const tokens = await apiFetch<TokenPair>('/api/v1/auth/register', {
    method: 'POST',
    body: payload,
    auth: false,
  });
  await saveTokens(tokens.access_token, tokens.refresh_token);
  return tokens;
}

export async function loginUser(payload: LoginRequest): Promise<TokenPair> {
  const tokens = await apiFetch<TokenPair>('/api/v1/auth/login', {
    method: 'POST',
    body: payload,
    auth: false,
  });
  await saveTokens(tokens.access_token, tokens.refresh_token);
  return tokens;
}

export async function getMe(): Promise<UserPublic> {
  return apiFetch<UserPublic>('/api/v1/auth/me');
}

export async function logoutUser(): Promise<void> {
  const { clearTokens } = await import('./tokenStorage');
  await clearTokens();
}
