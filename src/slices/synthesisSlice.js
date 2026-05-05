import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchSynthesisArticles, fetchSynthesisArticle } from "../axios";

// loadArticles теперь различает первую страницу и последующие.
// page=1 → перезаписываем articles (свежий вход на страницу/смена локали)
// page>1 → дописываем к существующим (lazy load при скролле)
export const loadArticles = createAsyncThunk(
  "synthesis/loadArticles",
  async (params = {}) => {
    const data = await fetchSynthesisArticles(params);
    return { ...data, _requestedPage: params.page || 1 };
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
    page: 1,
    limit: 25,
    hasMore: false,
    current: null,
    status: "idle", // для первой загрузки/смены локали
    loadMoreStatus: "idle", // отдельный для подгрузки следующих страниц
  },
  reducers: {
    clearCurrent: (state) => {
      state.current = null;
    },
    resetSynthesis: (state) => {
      state.articles = [];
      state.total = 0;
      state.page = 1;
      state.hasMore = false;
      state.status = "idle";
      state.loadMoreStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      // ── loadArticles ────────────────────────────────
      .addCase(loadArticles.pending, (state, { meta }) => {
        const requestedPage = meta.arg?.page || 1;
        if (requestedPage === 1) {
          state.status = "loading";
        } else {
          state.loadMoreStatus = "loading";
        }
      })
      .addCase(loadArticles.fulfilled, (state, { payload }) => {
        const requestedPage = payload._requestedPage || 1;
        const incoming = payload.articles || [];

        if (requestedPage === 1) {
          // Свежий заход или смена локали — перезаписываем
          state.articles = incoming;
          state.status = "success";
        } else {
          // Lazy load — дописываем, дедупликация по _id на всякий случай
          const existingIds = new Set(state.articles.map((a) => a._id));
          const newOnes = incoming.filter((a) => !existingIds.has(a._id));
          state.articles = [...state.articles, ...newOnes];
          state.loadMoreStatus = "success";
        }

        state.total = payload.total || 0;
        state.page = requestedPage;
        state.limit = payload.limit || state.limit;
        // hasMore: бэкенд может прислать его явно, иначе вычисляем
        state.hasMore =
          typeof payload.hasMore === "boolean"
            ? payload.hasMore
            : state.articles.length < (payload.total || 0);
      })
      .addCase(loadArticles.rejected, (state, { meta }) => {
        const requestedPage = meta.arg?.page || 1;
        if (requestedPage === 1) {
          state.status = "error";
        } else {
          state.loadMoreStatus = "error";
        }
      })

      // ── loadArticle ─────────────────────────────────
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

export const { clearCurrent, resetSynthesis } = synthesisSlice.actions;
export default synthesisSlice.reducer;
