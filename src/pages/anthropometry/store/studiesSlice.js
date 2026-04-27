/**
 * Anthropometry Studies Slice
 * ===========================
 * Redux slice для управления studies.
 *
 * State shape:
 *   anthroStudies: {
 *     byCase: { [caseId]: [...studies] },  // группировка по case
 *     current: null,                        // открытый study
 *     loading: false,
 *     error: null
 *   }
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as studyApi from "../api/studyApi.js";

/* ============================================================
   THUNKS
   ============================================================ */

export const fetchStudiesByCase = createAsyncThunk(
  "anthroStudies/fetchByCase",
  async (caseId, { rejectWithValue }) => {
    try {
      const data = await studyApi.listStudiesByCase(caseId);
      return { caseId, studies: data.items || data };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || { message: err.message },
      );
    }
  },
);

export const fetchStudy = createAsyncThunk(
  "anthroStudies/fetchOne",
  async (studyId, { rejectWithValue }) => {
    try {
      return await studyApi.getStudy(studyId);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || { message: err.message },
      );
    }
  },
);

export const createStudy = createAsyncThunk(
  "anthroStudies/create",
  async ({ caseId, data }, { rejectWithValue }) => {
    try {
      return await studyApi.createStudy(caseId, data);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || { message: err.message },
      );
    }
  },
);

export const completeStudy = createAsyncThunk(
  "anthroStudies/complete",
  async (studyId, { rejectWithValue }) => {
    try {
      return await studyApi.completeStudy(studyId);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || { message: err.message },
      );
    }
  },
);

export const deleteStudy = createAsyncThunk(
  "anthroStudies/delete",
  async ({ studyId, reason }, { rejectWithValue }) => {
    try {
      await studyApi.deleteStudy(studyId, reason);
      return studyId;
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

const studiesSlice = createSlice({
  name: "anthroStudies",
  initialState: {
    byCase: {},
    current: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentStudy: (state) => {
      state.current = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudiesByCase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudiesByCase.fulfilled, (state, action) => {
        state.loading = false;
        state.byCase[action.payload.caseId] = action.payload.studies;
      })
      .addCase(fetchStudiesByCase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchStudy.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(createStudy.fulfilled, (state, action) => {
        const study = action.payload;
        if (!state.byCase[study.caseId]) state.byCase[study.caseId] = [];
        state.byCase[study.caseId].unshift(study);
      })
      .addCase(completeStudy.fulfilled, (state, action) => {
        const updated = action.payload;
        if (state.current?._id === updated._id) state.current = updated;
        const list = state.byCase[updated.caseId];
        if (list) {
          const idx = list.findIndex((s) => s._id === updated._id);
          if (idx !== -1) list[idx] = updated;
        }
      })
      .addCase(deleteStudy.fulfilled, (state, action) => {
        const deletedId = action.payload;
        for (const caseId of Object.keys(state.byCase)) {
          state.byCase[caseId] = state.byCase[caseId].filter(
            (s) => s._id !== deletedId,
          );
        }
        if (state.current?._id === deletedId) state.current = null;
      });
  },
});

export const { clearCurrentStudy, clearError } = studiesSlice.actions;

export const selectStudiesByCase = (caseId) => (state) =>
  state.anthroStudies.byCase[caseId] || [];
export const selectCurrentStudy = (state) => state.anthroStudies.current;
export const selectStudiesLoading = (state) => state.anthroStudies.loading;

export default studiesSlice.reducer;
