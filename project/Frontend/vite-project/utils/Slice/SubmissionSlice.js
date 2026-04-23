import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from "../axiosClient"


export const fetchSubmissionHistory = createAsyncThunk(
  'submissions/fetchSubmissionHistory',
  async (pid, { rejectWithValue }) => {
    try {
        // console.log("hi");
      const response = await axiosClient.get(`/problem/problemSubmittedByUser/${pid}`);
      // console.log(response);
      return {
        history: Array.isArray(response.data) ? response.data.reverse() : [],
        lastFetched: Date.now(),
        pid,
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const submissionSlice = createSlice({
  name: 'submissions',
  initialState: {
    history: [],
    lastFetched: 0,
    currentPid: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearHistory: (state) => {
      state.history = [];
      state.lastFetched = 0;
      state.currentPid = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubmissionHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubmissionHistory.fulfilled, (state, action) => {
        console.group(action.payload.history);
        state.history = action.payload.history;
        state.lastFetched = action.payload.lastFetched;
        state.currentPid = action.payload.pid;
        state.loading = false;
      })
      .addCase(fetchSubmissionHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearHistory } = submissionSlice.actions;
export default submissionSlice.reducer;