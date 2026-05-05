import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, TouchableOpacity, Alert, StatusBar,
} from 'react-native';
import { useAppDispatch } from '../../hooks';
import { login, register } from '../../store/slices/authSlice';
import { Button, Input } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, RADIUS, BLOOD_GROUPS } from '../../constants';

// ─── Login ────────────────────────────────────────────────────────────────────

export function LoginScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) return Alert.alert('Error', 'Enter email and password');
    setLoading(true);
    try {
      await dispatch(login({ email: email.trim().toLowerCase(), password })).unwrap();
    } catch (e: any) {
      Alert.alert('Login Failed', e.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.heroLogo}>🛡️</Text>
          <Text style={styles.heroTitle}>LIFELINE</Text>
          <Text style={styles.heroSub}>IoT Accident Alert System</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Sign In</Text>
          <Input label="Email Address" value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
          <Input label="Password" value={password} onChangeText={setPassword}
            secureTextEntry placeholder="••••••••" />
          <Button label="Sign In" onPress={submit} loading={loading} style={{ marginTop: SPACING.sm }} />
          <TouchableOpacity style={styles.switchLink} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.switchText}>
              New to Lifeline? <Text style={styles.switchBold}>Create account →</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Register ─────────────────────────────────────────────────────────────────

export function RegisterScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '',
    blood_group: '', medical_notes: '',
  });
  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.full_name || !form.email || !form.phone || !form.password)
      return Alert.alert('Error', 'Please fill all required fields');
    if (form.password.length < 8)
      return Alert.alert('Error', 'Password must be at least 8 characters');

    setLoading(true);
    try {
      await dispatch(register({
        ...form,
        email: form.email.trim().toLowerCase(),
        blood_group: form.blood_group || undefined,
        medical_notes: form.medical_notes || undefined,
      })).unwrap();
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingTop: 60, paddingBottom: 16 }}>
          <Text style={{ color: COLORS.primary, fontSize: FONT_SIZES.md, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.regTitle}>Create Account</Text>
        <Text style={styles.regSub}>Your emergency profile — visible to responders</Text>

        <Input label="Full Name *"   value={form.full_name} onChangeText={set('full_name')} placeholder="Vivek Saraswat" autoCapitalize="words" />
        <Input label="Email *"       value={form.email}     onChangeText={set('email')}     placeholder="vivek@gmail.com" keyboardType="email-address" autoCapitalize="none" />
        <Input label="Phone *"       value={form.phone}     onChangeText={set('phone')}     placeholder="+91 9876543210" keyboardType="phone-pad" />
        <Input label="Password *"    value={form.password}  onChangeText={set('password')}  placeholder="Min 8 characters" secureTextEntry />

        {/* Blood group chips */}
        <Text style={styles.fieldLabel}>Blood Group</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.lg }}>
          {BLOOD_GROUPS.map(bg => (
            <TouchableOpacity
              key={bg}
              style={[styles.chip, form.blood_group === bg && styles.chipActive]}
              onPress={() => set('blood_group')(form.blood_group === bg ? '' : bg)}
            >
              <Text style={[styles.chipText, form.blood_group === bg && styles.chipTextActive]}>{bg}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Input label="Medical Notes (optional)" value={form.medical_notes} onChangeText={set('medical_notes')}
          placeholder="Allergies, medications, chronic conditions…" multiline />

        <Button label="Create Account" onPress={submit} loading={loading} />
        <TouchableOpacity style={styles.switchLink} onPress={() => navigation.goBack()}>
          <Text style={styles.switchText}>Already registered? <Text style={styles.switchBold}>Sign in →</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  inner: { flexGrow: 1, paddingHorizontal: SPACING.xl, paddingBottom: SPACING['4xl'] },

  hero: { alignItems: 'center', paddingTop: 80, paddingBottom: 48 },
  heroLogo:  { fontSize: 72, marginBottom: 8 },
  heroTitle: { color: COLORS.primary, fontSize: 42, fontWeight: '900', letterSpacing: 8 },
  heroSub:   { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, letterSpacing: 1, marginTop: 6 },

  form: {},
  formTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES['2xl'], fontWeight: '800', marginBottom: SPACING.xl },
  switchLink: { marginTop: SPACING.xl, alignItems: 'center' },
  switchText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
  switchBold: { color: COLORS.primary, fontWeight: '700' },

  regTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES['2xl'], fontWeight: '800', marginBottom: 4 },
  regSub:   { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, marginBottom: SPACING.xl },

  fieldLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZES.xs, fontWeight: '600', letterSpacing: 0.5, marginBottom: SPACING.sm, textTransform: 'uppercase' },
  chip: {
    backgroundColor: COLORS.surface2, borderRadius: RADIUS.sm, paddingHorizontal: 14,
    paddingVertical: 8, marginRight: SPACING.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  chipActive:     { backgroundColor: COLORS.primaryDim, borderColor: COLORS.primary },
  chipText:       { color: COLORS.textSecondary, fontWeight: '600', fontSize: FONT_SIZES.sm },
  chipTextActive: { color: COLORS.primary },
});