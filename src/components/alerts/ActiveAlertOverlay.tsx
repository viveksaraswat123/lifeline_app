import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Vibration, StatusBar, Alert as RNAlert, ScrollView,
  Dimensions,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { doAlertAction } from '../../store/slices/alertSlice';
import { COLORS, ALERT_META, RADIUS, SPACING, FONT_SIZES } from '../../constants';

const { width: SCREEN_W } = Dimensions.get('window');

// SVG countdown ring config
const RING_SIZE   = 112;
const RING_RADIUS = 48;
const RING_CIRCUM = 2 * Math.PI * RING_RADIUS;
const TOTAL_SECS  = 30;

export default function ActiveAlertOverlay() {
  const dispatch    = useAppDispatch();
  const activeAlert = useAppSelector(s => s.alerts.activeAlert);
  const countdown   = useAppSelector(s => s.alerts.countdown);

  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const flashAnim   = useRef(new Animated.Value(0)).current;
  const scaleAnim   = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseLoop   = useRef<Animated.CompositeAnimation | null>(null);
  const flashLoop   = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!activeAlert) return;

    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim,   { toValue: 1, useNativeDriver: true, tension: 90, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    // Pulse the icon
    pulseLoop.current = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.14, duration: 600, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
    ]));
    pulseLoop.current.start();

    // Flash background
    flashLoop.current = Animated.loop(Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
      Animated.timing(flashAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
    ]));
    flashLoop.current.start();

    Vibration.vibrate([0, 800, 200, 800, 200, 800], true);

    return () => {
      pulseLoop.current?.stop();
      flashLoop.current?.stop();
      Vibration.cancel();
    };
  }, [activeAlert?.alert_id]);

  if (!activeAlert) return null;

  const meta = ALERT_META[activeAlert.alert_type] ?? ALERT_META.combined;

  // Ring progress: full at countdown=30, empty at 0
  const progress    = Math.max(0, Math.min(1, countdown / TOTAL_SECS));
  const strokeDash  = RING_CIRCUM * progress;
  const ringColor   = countdown <= 10 ? COLORS.danger : countdown <= 20 ? COLORS.warning : COLORS.success;

  const bgColor = flashAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['rgba(10,10,15,0.97)', 'rgba(30,5,12,0.97)'],
  });

  const handleCancel = () => {
    RNAlert.alert(
      '✕  False Alarm?',
      'Cancel this alert — no contacts will be notified.',
      [
        { text: 'No, keep it', style: 'cancel' },
        {
          text: 'Yes — Cancel Alert',
          style: 'destructive',
          onPress: () =>
            dispatch(doAlertAction({
              id:     activeAlert.alert_id,
              action: 'cancel',
              notes:  'False alarm — cancelled by user',
            })),
        },
      ]
    );
  };

  const handleConfirm = () => {
    RNAlert.alert(
      '🚨 Confirm Real Accident?',
      'Emergency contacts will be notified immediately by SMS.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes — Notify Contacts Now',
          style: 'default',
          onPress: () =>
            dispatch(doAlertAction({
              id:     activeAlert.alert_id,
              action: 'confirm',
              notes:  'Confirmed by user',
            })),
        },
      ]
    );
  };

  return (
    <Animated.View style={[styles.overlay, { backgroundColor: bgColor }]}>
      <StatusBar barStyle="light-content" />

      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>

        {/* Icon */}
        <Animated.View style={[styles.iconWrap, { borderColor: meta.color, transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.iconText}>{meta.icon}</Text>
        </Animated.View>

        <Text style={[styles.title, { color: meta.color }]}>{meta.label.toUpperCase()}</Text>
        <Text style={styles.subtitle}>Emergency contacts will be notified automatically</Text>

        {/* Countdown ring */}
        <View style={styles.ringWrap}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            {/* Track */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={8}
              fill="none"
            />
            {/* Progress arc */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={ringColor}
              strokeWidth={8}
              fill="none"
              strokeDasharray={`${strokeDash} ${RING_CIRCUM}`}
              strokeLinecap="round"
              rotation="-90"
              originX={RING_SIZE / 2}
              originY={RING_SIZE / 2}
            />
          </Svg>
          {/* Number in center */}
          <View style={styles.ringCenter}>
            <Text style={[styles.countdownNum, { color: ringColor }]}>{countdown}</Text>
            <Text style={styles.countdownLabel}>sec</Text>
          </View>
        </View>

        <Text style={styles.countdownHint}>
          {countdown > 0
            ? `Notifying contacts in ${countdown}s — cancel below if false alarm`
            : '⚠️ Alerting emergency contacts now…'}
        </Text>

        {/* Sensor data */}
        <View style={styles.dataRow}>
          {activeAlert.impact_g != null && (
            <View style={styles.dataCard}>
              <Text style={[styles.dataValue, { color: meta.color }]}>{activeAlert.impact_g.toFixed(1)}G</Text>
              <Text style={styles.dataLabel}>Impact</Text>
            </View>
          )}
          {activeAlert.speed_kmh != null && (
            <View style={styles.dataCard}>
              <Text style={styles.dataValue}>{Math.round(activeAlert.speed_kmh)}</Text>
              <Text style={styles.dataLabel}>km/h</Text>
            </View>
          )}
          {activeAlert.tilt_deg != null && (
            <View style={styles.dataCard}>
              <Text style={styles.dataValue}>{activeAlert.tilt_deg.toFixed(0)}°</Text>
              <Text style={styles.dataLabel}>Tilt</Text>
            </View>
          )}
          {activeAlert.latitude != null && (
            <View style={styles.dataCard}>
              <Text style={styles.dataValue}>GPS</Text>
              <Text style={styles.dataLabel}>Fixed ✓</Text>
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.btnRow}>
          {/* CANCEL — big prominent green button */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            activeOpacity={0.82}
          >
            <Text style={styles.cancelBtnIcon}>✕</Text>
            <Text style={styles.cancelBtnTitle}>FALSE ALARM</Text>
            <Text style={styles.cancelBtnSub}>Tap to cancel alert</Text>
          </TouchableOpacity>

          {/* CONFIRM */}
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirm}
            activeOpacity={0.82}
          >
            <Text style={styles.confirmBtnIcon}>🚨</Text>
            <Text style={styles.confirmBtnTitle}>REAL ACCIDENT</Text>
            <Text style={styles.confirmBtnSub}>Notify contacts now</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.alertId}>Alert #{activeAlert.alert_id}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border2,
  },

  // Icon
  iconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,59,92,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, marginBottom: SPACING.md,
  },
  iconText: { fontSize: 50 },

  title:    { fontSize: FONT_SIZES['2xl'], fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  subtitle: {
    color: COLORS.textSecondary, fontSize: FONT_SIZES.xs,
    textAlign: 'center', marginTop: SPACING.xs, marginBottom: SPACING.lg,
  },

  // Countdown ring
  ringWrap:   { width: RING_SIZE, height: RING_SIZE, position: 'relative', marginBottom: SPACING.sm },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  countdownNum:   { fontSize: 34, fontWeight: '900', lineHeight: 38 },
  countdownLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZES.xs, fontWeight: '700', letterSpacing: 1 },
  countdownHint:  {
    color: COLORS.textSecondary, fontSize: FONT_SIZES.xs, textAlign: 'center',
    marginBottom: SPACING.lg, paddingHorizontal: SPACING.md,
  },

  // Sensor data chips
  dataRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg, flexWrap: 'wrap', justifyContent: 'center' },
  dataCard: {
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
    minWidth: 64,
  },
  dataValue: { color: COLORS.textPrimary, fontSize: FONT_SIZES.lg, fontWeight: '800' },
  dataLabel: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: 2 },

  // Buttons
  btnRow: { flexDirection: 'row', gap: SPACING.md, width: '100%' },

  cancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(0,230,118,0.08)',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  cancelBtnIcon:  { fontSize: 24, marginBottom: 4 },
  cancelBtnTitle: { color: COLORS.success, fontWeight: '900', fontSize: FONT_SIZES.sm, letterSpacing: 1 },
  cancelBtnSub:   { color: COLORS.success, fontSize: FONT_SIZES.xs, opacity: 0.8, marginTop: 3 },

  confirmBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  confirmBtnIcon:  { fontSize: 24, marginBottom: 4 },
  confirmBtnTitle: { color: '#fff', fontWeight: '900', fontSize: FONT_SIZES.sm, letterSpacing: 1 },
  confirmBtnSub:   { color: 'rgba(255,255,255,0.75)', fontSize: FONT_SIZES.xs, marginTop: 3 },

  alertId: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: SPACING.md },
});