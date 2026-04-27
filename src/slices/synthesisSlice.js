import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchSynthesisArticles, fetchSynthesisArticle } from "../axios";

export const loadArticles = createAsyncThunk(
  "synthesis/loadArticles",
  async (params = {}) => {
    const data = await fetchSynthesisArticles(params);
    return data;
  },
);

export const loadArticle = createAsyncThunk(
  "synthesis/loadArticle",
  async (id) => {
    const data = await fetchSynthesisArticle(id);
    return data.article;
  },
);

const synthesisSlice = createSlice({
  name: "synthesis",
  initialState: {
    articles: [],
    total: 0,
    current: null,
    status: "idle",
  },
  reducers: {
    clearCurrent: (state) => {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadArticles.pending, (state) => {
        state.status = "loading";
      })
      .addCase(loadArticles.fulfilled, (state, { payload }) => {
        state.status = "success";
        state.articles = payload.articles || [];
        state.total = payload.total || 0;
      })
      .addCase(loadArticles.rejected, (state) => {
        state.status = "error";
      })

      .addCase(loadArticle.pending, (state) => {
        state.status = "loading";
      })
      .addCase(loadArticle.fulfilled, (state, { payload }) => {
        state.status = "success";
        state.current = payload;
      })
      .addCase(loadArticle.rejected, (state) => {
        state.status = "error";
      });
  },
});

export const { clearCurrent } = synthesisSlice.actions;
export default synthesisSlice.reducer;
