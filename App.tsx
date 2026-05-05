import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';

import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { useWebSocketEvents } from './src/hooks';
import { initAuth, setFcmToken } from './src/store/slices/authSlice';
import { useAppDispatch, useAppSelector } from './src/hooks';
import { userApi } from './src/api/client';

function AppInner() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector(s => s.auth);

  useWebSocketEvents();

  // 🔐 Init auth
  useEffect(() => {
    dispatch(initAuth());
  }, []);

  // 🔔 Push registration
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let cleanup: (() => void) | undefined;

    const setup = async () => {
      cleanup = await registerPush();
    };

    setup();

    return () => cleanup?.();
  }, [isAuthenticated, user?.id]);

  const registerPush = async () => {
    try {
      const Notifications = await import('expo-notifications');
      const Device = await import('expo-device');

      if (!Device.default.isDevice) {
        console.log('[Push] Skipping — emulator');
        return;
      }

      // ✅ FIXED (no TS error)
      Notifications.default.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        } as any),
      });

      const { status: existing } = await Notifications.default.getPermissionsAsync();
      let finalStatus = existing;

      if (existing !== 'granted') {
        const { status } = await Notifications.default.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Push] Permission denied');
        return;
      }

      let token: string | null = null;

      try {
        const result = await Notifications.default.getExpoPushTokenAsync({
          projectId: '43f63f95-ab32-4206-b1b8-f4f75f2d8fd5',
        });

        token = result.data;
        console.log('[Push] Token:', token.slice(0, 20));
      } catch (e) {
        console.warn('[Push] Token failed (Expo Go expected)');
        return;
      }

      if (token) {
        dispatch(setFcmToken(token));
        await userApi.updateProfile({ fcm_token: token });
      }

      const sub = Notifications.default.addNotificationResponseReceivedListener(res => {
        const data = res.notification.request.content.data as any;
        console.log('[Push Click]', data?.type, data?.alert_id);
      });

      return () => sub.remove();

    } catch (e) {
      console.log('[Push] Not available');
    }
  };

  return <AppNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <AppInner />
      </Provider>
    </GestureHandlerRootView>
  );
}