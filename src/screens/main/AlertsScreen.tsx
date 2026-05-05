import type { Alert } from '../../types';
import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, StatusBar, ScrollView, Alert as RNAlert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchAlerts, doAlertAction } from '../../store/slices/alertSlice';
import { COLORS, SPACING, FONT_SIZES, RADIUS, ALERT_META, STATUS_META } from '../../constants';
import { Card, Badge, ScreenHeader, InfoRow, Button, EmptyState } from '../../components/common';
import { format } from 'date-fns';

// ─── SAFE DATE ───────────────────────────────────────────────────────────────

const safeDate = (date: string, formatStr: string) => {
  try {
    return format(new Date(date), formatStr);
  } catch {
    return '--';
  }
};

// ─── Alert Card ───────────────────────────────────────────────────────────────

function AlertCard({ alert, onPress }: { alert: Alert; onPress: () => void }) {
  const meta   = ALERT_META[alert.alert_type] ?? ALERT_META.combined;
  const status = STATUS_META[alert.status] ?? STATUS_META.pending;

  return (
    <TouchableOpacity
      style={[styles.alertCard, { borderLeftColor: meta.color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.alertCardLeft}>
        <Text style={styles.alertCardIcon}>{meta.icon}</Text>
      </View>

      <View style={styles.alertCardBody}>
        <View style={styles.alertCardTop}>
          <Text style={styles.alertCardType}>{meta.label}</Text>
          <Badge label={status.label} color={status.color} bg={status.bg} />
        </View>

        <Text style={styles.alertCardDate}>
          {safeDate(alert.triggered_at, 'MMM d yyyy · HH:mm:ss')}
        </Text>

        <View style={styles.alertCardMeta}>
          {alert.impact_g != null && (
            <Text style={styles.alertCardMetaItem}>⚡ {alert.impact_g.toFixed(1)}G</Text>
          )}
          {alert.speed_kmh != null && (
            <Text style={styles.alertCardMetaItem}>🚗 {alert.speed_kmh.toFixed(0)} km/h</Text>
          )}
          {alert.latitude != null && (
            <Text style={styles.alertCardMetaItem}>📍 GPS</Text>
          )}
          {alert.sms_sent && (
            <Text style={styles.alertCardMetaItem}>💬 SMS sent</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Alerts List Screen ───────────────────────────────────────────────────────

export function AlertsScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const { alerts, isLoading, totalAlerts } = useAppSelector(s => s.alerts);

  useEffect(() => { dispatch(fetchAlerts({})); }, []);

  const onRefresh = useCallback(() => { dispatch(fetchAlerts({})); }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScreenHeader title="Alerts" subtitle={`${totalAlerts} total`} />

      <FlatList
        data={alerts}
        keyExtractor={a => String(a.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <AlertCard
            alert={item}
            onPress={() => navigation.navigate('AlertDetail', { alertId: item.id })}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState icon="✅" title="No alerts yet" subtitle="Your safety record is clean!" />
        }
      />
    </View>
  );
}

// ─── Alert Detail Screen ──────────────────────────────────────────────────────

export function AlertDetailScreen({ route, navigation }: any) {
  const { alertId } = route.params;
  const dispatch = useAppDispatch();
  const alerts   = useAppSelector(s => s.alerts.alerts);
  const alert    = alerts.find(a => a.id === alertId);

  const handleAction = (action: 'cancel' | 'confirm' | 'resolve') => {
    const labels = { cancel: 'Cancel Alert', confirm: 'Confirm Accident', resolve: 'Mark Resolved' };

    RNAlert.alert(labels[action], 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: action === 'cancel' ? 'destructive' : 'default',
        onPress: () => dispatch(doAlertAction({ id: alertId, action })),
      },
    ]);
  };

  if (!alert) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Alert" onBack={() => navigation.goBack()} />
        <EmptyState icon="❓" title="Alert not found" />
      </View>
    );
  }

  const meta   = ALERT_META[alert.alert_type] ?? ALERT_META.combined;
  const status = STATUS_META[alert.status] ?? STATUS_META.pending;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScreenHeader title={`Alert #${alert.id}`} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>

        {/* Status */}
        <View style={[styles.statusBanner, { backgroundColor: status.bg, borderColor: status.color }]}>
          <Text style={styles.statusBannerIcon}>{meta.icon}</Text>

          <View style={{ marginLeft: SPACING.md }}>
            <Text style={[styles.statusBannerType, { color: meta.color }]}>{meta.label}</Text>
            <Text style={[styles.statusBannerStatus, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        {/* Sensor */}
        <Card style={{ marginBottom: SPACING.md }}>
          <Text style={styles.cardTitle}>Sensor Data</Text>
          {alert.impact_g != null && <InfoRow label="Impact" value={`${alert.impact_g.toFixed(3)}G`} />}
          {alert.speed_kmh != null && <InfoRow label="Speed" value={`${alert.speed_kmh.toFixed(0)} km/h`} />}
        </Card>

        {/* Timeline */}
        <Card style={{ marginBottom: SPACING.md }}>
          <Text style={styles.cardTitle}>Timeline</Text>
          <InfoRow label="Triggered" value={safeDate(alert.triggered_at, 'MMM d yyyy HH:mm:ss')} />
        </Card>

        {/* Actions */}
        {alert.status === 'pending' && (
          <View style={styles.actionRow}>
            <Button label="False Alarm" variant="success" onPress={() => handleAction('cancel')} style={{ flex: 1 }} />
            <View style={{ width: SPACING.md }} />
            <Button label="Real Accident" variant="danger" onPress={() => handleAction('confirm')} style={{ flex: 1 }} />
          </View>
        )}

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  list: {
    padding: SPACING.xl,
    paddingBottom: 40,
  },

  detailScroll: {
    padding: SPACING.xl,
    paddingBottom: 60,
  },

  alertCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },

  alertCardLeft: {
    justifyContent: 'center',
    marginRight: SPACING.md,
  },

  alertCardIcon: { fontSize: 30 },

  alertCardBody: { flex: 1 },

  alertCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  alertCardType: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },

  alertCardDate: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    marginTop: 4,
  },

  alertCardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },

  alertCardMetaItem: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginRight: SPACING.sm,
  },

  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },

  statusBannerIcon: { fontSize: 40 },

  statusBannerType: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
  },

  statusBannerStatus: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },

  cardTitle: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },

  actionRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
});