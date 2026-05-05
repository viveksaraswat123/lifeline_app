import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, TextInputProps, StyleProp, ViewStyle,
} from 'react-native';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../../constants';

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'success' | 'ghost' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  icon?: string;
}

export function Button({
  label, onPress, variant = 'primary', loading, disabled,
  size = 'md', style, icon,
}: ButtonProps) {

  const bg = {
    primary: COLORS.primary,
    danger: COLORS.danger,
    success: COLORS.success,
    ghost: 'transparent',
    outline: 'transparent',
  }[variant];

  const borderColor = variant === 'outline' ? COLORS.border2 : 'transparent';
  const color =
    variant === 'ghost' || variant === 'outline'
      ? COLORS.textSecondary
      : COLORS.textInverse;

  const padding = { sm: 10, md: 14, lg: 18 }[size];
  const fontSize = { sm: 13, md: 15, lg: 16 }[size];

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        {
          backgroundColor: bg,
          borderColor,
          paddingVertical: padding,
          borderWidth: variant === 'outline' ? 1 : 0,
        },
        (disabled || loading) && styles.btnDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color={color} size="small" />
        : <Text style={[styles.btnLabel, { color, fontSize }]}>
            {icon ? `${icon}  ` : ''}{label}
          </Text>
      }
    </TouchableOpacity>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({ label, error, containerStyle, ...props }: InputProps) {
  return (
    <View style={[styles.inputContainer, containerStyle]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}

      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          props.multiline && styles.inputMulti,
        ]}
        placeholderTextColor={COLORS.textMuted}
        selectionColor={COLORS.primary}
        {...props}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ─── Card (FIXED) ─────────────────────────────────────────────────────────────

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ─── Badge ────────────────────────────────────────────────────────────────────

export function Badge({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
  onAction,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>

      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}

      {action && onAction && (
        <Button
          label={action}
          onPress={onAction}
          style={{ marginTop: SPACING.lg }}
        />
      )}
    </View>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

export function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && { fontFamily: 'monospace' }]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

export function Divider() {
  return <View style={styles.divider} />;
}

// ─── Screen Header ────────────────────────────────────────────────────────────

export function ScreenHeader({
  title,
  subtitle,
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <View style={styles.screenHeader}>
      <View style={styles.screenHeaderLeft}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        )}

        <View style={{ marginLeft: SPACING.md }}>
          <Text style={styles.screenTitle}>{title}</Text>
          {subtitle && <Text style={styles.screenSubtitle}>{subtitle}</Text>}
        </View>
      </View>

      {right && <View>{right}</View>}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  btn: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  btnDisabled: { opacity: 0.5 },
  btnLabel: { fontWeight: '700', letterSpacing: 0.3 },

  inputContainer: { marginBottom: SPACING.lg },

  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },

  input: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  inputError: { borderColor: COLORS.danger },

  inputMulti: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: SPACING.md,
  },

  errorText: {
    color: COLORS.danger,
    fontSize: FONT_SIZES.xs,
    marginTop: 4,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  badge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },

  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },

  sectionAction: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
    paddingHorizontal: SPACING['2xl'],
  },

  emptyIcon: { fontSize: 52, marginBottom: SPACING.lg },

  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    textAlign: 'center',
  },

  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  infoLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },

  infoValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },

  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 60,
    paddingBottom: SPACING.lg,
  },

  screenHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backBtnText: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: '700',
  },

  screenTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '800',
  },

  screenSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
});