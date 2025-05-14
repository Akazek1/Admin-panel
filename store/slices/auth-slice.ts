import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import authService, {
  type SendOtpRequest,
  type VerifyOtpRequest,
  type AuthResponse,
} from "@/services/auth-service";
import { toast } from "react-hot-toast";
import type { AxiosError } from "axios";

// Define the auth state interface
interface AuthState {
  user: AuthResponse["data"]["user"] | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  otpSent: boolean;
  phoneNumber: string | null;
}

// Initial state
const initialState: AuthState = {
  user:
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null,
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  isAuthenticated:
    typeof window !== "undefined" ? !!localStorage.getItem("token") : false,
  isLoading: false,
  error: null,
  otpSent: false,
  phoneNumber: null,
};

// Async thunks
export const sendOtp = createAsyncThunk(
  "auth/sendOtp",
  async (data: SendOtpRequest, { rejectWithValue }) => {
    try {
      return await authService.sendOtp(data);
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      const message = err.response?.data?.message || "Failed to send OTP";
      return rejectWithValue(message);
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (data: VerifyOtpRequest, { rejectWithValue }) => {
    try {
      const response = await authService.verifyOtp(data);
      return response;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      const message = err.response?.data?.message || "OTP verification failed";
      return rejectWithValue(message);
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  localStorage.removeItem("token");
  authService.logout();
});

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getCurrentUser();
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      const message = err.response?.data?.message || "Failed to get user";
      return rejectWithValue(message);
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuthState: (state) => {
      state.error = null;
      state.isLoading = false;
    },
    setPhoneNumber: (state, action: PayloadAction<string>) => {
      state.phoneNumber = action.payload;
    },
    updateUser(state, action: PayloadAction<Partial<AuthState["user"]>>) {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload,
        };

        // Update localStorage too
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Send OTP cases
      .addCase(sendOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, (state) => {
        state.isLoading = false;
        state.otpSent = true;
        toast.success("OTP sent successfully");
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        toast.error(state.error || "Failed to send OTP");
      })

      // Verify OTP cases
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.otpSent = false;
        state.phoneNumber = null;

        // Save user and token to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(action.payload.user));
          localStorage.setItem("token", action.payload.token);
        }

        toast.success("OTP verified successfully");
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        toast.error(state.error || "OTP verification failed");
      })

      // Logout case
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.otpSent = false;
        state.phoneNumber = null;
        toast.success("Logged out successfully");
      })

      // Get current user cases
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { resetAuthState, setPhoneNumber, updateUser } = authSlice.actions;
export default authSlice.reducer;
