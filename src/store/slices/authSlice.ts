import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, userApi } from '../../api/client';
import { wsService } from '../../api/ws';
import type { AuthState, User } from '../../types';

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

// ── Thunks ────────────────────────────────────────────────────────────────────

export const initAuth = createAsyncThunk('auth/init', async () => {
  const token = await AsyncStorage.getItem('access_token');
  if (!token) return null;

  // FIX: token must be set on the axios instance BEFORE calling /auth/me
  // The interceptor reads from AsyncStorage which is async — on cold boot
  // there's a race where the request fires before the interceptor attaches
  // the token. We guarantee it here by passing it directly.
  const user = await authApi.me(token);   // pass token explicitly
  return { token, user };
});

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const res = await authApi.login(email, password);
    await AsyncStorage.setItem('access_token', res.access_token);
    return res;
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: {
    email: string; phone: string; full_name: string; password: string;
    blood_group?: string; medical_notes?: string;
  }) => {
    const res = await authApi.register(data);
    await AsyncStorage.setItem('access_token', res.access_token);
    return res;
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try { await authApi.logout(); } catch {}
  wsService.stop();
  await AsyncStorage.removeItem('access_token');
});

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data: Parameters<typeof userApi.updateProfile>[0]) =>
    userApi.updateProfile(data)
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setFcmToken(state, action: PayloadAction<string>) {
      if (state.user) (state.user as any).fcm_token = action.payload;
    },
  },
  extraReducers: (builder) => {
    // initAuth
    builder.addCase(initAuth.pending,   s => { s.isLoading = true; });
    builder.addCase(initAuth.fulfilled, (s, a) => {
      s.isLoading = false;
      if (a.payload) {
        s.token           = a.payload.token;
        s.user            = a.payload.user;
        s.isAuthenticated = true;
        // Start WS only after we have confirmed user — avoids connecting
        // with a stale token that might be expired
        wsService.start(a.payload.user.id);
      }
    });
    builder.addCase(initAuth.rejected, s => {
      // Token was invalid/expired — clear it so user sees login screen
      s.isLoading = false;
      AsyncStorage.removeItem('access_token');
    });

    // login
    builder.addCase(login.fulfilled, (s, a) => {
      s.token           = a.payload.access_token;
      s.user            = a.payload.user;
      s.isAuthenticated = true;
      s.isLoading       = false;
      wsService.start(a.payload.user.id);
    });
    builder.addCase(login.rejected, s => { s.isLoading = false; });

    // register
    builder.addCase(register.fulfilled, (s, a) => {
      s.token           = a.payload.access_token;
      s.user            = a.payload.user;
      s.isAuthenticated = true;
      s.isLoading       = false;
      wsService.start(a.payload.user.id);
    });
    builder.addCase(register.rejected, s => { s.isLoading = false; });

    // logout
    builder.addCase(logout.fulfilled, s => {
      s.user = null; s.token = null; s.isAuthenticated = false;
    });

    // profile update
    builder.addCase(updateProfile.fulfilled, (s, a) => { s.user = a.payload; });
  },
});

export const { setFcmToken } = authSlice.actions;
export default authSlice.reducer;