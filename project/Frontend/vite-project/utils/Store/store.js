import { configureStore } from '@reduxjs/toolkit';
import authReducer from "../Slice/authSlice"
import solveDoubtReducer from "../Slice/chatSlice"
import submissionReducer from "../Slice/SubmissionSlice";
import commentReducer from "../Slice/commentSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    solveDoubt: solveDoubtReducer, 
    submissions: submissionReducer,
    comment: commentReducer,
  }
});
export default store;