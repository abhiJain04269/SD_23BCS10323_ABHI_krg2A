import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from "../axiosClient";

export const Aisolve = createAsyncThunk(
  'ai/solveDoubt',
  async (obj, { rejectWithValue }) => {
    try {
    // console.log(obj);
    const response = await axiosClient.post("ai/solveDoubt", obj);
    const modelText =
        response?.data?.reply?.candidates?.[0]?.content?.parts?.[0]?.text;

   return { userMessage: obj.message, aiResponse: modelText };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const solveDoubtslice=createSlice({
    name:"solveDoubtSlice",
    initialState:{
        history:[],
        loading: false,
        error: null
    },
    reducers:{
        adduserMessage:(state,action)=>{
            const {message}=action.payload;
            state.history.push({
                id: Date.now().toString(),
                role: 'user',
                parts: [{ text: message }],
            })
        },
        clearHistory: (state) => {
            state.history = [];
            state.error = null;
        },
    },
    extraReducers:(builder)=>{
        builder
        .addCase(Aisolve.pending, (state) => {
            state.loading = true;
            state.error = null;
            state.history.push({
                id: Date.now().toString(),
                role: 'loading',
                parts: [{ text: "Loading..." }],
            });
        })
       .addCase(Aisolve.fulfilled, (state, action) => {
            state.loading = false;
            const {userMessage,aiResponse}=action.payload;
            if(state.history[state.history.length-1].role==="loading"){
                state.history.pop();
            }
            state.history.push({
                id: Date.now().toString(),
                role: 'model',
                parts: [{ text: aiResponse }],
            });
        })
        .addCase(Aisolve.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload?.message || 'Something went wrong';
        })
    }
})

export const { clearHistory,adduserMessage } = solveDoubtslice.actions;
export default solveDoubtslice.reducer;