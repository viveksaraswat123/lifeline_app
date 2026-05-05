import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { deviceApi, locationApi } from '../../api/client';
import type { DeviceState, Device, LocationPoint, WSLocationData, WSDeviceStatusData } from '../../types';

const initialState: DeviceState = {
  devices:         [],
  isLoading:       false,
  liveLocation:    null,
  locationHistory: [],
};

export const fetchDevices = createAsyncThunk('devices/fetch', () => deviceApi.list());

export const registerDevice = createAsyncThunk(
  'devices/register',
  async ({ device_uid, name }: { device_uid: string; name: string }) => {
    return deviceApi.register(device_uid, name);
  }
);

export const fetchLocationHistory = createAsyncThunk(
  'devices/fetchHistory',
  async (deviceId: number) => locationApi.history(deviceId, 200)
);

const deviceSlice = createSlice({
  name: 'devices',
  initialState,
  reducers: {
    setLiveLocation(state, action: PayloadAction<WSLocationData>) {
      state.liveLocation = action.payload;
      // Append to history (cap at 500 points)
      const pt: LocationPoint = {
        id:          Date.now(),
        device_id:   action.payload.device_id,
        latitude:    action.payload.latitude,
        longitude:   action.payload.longitude,
        speed_kmh:   action.payload.speed_kmh,
        heading_deg: action.payload.heading_deg,
        satellites:  action.payload.satellites,
        recorded_at: action.payload.timestamp,
      };
      state.locationHistory = [...state.locationHistory.slice(-499), pt];
    },
    updateDeviceStatus(state, action: PayloadAction<WSDeviceStatusData>) {
      const d = state.devices.find(x => x.id === action.payload.device_id);
      if (d) {
        d.is_online     = action.payload.is_online;
        d.battery_level = action.payload.battery_level;
        d.last_seen     = action.payload.last_seen;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchDevices.pending,   (s) => { s.isLoading = true; });
    builder.addCase(fetchDevices.fulfilled, (s, a) => {
      s.isLoading = false;
      s.devices   = a.payload;
    });
    builder.addCase(fetchDevices.rejected,  (s) => { s.isLoading = false; });

    builder.addCase(registerDevice.fulfilled, (s, a) => {
      if (!s.devices.find(d => d.id === a.payload.id)) {
        s.devices.push(a.payload);
      }
    });

    builder.addCase(fetchLocationHistory.fulfilled, (s, a) => {
      s.locationHistory = a.payload;
    });
  },
});

export const { setLiveLocation, updateDeviceStatus } = deviceSlice.actions;
export default deviceSlice.reducer;