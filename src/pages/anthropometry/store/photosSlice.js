/**
 * Anthropometry Photos Slice
 * ==========================
 *
 * State shape:
 *   anthroPhotos: {
 *     byStudy: { [studyId]: [...photos] },
 *     current: null,
 *     uploading: false,
 *     uploadProgress: 0,
 *     loading: false,
 *     error: null
 *   }
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as photoApi from "../api/photoApi.js";

/* ============================================================
   THUNKS
   ============================================================ */

export const fetchPhotosByStudy = createAsyncThunk(
  "anthroPhotos/fetchByStudy",
  async (studyId, { rejectWithValue }) => {
    try {
      const data = await photoApi.listPhotosByStudy(studyId);
      return { studyId, photos: data.items || data };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || { message: err.message },
      );
    }
  },
);

export const fetchPhoto = createAsyncThunk(
  "anthroPhotos/fetchOne",
  async (photoId, { rejectWithValue }) => {
    try {
      return await photoApi.getPhoto(photoId);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || { message: err.message },
      );
    }
  },
);

/**
 * Upload с progress.
 * dispatch(uploadPhoto({ studyId, file, viewType }))
 *
 * Progress автоматически пишется в state через reducer 'setUploadProgress'.
 */
export const uploadPhoto = createAsyncThunk(
  "anthroPhotos/upload",
  async ({ studyId, file, viewType }, { dispatch, rejectWithValue }) => {
    try {
      const onProgress = (percent) => {
        dispatch(photosSlice.actions.setUploadProgress(percent));
      };
      return await photoApi.uploadPhoto(studyId, file, viewType, onProgress);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || { message: err.message },
      );
    }
  },
);

export const deletePhoto = createAsyncThunk(
  "anthroPhotos/delete",
  async ({ photoId, reason }, { rejectWithValue }) => {
    try {
      await photoApi.deletePhoto(photoId, reason);
      return photoId;
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

const photosSlice = createSlice({
  name: "anthroPhotos",
  initialState: {
    byStudy: {},
    current: null,
    uploading: false,
    uploadProgress: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentPhoto: (state) => {
      state.current = null;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPhotosByStudy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPhotosByStudy.fulfilled, (state, action) => {
        state.loading = false;
        state.byStudy[action.payload.studyId] = action.payload.photos;
      })
      .addCase(fetchPhoto.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(uploadPhoto.pending, (state) => {
        state.uploading = true;
        state.uploadProgress = 0;
        state.error = null;
      })
      .addCase(uploadPhoto.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 100;
        const photo = action.payload;
        if (!state.byStudy[photo.studyId]) state.byStudy[photo.studyId] = [];
        state.byStudy[photo.studyId].push(photo);
      })
      .addCase(uploadPhoto.rejected, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 0;
        state.error = action.payload;
      })
      .addCase(deletePhoto.fulfilled, (state, action) => {
        const deletedId = action.payload;
        for (const studyId of Object.keys(state.byStudy)) {
          state.byStudy[studyId] = state.byStudy[studyId].filter(
            (p) => p._id !== deletedId,
          );
        }
        if (state.current?._id === deletedId) state.current = null;
      });
  },
});

export const { clearCurrentPhoto, setUploadProgress, clearError } =
  photosSlice.actions;

export const selectPhotosByStudy = (studyId) => (state) =>
  state.anthroPhotos.byStudy[studyId] || [];
export const selectCurrentPhoto = (state) => state.anthroPhotos.current;
export const selectUploading = (state) => state.anthroPhotos.uploading;
export const selectUploadProgress = (state) =>
  state.anthroPhotos.uploadProgress;

export default photosSlice.reducer;
