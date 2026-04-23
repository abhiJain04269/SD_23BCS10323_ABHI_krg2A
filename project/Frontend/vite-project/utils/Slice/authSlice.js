import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosClient from "../axiosClient";

// Reset Password Thunk
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ Email_Id, password, confirmPassword }, { rejectWithValue }) => {
    try {
      if (password !== confirmPassword) {
        return rejectWithValue('Passwords do not match');
      }
      const response = await axiosClient.post('/user/resetPassword', {
        Email_Id,
        Password: password,
      });
      return { message: response.data.message || 'Password reset successfully' };
    } catch (error) {
      // console.log(error);
      return rejectWithValue(error.response?.data?.error || 'Failed to reset password');
    }
  }
);

// Existing Thunks (unchanged)
export const requestOtp = createAsyncThunk(
  'auth/requestOtp',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/register/request-otp', userData);
      // console.log(response);
      return { email: userData.Email_Id };
    } catch (error) {
      // console.log(error);
      // console.log(error.response?.data?.error);
      return rejectWithValue(error.response?.data?.error || 'Failed to send OTP');
    }
  }
);

export const verifyOtpAndRegister = createAsyncThunk(
  'auth/verifyOtpAndRegister',
  async ({ Email_Id, otp }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/register/verify-otp', {
        Email_Id,
        otp
      });
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'OTP verification failed');
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post("/user/login", credentials);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Login failed");
    }
  }
);

export const checkAuth = createAsyncThunk(
  "auth/check",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get("/user/check");
      // console.log(data.user);
      return data.user;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await axiosClient.post("/user/logout");
      return null;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: null,
    loading: true,
    error: null,
    emailForOTP: null,
    resetPasswordStatus: null,
  },
  reducers: {
    clearForgotPasswordState: (state) => {
      state.resetPasswordStatus = null;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Reset Password Cases
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.resetPasswordStatus = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.resetPasswordStatus = 'success';
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.resetPasswordStatus = 'failed';
      })
      // Existing Cases (unchanged)
      .addCase(requestOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.emailForOTP = action.payload.email;
      })
      .addCase(requestOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(verifyOtpAndRegister.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtpAndRegister.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(verifyOtpAndRegister.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = !!action.payload;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
        state.isAuthenticated = false;
        state.user = null;
      })
      //check authentication
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = !!action.payload;
        state.user = action.payload;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Something went wrong";
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.emailForOTP = null;
        state.resetPasswordStatus = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Something went wrong";
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const { clearForgotPasswordState,clearError } = authSlice.actions;
export default authSlice.reducer;