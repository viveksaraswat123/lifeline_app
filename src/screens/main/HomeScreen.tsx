import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Animated, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchAlerts } from '../../store/slices/alertSlice';
import { fetchDevices } from '../../store/slices/deviceSlice';
import { wsService } from '../../api/ws';
import { COLORS, SPACING, FONT_SIZES, RADIUS, ALERT_META, STATUS_META } from '../../constants';
import { Card, SectionHeader, Badge } from '../../components/common';
import { format } from 'date-fns';
const BG_GRADIENT = ['#0A0A0F', '#0F0F1A', '#151528'] as const;
export default function HomeScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);
  const alerts = useAppSelector(s => s.alerts.alerts);
  const devices = useAppSelector(s => s.devices.devices);
  const liveLocation = useAppSelector(s => s.devices.liveLocation);

  const [refreshing, setRefreshing] = React.useState(false);
  const [wsConnected, setWsConnected] = React.useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const staticScale = useRef(new Animated.Value(1)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  // Initial load
  useEffect(() => {
    dispatch(fetchAlerts({}));
    dispatch(fetchDevices());

    setWsConnected(wsService.isConnected);

    const onConn = ({ connected }: { connected: boolean }) => setWsConnected(connected);
    wsService.on('connection_change', onConn);

    return () => wsService.off('connection_change', onConn);
  }, []);

  // Pulse animation
  useEffect(() => {
    if (wsConnected) {
      animRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.5, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      );
      animRef.current.start();
    } else {
      animRef.current?.stop();
    }

    return () => animRef.current?.stop();
  }, [wsConnected]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([
      dispatch(fetchAlerts({})),
      dispatch(fetchDevices())
    ]);
    setRefreshing(false);
  };

  // Memoized data
  const recentAlerts = React.useMemo(() => alerts.slice(0, 4), [alerts]);

  const onlineDevices = React.useMemo(
    () => devices.filter(d => d.is_online),
    [devices]
  );

  const todayAlerts = React.useMemo(() => {
    const now = new Date();
    return alerts.filter(a => {
      const d = new Date(a.triggered_at);
      return d.toDateString() === now.toDateString();
    });
  }, [alerts]);

  const safeDate = (date: string) => {
    try {
      return format(new Date(date), 'MMM d, HH:mm');
    } catch {
      return '--';
    }
  };

  return (
    <LinearGradient colors={BG_GRADIENT} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Good day, {user?.full_name?.split(' ')[0]} 👋
            </Text>
            <Text style={styles.greetingSub}>Your safety dashboard</Text>
          </View>

          <TouchableOpacity style={styles.wsBadge}>
            <Animated.View style={[
              styles.wsDot,
              {
                transform: [{ scale: wsConnected ? pulseAnim : staticScale }]
              }
            ]} />
            <Text style={[styles.wsText, { color: wsConnected ? COLORS.success : COLORS.textMuted }]}>
              {wsConnected ? 'LIVE' : 'OFFLINE'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Devices', value: devices.length, sub: `${onlineDevices.length} online` },
            { label: "Today's Alerts", value: todayAlerts.length, sub: '24h', highlight: todayAlerts.length > 0 },
            { label: 'Total Alerts', value: alerts.length, sub: 'all time' },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, s.highlight && styles.statCardHighlight]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statSub}>{s.sub}</Text>
            </View>
          ))}
        </View>

        {/* Devices */}
        <View style={styles.section}>
          <SectionHeader title="My Devices" />

          {devices.map(d => (
            <Card key={d.id} style={[styles.deviceRow, styles.glassCard]}>
             <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 28, marginRight: 10 }}>📡</Text>
                <Text style={{ fontSize: 28 }}>📡</Text>
                <View>
                  <Text style={styles.deviceName}>{d.name}</Text>
                  <Text style={styles.deviceId}>{d.device_uid}</Text>
                </View>
              </View>

              <View>
                <View style={styles.batteryBar}>
                  <View style={[styles.batteryFill, { width: `${d.battery_level ?? 0}%` }]} />
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Alerts */}
        <View style={styles.section}>
          <SectionHeader title="Recent Alerts" />

          {recentAlerts.map(a => {
            const meta = ALERT_META[a.alert_type] ?? ALERT_META.combined;
            const status = STATUS_META[a.status] ?? STATUS_META.pending;

            return (
              <TouchableOpacity
                key={a.id}
                activeOpacity={0.8}
                style={[styles.alertRow, { borderLeftColor: meta.color }]}
              >
                <Text style={{ fontSize: 26 }}>{meta.icon}</Text>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.alertRowTitle}>{meta.label}</Text>
                  <Text style={styles.alertRowDate}>{safeDate(a.triggered_at)}</Text>
                </View>

                <Badge label={status.label} color={status.color} bg={status.bg} />
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.xl,
    paddingTop: 60,
  },

  greeting: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '900',
  },

  greetingSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },

  wsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },

  wsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },

  wsText: {
    fontSize: 10,
    fontWeight: '700',
  },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    gap: 10,
  },

  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  statCardHighlight: {
    borderColor: COLORS.primary,
    borderWidth: 1,
  },

  statValue: {
    fontSize: 24,
    color: COLORS.textPrimary,
    fontWeight: '900',
  },

  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },

  statSub: {
    color: COLORS.textMuted,
    fontSize: 10,
  },

  section: {
    padding: SPACING.xl,
  },

  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 10,
  },

  deviceName: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },

  deviceId: {
    color: COLORS.textMuted,
    fontSize: 10,
  },

  batteryBar: {
    width: 60,
    height: 6,
    backgroundColor: COLORS.surface2,
    borderRadius: 3,
  },

  batteryFill: {
    height: '100%',
    backgroundColor: COLORS.success,
  },

  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderLeftWidth: 4,
  },

  alertRowTitle: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },

  alertRowDate: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
});