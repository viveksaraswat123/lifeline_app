import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchDevices, fetchLocationHistory } from '../../store/slices/deviceSlice';
import { COLORS, FONT_SIZES, SPACING } from '../../constants';

const DARK_STYLE = [
  { elementType: 'geometry',            stylers: [{ color: '#16161F' }] },
  { elementType: 'labels.text.fill',    stylers: [{ color: '#8888AA' }] },
  { elementType: 'labels.text.stroke',  stylers: [{ color: '#0A0A0F' }] },
  { featureType: 'road', elementType: 'geometry',        stylers: [{ color: '#242435' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1C1C28' }] },
  { featureType: 'road.highway', elementType: 'geometry',stylers: [{ color: '#2E2E42' }] },
  { featureType: 'water', elementType: 'geometry',       stylers: [{ color: '#0A0A0F' }] },
  { featureType: 'poi',   elementType: 'geometry',       stylers: [{ color: '#16161F' }] },
  { featureType: 'transit', elementType: 'geometry',     stylers: [{ color: '#242435' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

export default function MapScreen() {
  const dispatch      = useAppDispatch();
  const devices       = useAppSelector(s => s.devices.devices);
  const liveLocation  = useAppSelector(s => s.devices.liveLocation);
  const history       = useAppSelector(s => s.devices.locationHistory);
  const mapRef        = useRef<MapView>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await dispatch(fetchDevices()).unwrap();
      if (res.length > 0) {
        try { await dispatch(fetchLocationHistory(res[0].id)); } catch {}
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (liveLocation) {
      mapRef.current?.animateToRegion({
        latitude:      liveLocation.latitude,
        longitude:     liveLocation.longitude,
        latitudeDelta:  0.005,
        longitudeDelta: 0.005,
      }, 800);
    }
  }, [liveLocation?.timestamp]);

  const center = () => {
    if (!liveLocation) return;
    mapRef.current?.animateToRegion({
      latitude:      liveLocation.latitude,
      longitude:     liveLocation.longitude,
      latitudeDelta:  0.004,
      longitudeDelta: 0.004,
    }, 600);
  };

  const loc = liveLocation;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Overlay header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📍 Live Tracking</Text>
        {loc && (
          <Text style={styles.headerSub}>
            {devices[0]?.name ?? 'Device'} · {(loc.speed_kmh ?? 0).toFixed(0)} km/h
          </Text>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Loading tracking data…</Text>
        </View>
      ) : !loc ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📡</Text>
          <Text style={styles.noGpsTitle}>No GPS data yet</Text>
          <Text style={styles.noGpsSub}>Ensure your device is online and has a GPS fix (outdoor or near window)</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          customMapStyle={DARK_STYLE}
          initialRegion={{
            latitude:      loc.latitude,
            longitude:     loc.longitude,
            latitudeDelta:  0.01,
            longitudeDelta: 0.01,
          }}
        >
          {/* Route polyline */}
          {history.length > 1 && (
            <Polyline
              coordinates={history.map(h => ({ latitude: h.latitude, longitude: h.longitude }))}
              strokeColor={COLORS.primary}
              strokeWidth={2.5}
              lineDashPattern={[6, 4]}
            />
          )}

          {/* Device marker */}
          <Marker coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            title={devices[0]?.name ?? 'Device'}
            description={`${(loc.speed_kmh ?? 0).toFixed(0)} km/h`}
          >
            <View style={styles.markerOuter}>
              <View style={styles.markerInner} />
            </View>
          </Marker>
        </MapView>
      )}

      {/* Center button */}
      {loc && (
        <TouchableOpacity style={styles.centerBtn} onPress={center}>
          <Text style={styles.centerBtnText}>◎</Text>
        </TouchableOpacity>
      )}

      {/* Bottom info strip */}
      {loc && (
        <View style={styles.infoStrip}>
          {[
            { label: 'LAT',  value: loc.latitude.toFixed(5) },
            { label: 'LNG',  value: loc.longitude.toFixed(5) },
            { label: 'SPD',  value: `${(loc.speed_kmh ?? 0).toFixed(0)} km/h` },
            { label: 'SAT',  value: String(loc.satellites ?? '—') },
          ].map(i => (
            <View key={i.label} style={styles.infoItem}>
              <Text style={styles.infoLabel}>{i.label}</Text>
              <Text style={styles.infoValue}>{i.value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  map:       { flex: 1 },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    backgroundColor: 'rgba(10,10,15,0.92)',
    paddingTop: 58, paddingBottom: 12, paddingHorizontal: SPACING.xl,
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.xl, fontWeight: '800' },
  headerSub:   { color: COLORS.textSecondary, fontSize: FONT_SIZES.xs, marginTop: 2 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  loadingText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md, marginTop: 12 },
  noGpsTitle:  { color: COLORS.textPrimary, fontSize: FONT_SIZES.xl, fontWeight: '700', textAlign: 'center' },
  noGpsSub:    { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  centerBtn: {
    position: 'absolute', bottom: 110, right: 20,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  centerBtnText: { color: COLORS.primary, fontSize: 22, fontWeight: '700' },
  infoStrip: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: 'rgba(10,10,15,0.95)',
    paddingVertical: 14, paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  infoItem:  { alignItems: 'center' },
  infoLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  infoValue: { color: COLORS.accent, fontSize: FONT_SIZES.sm, fontWeight: '700', fontFamily: 'monospace', marginTop: 2 },
  markerOuter: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,59,92,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,59,92,0.5)',
  },
  markerInner: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.primary, borderWidth: 2, borderColor: '#fff',
  },
});