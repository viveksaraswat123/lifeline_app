import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  Alert, ScrollView, RefreshControl, StatusBar,
} from 'react-native';
import * as ExpoClipboard from 'expo-clipboard';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchDevices, registerDevice } from '../../store/slices/deviceSlice';
import { deviceApi } from '../../api/client';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../../constants';
import { Card, Button, Input, ScreenHeader, InfoRow, EmptyState } from '../../components/common';
import type { Device } from '../../types';

// ─── Devices List Screen ──────────────────────────────────────────────────────

export function DevicesScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const { devices, isLoading } = useAppSelector(s => s.devices);
  const [showModal, setShowModal] = useState(false);
  const [uid, setUid]   = useState('');
  const [name, setName] = useState('Lifeline Device');
  const [adding, setAdding] = useState(false);

  useEffect(() => { dispatch(fetchDevices()); }, []);

  const add = async () => {
    if (!uid.trim()) return Alert.alert('Error', 'Enter Device UID');
    setAdding(true);
    try {
      await dispatch(registerDevice({ device_uid: uid.trim(), name: name.trim() })).unwrap();
      setShowModal(false); setUid(''); setName('Lifeline Device');
      Alert.alert('Device Registered!', 'Copy the API key and flash it to your ESP32.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setAdding(false);
    }
  };

  const batteryColor = (pct?: number) =>
    pct == null ? COLORS.textMuted : pct > 60 ? COLORS.success : pct > 30 ? COLORS.warning : COLORS.danger;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScreenHeader
        title="Devices"
        subtitle={`${devices.length} registered`}
        right={
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        }
      />
      <FlatList
        data={devices}
        keyExtractor={d => String(d.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => dispatch(fetchDevices())} tintColor={COLORS.primary} />}
        renderItem={({ item: d }) => (
          <TouchableOpacity
            style={styles.deviceCard}
            onPress={() => navigation.navigate('DeviceDetail', { deviceId: d.id })}
            activeOpacity={0.85}
          >
            <View style={styles.deviceCardTop}>
              <View style={styles.deviceCardLeft}>
                <Text style={{ fontSize: 32 }}>📡</Text>
                <View>
                  <Text style={styles.deviceCardName}>{d.name}</Text>
                  <Text style={styles.deviceCardUid}>{d.device_uid}</Text>
                </View>
              </View>
              <View style={[styles.statusPill, { backgroundColor: d.is_online ? COLORS.successDim : COLORS.surface2 }]}>
                <View style={[styles.statusDot, { backgroundColor: d.is_online ? COLORS.success : COLORS.textMuted }]} />
                <Text style={[styles.statusText, { color: d.is_online ? COLORS.success : COLORS.textMuted }]}>
                  {d.is_online ? 'ONLINE' : 'OFFLINE'}
                </Text>
              </View>
            </View>
            <View style={styles.deviceCardStats}>
              {d.battery_level != null && (
                <View style={styles.statPill}>
                  <Text style={[styles.statPillText, { color: batteryColor(d.battery_level) }]}>
                    🔋 {d.battery_level}%
                  </Text>
                </View>
              )}
              {d.firmware_version && (
                <View style={styles.statPill}>
                  <Text style={styles.statPillText}>FW {d.firmware_version}</Text>
                </View>
              )}
              {d.last_seen && (
                <View style={styles.statPill}>
                  <Text style={styles.statPillText}>
                    Seen {new Date(d.last_seen).toLocaleTimeString()}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState icon="📡" title="No devices yet"
            subtitle="Register your ESP32 Lifeline device to start tracking"
            action="+ Add Device" onAction={() => setShowModal(true)} />
        }
      />

      {/* Add Device Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Register ESP32 Device</Text>
            <Text style={styles.modalSub}>
              Find Device UID in Serial Monitor on boot — it's the MAC address or the custom ID you set.
            </Text>
            <Input label="Device UID *" value={uid} onChangeText={setUid}
              placeholder="AA:BB:CC:DD:EE:FF" autoCapitalize="characters" />
            <Input label="Device Name" value={name} onChangeText={setName}
              placeholder="My Bike / Car / etc." />
            <View style={styles.modalBtns}>
              <Button label="Cancel" variant="ghost" onPress={() => setShowModal(false)} style={{ flex: 1 }} />
              <Button label="Register" onPress={add} loading={adding} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Device Detail Screen ─────────────────────────────────────────────────────

export function DeviceDetailScreen({ route, navigation }: any) {
  const { deviceId } = route.params;
  const dispatch = useAppDispatch();
  const device   = useAppSelector((s: { devices: { devices: any[]; }; }) => s.devices.devices.find(d => d.id === deviceId));
  const [saving, setSaving] = useState(false);
  const [name, setName]     = useState(device?.name ?? '');
  const [impactTh, setImpactTh] = useState(String(device?.impact_threshold ?? ''));
  const [tiltTh,   setTiltTh]   = useState(String(device?.tilt_threshold   ?? ''));

  const save = async () => {
    if (!device) return;
    setSaving(true);
    try {
      await deviceApi.update(device.id, {
        name,
        impact_threshold: impactTh ? parseFloat(impactTh) : undefined,
        tilt_threshold:   tiltTh   ? parseFloat(tiltTh)   : undefined,
      });
      dispatch(fetchDevices());
      Alert.alert('Saved', 'Device settings updated');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const copyKey = async () => {
    if (device) { await ExpoClipboard.setStringAsync(device.api_key); Alert.alert('Copied', 'API key copied to clipboard'); }
  };

  const regenKey = () => {
    Alert.alert('Regenerate Key', 'Old key stops working. Re-flash your ESP32 after.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Regenerate', style: 'destructive', onPress: async () => {
          if (!device) return;
          try { await deviceApi.regenerateKey(device.id); dispatch(fetchDevices()); Alert.alert('Done', 'Reflash your ESP32 with the new key.'); }
          catch (e: any) { Alert.alert('Error', e.message); }
        }
      }
    ]);
  };

  if (!device) return <View style={styles.container}><EmptyState icon="❓" title="Device not found" /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScreenHeader title="Device Settings" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.detailScroll}>

        {/* Status */}
        <Card style={styles.statusCard}>
          <View style={[styles.statusPill, { alignSelf: 'center', marginBottom: SPACING.md,
            backgroundColor: device.is_online ? COLORS.successDim : COLORS.surface2 }]}>
            <View style={[styles.statusDot, { backgroundColor: device.is_online ? COLORS.success : COLORS.textMuted }]} />
            <Text style={[styles.statusText, { color: device.is_online ? COLORS.success : COLORS.textMuted }]}>
              {device.is_online ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </View>
          {device.battery_level != null && (
            <Text style={[styles.detailBattery, { color: device.battery_level > 30 ? COLORS.success : COLORS.danger }]}>
              🔋 {device.battery_level}%
            </Text>
          )}
          <InfoRow label="Device UID"      value={device.device_uid} mono />
          <InfoRow label="Firmware"        value={device.firmware_version ?? '—'} />
          {device.last_seen && <InfoRow label="Last Seen" value={new Date(device.last_seen).toLocaleString()} />}
        </Card>

        {/* Editable settings */}
        <Card style={{ marginBottom: SPACING.md }}>
          <Text style={styles.cardTitle}>Settings</Text>
          <Input label="Device Name" value={name} onChangeText={setName} />
          <Input label="Impact Threshold (G) — default 2.5" value={impactTh}
            onChangeText={setImpactTh} keyboardType="decimal-pad" placeholder="2.5" />
          <Input label="Tilt Threshold (°) — default 60" value={tiltTh}
            onChangeText={setTiltTh} keyboardType="decimal-pad" placeholder="60" />
          <Button label="Save Settings" onPress={save} loading={saving} />
        </Card>

        {/* API Key */}
        <Card style={{ marginBottom: SPACING.md }}>
          <Text style={styles.cardTitle}>API Key</Text>
          <Text style={styles.apiKeyHint}>Flash this into your ESP32 firmware as API_KEY</Text>
          <TouchableOpacity style={styles.apiKeyBox} onPress={copyKey}>
            <Text style={styles.apiKeyText} numberOfLines={2}>{device.api_key}</Text>
            <Text style={styles.apiKeyCopyHint}>Tap to copy</Text>
          </TouchableOpacity>
          <Button label="Regenerate Key" variant="outline" onPress={regenKey} style={{ marginTop: SPACING.sm }} />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  list:         { padding: SPACING.xl, gap: SPACING.sm, paddingBottom: 40 },
  detailScroll: { padding: SPACING.xl, paddingBottom: 60 },

  addBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.sm },

  deviceCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border,
  },
  deviceCardTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  deviceCardLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  deviceCardName: { color: COLORS.textPrimary, fontSize: FONT_SIZES.lg, fontWeight: '700' },
  deviceCardUid:  { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, fontFamily: 'monospace', marginTop: 2 },
  deviceCardStats:{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },

  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5 },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: FONT_SIZES.xs, fontWeight: '700', letterSpacing: 0.5 },

  statPill: { backgroundColor: COLORS.surface2, borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.border },
  statPillText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.xs },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'],
    padding: SPACING['2xl'], paddingBottom: 40, borderTopWidth: 1, borderColor: COLORS.border,
  },
  modalTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.xl, fontWeight: '800', marginBottom: SPACING.sm },
  modalSub:   { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, marginBottom: SPACING.xl, lineHeight: 20 },
  modalBtns:  { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },

  statusCard: { alignItems: 'center', marginBottom: SPACING.md },
  detailBattery: { fontSize: FONT_SIZES.xl, fontWeight: '800', marginBottom: SPACING.md },
  cardTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.md, fontWeight: '700', marginBottom: SPACING.md },
  apiKeyHint: { color: COLORS.textSecondary, fontSize: FONT_SIZES.xs, marginBottom: SPACING.sm },
  apiKeyBox:  { backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  apiKeyText: { color: COLORS.accent, fontSize: FONT_SIZES.xs, fontFamily: 'monospace', lineHeight: 18 },
  apiKeyCopyHint: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: SPACING.xs },
});