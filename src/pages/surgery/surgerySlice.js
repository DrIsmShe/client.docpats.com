import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "./surgeryApi";

// ─── Thunks ───────────────────────────────────────────────────────────────

export const fetchCases = createAsyncThunk(
  "surgery/fetchCases",
  async (params = {}, { rejectWithValue }) => {
    try {
      // Чистим undefined чтобы не отправлять ?status=undefined в URL
      const cleanParams = {};
      if (params.status) cleanParams.status = params.status;
      if (params.procedure) cleanParams.procedure = params.procedure;
      if (params.page) cleanParams.page = params.page;
      if (params.limit) cleanParams.limit = params.limit;

      const res = await api.getCases(cleanParams);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Ошибка загрузки");
    }
  },
);

export const fetchCaseById = createAsyncThunk(
  "surgery/fetchCaseById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.getCaseById(id);
      return res.data.case;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Ошибка загрузки");
    }
  },
);

export const createCase = createAsyncThunk(
  "surgery/createCase",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.createCase(data);
      return res.data.case;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Ошибка создания");
    }
  },
);

export const updateCase = createAsyncThunk(
  "surgery/updateCase",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.updateCase(id, data);
      return res.data.case;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Ошибка обновления");
    }
  },
);

export const uploadPhoto = createAsyncThunk(
  "surgery/uploadPhoto",
  async ({ caseId, file, label }, { rejectWithValue }) => {
    try {
      const res = await api.uploadPhoto(caseId, file, label);
      return { caseId, photo: res.data.photo };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || "Ошибка загрузки фото",
      );
    }
  },
);

export const removePhoto = createAsyncThunk(
  "surgery/removePhoto",
  async ({ caseId, photoId }, { rejectWithValue }) => {
    try {
      await api.deletePhoto(caseId, photoId);
      return { caseId, photoId };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || "Ошибка удаления фото",
      );
    }
  },
);

export const setOutcome = createAsyncThunk(
  "surgery/setOutcome",
  async ({ caseId, score }, { rejectWithValue }) => {
    try {
      const res = await api.setOutcome(caseId, score);
      return res.data.case;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Ошибка");
    }
  },
);

export const togglePublish = createAsyncThunk(
  "surgery/togglePublish",
  async ({ caseId, publish }, { rejectWithValue }) => {
    try {
      const res = await api.publishCase(caseId, publish);
      return res.data.case;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  },
);

export const fetchStats = createAsyncThunk(
  "surgery/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.getStats();
      return res.data.stats;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Ошибка");
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────

export const addFollowUp = createAsyncThunk(
  "surgery/addFollowUp",
  async (
    { caseId, date, notes, complications, addedBy },
    { rejectWithValue },
  ) => {
    try {
      const res = await api.addFollowUp(caseId, {
        date,
        notes,
        complications,
        addedBy,
      });
      return { caseId, followUp: res.data.followUp };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Ошибка");
    }
  },
);
export const deleteCase = createAsyncThunk(
  "surgery/deleteCase",
  async (id, { rejectWithValue }) => {
    try {
      await api.deleteCase(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Ошибка удаления");
    }
  },
);
const surgerySlice = createSlice({
  name: "surgery",
  initialState: {
    cases: [],
    activeCase: null,
    stats: null,
    total: 0,
    page: 1,
    pages: 1,
    loading: false,
    caseLoading: false,
    uploadingPhoto: false,
    error: null,
  },
  reducers: {
    clearActiveCase(state) {
      state.activeCase = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchCases
    builder
      .addCase(fetchCases.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchCases.fulfilled, (s, a) => {
        s.loading = false;
        s.cases = a.payload.items || []; // ← || []
        s.total = a.payload.total || 0; // ← || 0
        s.page = a.payload.page || 1; // ← || 1
        s.pages = a.payload.pages || 1; // ← || 1
      })
      .addCase(fetchCases.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      });

    // fetchCaseById
    builder
      .addCase(fetchCaseById.pending, (s) => {
        s.caseLoading = true;
        s.error = null;
      })
      .addCase(fetchCaseById.fulfilled, (s, a) => {
        s.caseLoading = false;
        s.activeCase = a.payload;
      })
      .addCase(fetchCaseById.rejected, (s, a) => {
        s.caseLoading = false;
        s.error = a.payload;
      });

    // createCase
    builder.addCase(createCase.fulfilled, (s, a) => {
      s.cases.unshift(a.payload);
      s.total += 1;
    });

    // updateCase
    builder.addCase(updateCase.fulfilled, (s, a) => {
      const idx = s.cases.findIndex((c) => c._id === a.payload._id);
      if (idx !== -1) s.cases[idx] = a.payload;
      if (s.activeCase?._id === a.payload._id) s.activeCase = a.payload;
    });

    // uploadPhoto
    builder
      .addCase(uploadPhoto.pending, (s) => {
        s.uploadingPhoto = true;
      })
      .addCase(uploadPhoto.fulfilled, (s, a) => {
        s.uploadingPhoto = false;
        if (s.activeCase?._id === a.payload.caseId) {
          s.activeCase.photos = [
            ...(s.activeCase.photos || []),
            a.payload.photo,
          ];
        }
      })
      .addCase(uploadPhoto.rejected, (s, a) => {
        s.uploadingPhoto = false;
        s.error = a.payload;
      });

    // removePhoto
    builder.addCase(removePhoto.fulfilled, (s, a) => {
      if (s.activeCase?._id === a.payload.caseId) {
        s.activeCase.photos = s.activeCase.photos.filter(
          (p) => p._id !== a.payload.photoId,
        );
      }
    });

    // setOutcome / togglePublish
    builder
      .addCase(setOutcome.fulfilled, (s, a) => {
        s.activeCase = a.payload;
      })
      .addCase(togglePublish.fulfilled, (s, a) => {
        s.activeCase = a.payload;
        const idx = s.cases.findIndex((c) => c._id === a.payload._id);
        if (idx !== -1) s.cases[idx] = a.payload;
      })
      .addCase(togglePublish.rejected, (s, a) => {
        s.error = a.payload;
      });

    // fetchStats
    builder.addCase(fetchStats.fulfilled, (s, a) => {
      s.stats = a.payload;
    });
    builder.addCase(deleteCase.fulfilled, (s, a) => {
      s.cases = s.cases.filter((c) => c._id !== a.payload);
      s.total = Math.max(0, s.total - 1);
    });
    builder.addCase(addFollowUp.fulfilled, (s, a) => {
      if (s.activeCase?._id === a.payload.caseId) {
        s.activeCase.followUps = [
          ...(s.activeCase.followUps || []),
          a.payload.followUp,
        ];
      }
    });
  },
});
// Добавить в surgerySlice.js — вместе с остальными thunks

export const { clearActiveCase, clearError } = surgerySlice.actions;
export default surgerySlice.reducer;
