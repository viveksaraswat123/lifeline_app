import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { useEffect, useRef } from 'react';
import { Vibration } from 'react-native';
import type { RootState, AppDispatch } from '../store';
import { wsService } from '../api/ws';
import {
  setActiveAlert, tickCountdown, updateAlertStatus,
} from '../store/slices/alertSlice';
import { setLiveLocation, updateDeviceStatus } from '../store/slices/deviceSlice';
import type { WSAlertNewData, WSLocationData, WSDeviceStatusData } from '../types';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// ─── WS integration hook — mount once at app root ─────────────────────────────
export function useWebSocketEvents() {
  const dispatch    = useAppDispatch();
  const activeAlert = useAppSelector(s => s.alerts.activeAlert);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── WebSocket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    const onAlert = (data: WSAlertNewData) => {
      dispatch(setActiveAlert(data));
      Vibration.vibrate([0, 700, 200, 700, 200, 700], true);
    };

    const onAlertUpdate = (data: { alert_id: number; status: string }) => {
      dispatch(updateAlertStatus({ alertId: data.alert_id, status: data.status }));
      Vibration.cancel();
    };

    const onLocation     = (data: WSLocationData)     => dispatch(setLiveLocation(data));
    const onDeviceStatus = (data: WSDeviceStatusData) => dispatch(updateDeviceStatus(data));

    wsService.on('alert_new',     onAlert);
    wsService.on('alert_update',  onAlertUpdate);
    wsService.on('location',      onLocation);
    wsService.on('device_status', onDeviceStatus);

    return () => {
      wsService.off('alert_new',     onAlert);
      wsService.off('alert_update',  onAlertUpdate);
      wsService.off('location',      onLocation);
      wsService.off('device_status', onDeviceStatus);
    };
  }, [dispatch]);

  // ── Countdown ticker ─────────────────────────────────────────────────────────
  //
  // THE BUG in the old code:  dependency was [countdown]
  //   → useEffect re-ran every second as countdown changed
  //   → each re-run called setInterval again WITHOUT clearing the previous one
  //   → after 10s you had 10 simultaneous intervals all firing tickCountdown()
  //   → countdown jumped 10 numbers per second, not 1
  //
  // THE FIX: depend on activeAlert?.alert_id instead
  //   → effect runs exactly ONCE when a new alert arrives
  //   → ONE interval is created, ticks every second cleanly
  //   → cleanup runs when alert disappears or a new alert_id arrives
  //
  useEffect(() => {
    // Clear any leftover interval from a previous alert
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!activeAlert) return; // nothing to count down for

    timerRef.current = setInterval(() => {
      dispatch(tickCountdown());
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      Vibration.cancel();
    };
  }, [activeAlert?.alert_id]); // only fires when a NEW alert arrives
}