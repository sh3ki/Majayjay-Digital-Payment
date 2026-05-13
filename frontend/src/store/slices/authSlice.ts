import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, LoginDto, RegisterDto, User } from '../../types';
import { authService } from '../../services/auth.service';

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  error: null,
  pendingVerificationUserId: null,
};

export const loginAsync = createAsyncThunk('auth/login', async (dto: LoginDto, { rejectWithValue }) => {
  try {
    const res = await authService.login(dto);
    if (!res.success || !res.data) throw new Error(res.message);
    return res.data;
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error).message;
    return rejectWithValue(msg);
  }
});

export const registerAsync = createAsyncThunk('auth/register', async (dto: RegisterDto, { rejectWithValue }) => {
  try {
    const res = await authService.register(dto);
    if (!res.success) throw new Error(res.message);
    return res;
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error).message;
    return rejectWithValue(msg);
  }
});

export const verifyOtpAsync = createAsyncThunk('auth/verifyOtp', async ({ userId, otp }: { userId: number; otp: string }, { rejectWithValue }) => {
  try {
    const res = await authService.verifyOtp(userId, otp);
    if (!res.success || !res.data) throw new Error(res.message);
    return res.data;
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error).message;
    return rejectWithValue(msg);
  }
});

export const resendOtpAsync = createAsyncThunk('auth/resendOtp', async (userId: number, { rejectWithValue }) => {
  try {
    const res = await authService.resendOtp(userId);
    if (!res.success) throw new Error(res.message);
    return res;
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error).message;
    return rejectWithValue(msg);
  }
});

export const fetchMeAsync = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const res = await authService.getMe();
    if (!res.success || !res.data) throw new Error(res.message);
    return res.data;
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error).message;
    return rejectWithValue(msg);
  }
});

export const logoutAsync = createAsyncThunk('auth/logout', async () => {
  try { await authService.logout(); } catch { /* ignore */ }
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) { state.error = null; },
    setUser(state, action: PayloadAction<User>) { state.user = action.payload; },
    setPendingVerificationUserId(state, action: PayloadAction<number | null>) {
      state.pendingVerificationUserId = action.payload;
    },
    setTokens(state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.requiresVerification) {
          state.pendingVerificationUserId = action.payload.userId ?? null;
        } else {
          state.user = action.payload.user!;
          state.accessToken = action.payload.accessToken!;
          state.refreshToken = action.payload.refreshToken!;
          state.isAuthenticated = true;
          localStorage.setItem('accessToken', action.payload.accessToken!);
          localStorage.setItem('refreshToken', action.payload.refreshToken!);
        }
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(registerAsync.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(registerAsync.fulfilled, (state) => { state.isLoading = false; })
      .addCase(registerAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyOtpAsync.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(verifyOtpAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.pendingVerificationUserId = null;
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      })
      .addCase(verifyOtpAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(resendOtpAsync.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(resendOtpAsync.fulfilled, (state) => { state.isLoading = false; })
      .addCase(resendOtpAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMeAsync.pending, (state) => { state.isLoading = true; })
      .addCase(fetchMeAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchMeAsync.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.pendingVerificationUserId = null;
      });
  },
});

export const { clearError, setUser, setTokens, setPendingVerificationUserId } = authSlice.actions;
export default authSlice.reducer;
