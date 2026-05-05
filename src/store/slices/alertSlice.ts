import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { alertApi } from '../../api/client';
import type { AlertState, Alert, WSAlertNewData } from '../../types';

const initialState: AlertState = {
  activeAlert:  null,
  alerts:       [],
  totalAlerts:  0,
  isLoading:    false,
  countdown:    0,
};

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchAlerts = createAsyncThunk(
  'alerts/fetch',
  async ({ page = 1, size = 20 }: { page?: number; size?: number } = {}) => {
    return alertApi.list(page, size);
  }
);

export const doAlertAction = createAsyncThunk(
  'alerts/action',
  async ({ id, action, notes }: { id: number; action: 'cancel' | 'confirm' | 'resolve'; notes?: string }) => {
    return alertApi.action(id, action, notes);
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const alertSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    setActiveAlert(state, action: PayloadAction<WSAlertNewData | null>) {
      state.activeAlert = action.payload;
      if (action.payload?.cancel_deadline) {
        const sec = Math.max(
          0,
          Math.round((new Date(action.payload.cancel_deadline).getTime() - Date.now()) / 1000)
        );
        state.countdown = sec;
      }
    },
    tickCountdown(state) {
      if (state.countdown > 0) state.countdown -= 1;
    },
    clearActiveAlert(state) {
      state.activeAlert = null;
      state.countdown   = 0;
    },
    updateAlertStatus(state, action: PayloadAction<{ alertId: number; status: string }>) {
      const a = state.alerts.find(x => x.id === action.payload.alertId);
      if (a) (a as any).status = action.payload.status;
      if (state.activeAlert?.alert_id === action.payload.alertId) {
        state.activeAlert = null;
        state.countdown   = 0;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchAlerts.pending,   (s) => { s.isLoading = true; });
    builder.addCase(fetchAlerts.fulfilled, (s, a) => {
      s.isLoading   = false;
      s.alerts      = a.payload.items;
      s.totalAlerts = a.payload.total;
    });
    builder.addCase(fetchAlerts.rejected, (s) => { s.isLoading = false; });

    builder.addCase(doAlertAction.fulfilled, (s, a) => {
      const idx = s.alerts.findIndex(x => x.id === a.payload.id);
      if (idx !== -1) s.alerts[idx] = a.payload;
      if (s.activeAlert?.alert_id === a.payload.id) {
        s.activeAlert = null;
        s.countdown   = 0;
      }
    });
  },
});

export const { setActiveAlert, tickCountdown, clearActiveAlert, updateAlertStatus } = alertSlice.actions;
export default alertSlice.reducer;