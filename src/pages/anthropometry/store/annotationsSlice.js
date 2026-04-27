/**
 * Anthropometry Annotations Slice
 * ===============================
 *
 * State shape:
 *   anthroAnnotations: {
 *     currentByPhoto: { [photoId]: annotation },   // текущая версия
 *     historyByPhoto: { [photoId]: [...versions] }, // вся история
 *     loading: false,
 *     saving: false,
 *     error: null
 *   }
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as annotationApi from "../api/annotationApi.js";

/* ============================================================
   THUNKS
   ============================================================ */

export const fetchCurrentAnnotation = createAsyncThunk(
  "anthroAnnotations/fetchCurrent",
  async ({ photoId, presetType }, { rejectWithValue }) => {
    try {
      const annotation = await annotationApi.getCurrentAnnotation(
        photoId,
        presetType,
      );
      return { photoId, annotation };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || { message: err.message },
      );
    }
  },
);

export const fetchAnnotationHistory = createAsyncThunk(
  "anthroAnnotations/fetchHistory",
  async ({ photoId, presetType }, { rejectWithValue }) => {
    try {
      const data = await annotationApi.getAnnotationHistory(
        photoId,
        presetType,
      );
      return { photoId, history: data.items || data };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || { message: err.message },
      );
    }
  },
);

export const createAnnotation = createAsyncThunk(
  "anthroAnnotations/create",
  async ({ photoId, data }, { rejectWithValue }) => {
    try {
      const result = await annotationApi.createAnnotation(photoId, data);
      return {
        photoId,
        annotation: result.annotation,
        computeResult: result.computeResult,
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || { message: err.message },
      );
    }
  },
);

export const updateLandmarks = createAsyncThunk(
  "anthroAnnotations/updateLandmarks",
  async ({ annotationId, landmarks, photoId }, { rejectWithValue }) => {
    try {
      const result = await annotationApi.updateLandmarks(
        annotationId,
        landmarks,
      );
      return {
        photoId,
        annotation: result.annotation,
        computeResult: result.computeResult,
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || { message: err.message },
      );
    }
  },
);

export const createNewVersion = createAsyncThunk(
  "anthroAnnotations/createVersion",
  async ({ photoId, data }, { rejectWithValue }) => {
    try {
      const result = await annotationApi.createNewVersion(photoId, data);
      return {
        photoId,
        annotation: result.annotation,
        computeResult: result.computeResult,
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || { message: err.message },
      );
    }
  },
);

export const lockAnnotation = createAsyncThunk(
  "anthroAnnotations/lock",
  async ({ annotationId, reason, photoId }, { rejectWithValue }) => {
    try {
      const annotation = await annotationApi.lockAnnotation(
        annotationId,
        reason,
      );
      return { photoId, annotation };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || { message: err.message },
      );
    }
  },
);

export const unlockAnnotation = createAsyncThunk(
  "anthroAnnotations/unlock",
  async ({ annotationId, reason, photoId }, { rejectWithValue }) => {
    try {
      const annotation = await annotationApi.unlockAnnotation(
        annotationId,
        reason,
      );
      return { photoId, annotation };
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

const annotationsSlice = createSlice({
  name: "anthroAnnotations",
  initialState: {
    currentByPhoto: {},
    historyByPhoto: {},
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearAnnotation: (state, action) => {
      const photoId = action.payload;
      delete state.currentByPhoto[photoId];
      delete state.historyByPhoto[photoId];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentAnnotation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentAnnotation.fulfilled, (state, action) => {
        state.loading = false;
        state.currentByPhoto[action.payload.photoId] =
          action.payload.annotation;
      })
      .addCase(fetchAnnotationHistory.fulfilled, (state, action) => {
        state.historyByPhoto[action.payload.photoId] = action.payload.history;
      })
      .addCase(createAnnotation.pending, (state) => {
        state.saving = true;
      })
      .addCase(createAnnotation.fulfilled, (state, action) => {
        state.saving = false;
        state.currentByPhoto[action.payload.photoId] =
          action.payload.annotation;
      })
      .addCase(createAnnotation.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(updateLandmarks.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateLandmarks.fulfilled, (state, action) => {
        state.saving = false;
        state.currentByPhoto[action.payload.photoId] =
          action.payload.annotation;
      })
      .addCase(createNewVersion.fulfilled, (state, action) => {
        state.currentByPhoto[action.payload.photoId] =
          action.payload.annotation;
      })
      .addCase(lockAnnotation.fulfilled, (state, action) => {
        state.currentByPhoto[action.payload.photoId] =
          action.payload.annotation;
      })
      .addCase(unlockAnnotation.fulfilled, (state, action) => {
        state.currentByPhoto[action.payload.photoId] =
          action.payload.annotation;
      });
  },
});

export const { clearAnnotation, clearError } = annotationsSlice.actions;

export const selectCurrentAnnotation = (photoId) => (state) =>
  state.anthroAnnotations.currentByPhoto[photoId];
export const selectAnnotationHistory = (photoId) => (state) =>
  state.anthroAnnotations.historyByPhoto[photoId] || [];
export const selectAnnotationsSaving = (state) =>
  state.anthroAnnotations.saving;
export const selectAnnotationsLoading = (state) =>
  state.anthroAnnotations.loading;

export default annotationsSlice.reducer;
