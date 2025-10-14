// src/lib/redux/slices/authSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SafeUser } from '@/types';

export interface AuthState {
  user: SafeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true until the first session check is done
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<SafeUser>) => {
      console.log('🎬 [AuthSlice] Action setUser:', action.payload);
      // Ensure date objects are serialized
      const userPayload = action.payload;
      state.user = {
        ...userPayload,
        createdAt: new Date(userPayload.createdAt).toISOString(),
        updatedAt: new Date(userPayload.updatedAt).toISOString(),
      } as SafeUser;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    logout: (state) => {
      console.log('🎬 [AuthSlice] Action logout: Réinitialisation de l\'état d\'authentification.');
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
        state.error = action.payload;
        state.isLoading = false;
    }
  },
  selectors: {
    selectCurrentUser: (state) => state.user,
    selectIsAuthenticated: (state) => state.isAuthenticated,
    selectIsAuthLoading: (state) => state.isLoading,
  }
});

export const { setUser, logout, setLoading, setError } = authSlice.actions;

export const { selectCurrentUser, selectIsAuthenticated, selectIsAuthLoading } = authSlice.selectors;

export default authSlice.reducer;
