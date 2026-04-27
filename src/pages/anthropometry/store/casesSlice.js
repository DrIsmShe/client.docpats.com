/**
 * Anthropometry Cases Slice
 * =========================
 * Redux slice для управления списком case-ов и текущим case.
 *
 * State shape:
 *   anthroCases: {
 *     items: [],          // список case-ов
 *     current: null,      // детали открытого case
 *     loading: false,
 *     error: null,
 *     pagination: { total: 0, hasMore: false }
 *   }
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as caseApi from "../api/caseApi.js";

/* ============================================================
   THUNKS
   ============================================================ */

export const fetchCases = createAsyncThunk(
  "anthroCases/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await caseApi.listCases(params);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || { message: err.message },
      );
    }
  },
);

export const fetchCase = createAsyncThunk(
  "anthroCases/fetchOne",
  async (caseId, { rejectWithValue }) => {
    try {
      return await caseApi.getCase(caseId, { populate: true });
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || { message: err.message },
      );
    }
  },
);

export const createCase = createAsyncThunk(
  "anthroCases/create",
  async (data, { rejectWithValue }) => {
    try {
      return await caseApi.createCase(data);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || { message: err.message },
      );
    }
  },
);

export const updateCase = createAsyncThunk(
  "anthroCases/update",
  async ({ caseId, updates }, { rejectWithValue }) => {
    try {
      return await caseApi.updateCase(caseId, updates);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || { message: err.message },
      );
    }
  },
);

export const archiveCase = createAsyncThunk(
  "anthroCases/archive",
  async ({ caseId, reason }, { rejectWithValue }) => {
    try {
      return await caseApi.archiveCase(caseId, reason);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || { message: err.message },
      );
    }
  },
);

export const deleteCase = createAsyncThunk(
  "anthroCases/delete",
  async ({ caseId, reason }, { rejectWithValue }) => {
    try {
      await caseApi.deleteCase(caseId, reason);
      return caseId;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || { message: err.message },
      );
    }
  },
);

/* ============================================================
   SLICE
   ============================================================ */

const casesSlice = createSlice({
  name: "anthroCases",
  initialState: {
    items: [],
    current: null,
    loading: false,
    error: null,
    pagination: { total: 0, hasMore: false },
  },
  reducers: {
    clearCurrentCase: (state) => {
      state.current = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCases
      .addCase(fetchCases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCases.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.pagination = {
          total: action.payload.total || 0,
          hasMore: action.payload.hasMore || false,
        };
      })
      .addCase(fetchCases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchCase
      .addCase(fetchCase.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      // createCase
      .addCase(createCase.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      // updateCase
      .addCase(updateCase.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.items.findIndex((c) => c._id === updated._id);
        if (idx !== -1) state.items[idx] = updated;
        if (state.current?._id === updated._id) state.current = updated;
      })
      // archiveCase
      .addCase(archiveCase.fulfilled, (state, action) => {
        const archived = action.payload;
        state.items = state.items.filter((c) => c._id !== archived._id);
      })
      // deleteCase
      .addCase(deleteCase.fulfilled, (state, action) => {
        const deletedId = action.payload;
        state.items = state.items.filter((c) => c._id !== deletedId);
      });
  },
});

export const { clearCurrentCase, clearError } = casesSlice.actions;

/* ============================================================
   SELECTORS
   ============================================================ */

export const selectCases = (state) => state.anthroCases.items;
export const selectCurrentCase = (state) => state.anthroCases.current;
export const selectCasesLoading = (state) => state.anthroCases.loading;
export const selectCasesError = (state) => state.anthroCases.error;
export const selectCasesPagination = (state) => state.anthroCases.pagination;

export default casesSlice.reducer;
