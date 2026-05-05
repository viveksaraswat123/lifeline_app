import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import alertReducer from './slices/alertSlice';
import deviceReducer from './slices/deviceSlice';

export const store = configureStore({
  reducer: {
    auth:    authReducer,
    alerts:  alertReducer,
    devices: deviceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;