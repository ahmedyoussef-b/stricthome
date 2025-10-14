// src/lib/redux/api/authApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { setUser, logout as logoutAction } from '../slices/authSlice';
import type { SafeUser, Role } from '@/types/index';
import { baseQueryWithCredentials } from './entityApi/config';
import { getServerSession } from '@/lib/auth-utils';

// --- Response Types ---
export interface AuthResponse {
  status: 'success' | 'requires-2fa';
  message: string;
  user?: SafeUser;
  tempToken?: string;
}

export interface SocialAuthResponse {
    user: SafeUser;
    isNewUser: boolean;
}

export interface LogoutResponse {
    message: string;
}

export interface SessionResponse {
  user: SafeUser | null; 
}

// --- Request Types ---
export interface LoginRequest {
  idToken: string;
}

export interface RegisterRequest {
  idToken: string;
  role: Role;
  name: string;
}

export interface SocialLoginRequest {
    idToken: string;
}

export interface Verify2FARequest {
    tempToken: string;
    code: string;
}


// --- API Definition ---

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithCredentials, // Use the centralized baseQuery
  tagTypes: ['Session'],
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userInfo) => ({
        url: 'api/auth/register',
        method: 'POST',
        body: userInfo,
      }),
    }),
    socialLogin: builder.mutation<SocialAuthResponse, SocialLoginRequest>({
        query: (credentials) => ({
            url: 'api/auth/social-login',
            method: 'POST',
            body: credentials,
        }),
        invalidatesTags: ['Session'],
    }),
    verify2FA: builder.mutation<AuthResponse, Verify2FARequest>({
      query: (body) => ({
        url: 'api/auth/verify-2fa',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Session'],
    }),
    logout: builder.mutation<LogoutResponse, void>({
      query: () => ({
        url: 'api/auth/logout',
        method: 'POST',
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        console.log('🚪 [AuthAPI] onQueryStarted pour logout.');
        try {
            await queryFulfilled;
            dispatch(logoutAction());
            // Clear the cache to ensure a clean state on next login
            dispatch(authApi.util.resetApiState());
        } catch {
             // Even if logout fails on the server, force it on the client
             dispatch(logoutAction());
             dispatch(authApi.util.resetApiState());
        }
      },
    }),
  }),
});

export const {
  useRegisterMutation,
  useLogoutMutation,
  useSocialLoginMutation,
  useVerify2FAMutation,
} = authApi;
