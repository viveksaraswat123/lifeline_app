import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator }   from '@react-navigation/bottom-tabs';

import { useAppSelector }         from '../hooks';
import { COLORS, FONT_SIZES }     from '../constants';

// Screens
import { LoginScreen, RegisterScreen }                  from '../screens/auth/AuthScreens';
import HomeScreen                                        from '../screens/main/HomeScreen';
import { AlertsScreen, AlertDetailScreen }               from '../screens/main/AlertsScreen';
import MapScreen                                         from '../screens/main/MapScreen';
import { DevicesScreen, DeviceDetailScreen }             from '../screens/main/DevicesScreen';
import { ProfileScreen, EmergencyContactsScreen }        from '../screens/main/ProfileScreen';
import ActiveAlertOverlay                                from '../components/alerts/ActiveAlertOverlay';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const NAV_THEME = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: COLORS.bg },
};

const SCREEN_OPTIONS = { headerShown: false, animation: 'slide_from_right' } as const;

// ─── Auth Stack ───────────────────────────────────────────────────────────────

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={SCREEN_OPTIONS}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ─── Home Stack ───────────────────────────────────────────────────────────────

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={SCREEN_OPTIONS}>
      <Stack.Screen name="Home"        component={HomeScreen} />
      <Stack.Screen name="AlertDetail" component={AlertDetailScreen} />
    </Stack.Navigator>
  );
}

// ─── Devices Stack ────────────────────────────────────────────────────────────

function DevicesStack() {
  return (
    <Stack.Navigator screenOptions={SCREEN_OPTIONS}>
      <Stack.Screen name="DeviceList"   component={DevicesScreen} />
      <Stack.Screen name="DeviceDetail" component={DeviceDetailScreen} />
    </Stack.Navigator>
  );
}

// ─── Profile Stack ────────────────────────────────────────────────────────────

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={SCREEN_OPTIONS}>
      <Stack.Screen name="Profile"            component={ProfileScreen} />
      <Stack.Screen name="EmergencyContacts"  component={EmergencyContactsScreen} />
    </Stack.Navigator>
  );
}

// ─── Tab icon helper ──────────────────────────────────────────────────────────

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>;
}

// ─── Main Tabs ────────────────────────────────────────────────────────────────

function MainTabs() {
  const activeAlert = useAppSelector(s => s.alerts.activeAlert);

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopColor: COLORS.border,
            borderTopWidth: 1,
            height: 72,
            paddingBottom: 12,
            paddingTop: 8,
          },
          tabBarActiveTintColor:   COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarLabelStyle: { fontSize: FONT_SIZES.xs, fontWeight: '600' },
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStack}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="MapTab"
          component={MapScreen}
          options={{
            tabBarLabel: 'Track',
            tabBarIcon: ({ focused }) => <TabIcon emoji="📍" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="AlertsTab"
          component={AlertsScreen}
          options={{
            tabBarLabel: 'Alerts',
            tabBarIcon: ({ focused }) => <TabIcon emoji="🚨" focused={focused} />,
            tabBarBadge: activeAlert ? '!' : undefined,
            tabBarBadgeStyle: { backgroundColor: COLORS.primary, color: '#fff', fontSize: 10 },
          }}
        />
        <Tab.Screen
          name="DevicesTab"
          component={DevicesStack}
          options={{
            tabBarLabel: 'Devices',
            tabBarIcon: ({ focused }) => <TabIcon emoji="📡" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileStack}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
          }}
        />
      </Tab.Navigator>

      {/* Full-screen alert overlay sits above tabs */}
      {activeAlert && <ActiveAlertOverlay />}
    </View>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAppSelector(s => s.auth);

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashLogo}>🛡️</Text>
        <Text style={styles.splashTitle}>LIFELINE</Text>
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={NAV_THEME}>
      <Stack.Navigator screenOptions={SCREEN_OPTIONS}>
        {!isAuthenticated
          ? <Stack.Screen name="Auth" component={AuthStack} />
          : <Stack.Screen name="Main" component={MainTabs} />
        }
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1, backgroundColor: COLORS.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  splashLogo:  { fontSize: 80, marginBottom: 12 },
  splashTitle: { color: COLORS.primary, fontSize: 42, fontWeight: '900', letterSpacing: 8 },
});