import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Modal, Alert, RefreshControl, StatusBar, FlatList,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { logout, updateProfile } from '../../store/slices/authSlice';
import { contactsApi } from '../../api/client';
import { COLORS, SPACING, FONT_SIZES, RADIUS, BLOOD_GROUPS, RELATIONSHIPS } from '../../constants';
import { Button, Input, Card, ScreenHeader, InfoRow, EmptyState } from '../../components/common';
import type { EmergencyContact } from '../../types';

// ─── Profile Screen ───────────────────────────────────────────────────────────

export function ProfileScreen({ navigation }: any) {
  const dispatch  = useAppDispatch();
  const user      = useAppSelector(s => s.auth.user);
  const [editing, setEditing]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [form, setForm] = useState({
    full_name:     user?.full_name     ?? '',
    phone:         user?.phone         ?? '',
    blood_group:   (user?.blood_group as string)   ?? '',
    medical_notes: user?.medical_notes ?? '',
  });
  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await dispatch(updateProfile({
        full_name:     form.full_name,
        phone:         form.phone,
        blood_group:   (form.blood_group as any)   || undefined,
        medical_notes: form.medical_notes || undefined,
      })).unwrap();
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () =>
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);

  const initial = user?.full_name?.charAt(0).toUpperCase() ?? '?';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScreenHeader
        title="Profile"
        right={
          <TouchableOpacity onPress={editing ? save : () => setEditing(true)} disabled={saving}>
            <Text style={styles.editBtn}>{editing ? (saving ? 'Saving…' : '✓ Save') : 'Edit'}</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.avatarName}>{user?.full_name}</Text>
          <Text style={styles.avatarEmail}>{user?.email}</Text>
          {user?.blood_group && (
            <View style={styles.bloodBadge}>
              <Text style={styles.bloodBadgeText}>🩸 {user.blood_group}</Text>
            </View>
          )}
        </View>

        {/* Quick links */}
        <View style={styles.menuSection}>
          {[
            { icon: '👥', label: 'Emergency Contacts', onPress: () => navigation.navigate('EmergencyContacts') },
            { icon: '📡', label: 'My Devices',          onPress: () => navigation.navigate('DevicesTab') },
          ].map(item => (
            <TouchableOpacity key={item.label} style={styles.menuItem} onPress={item.onPress}>
              <Text style={styles.menuItemIcon}>{item.icon}</Text>
              <Text style={styles.menuItemLabel}>{item.label}</Text>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Editable profile info */}
        <Card style={{ marginBottom: SPACING.md }}>
          <Text style={styles.cardTitle}>Personal Info</Text>
          {editing ? (
            <>
              <Input label="Full Name" value={form.full_name} onChangeText={set('full_name')} />
              <Input label="Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
            </>
          ) : (
            <>
              <InfoRow label="Full Name" value={user?.full_name ?? '—'} />
              <InfoRow label="Phone"     value={user?.phone     ?? '—'} />
              <InfoRow label="Email"     value={user?.email     ?? '—'} />
            </>
          )}
        </Card>

        <Card style={{ marginBottom: SPACING.md }}>
          <Text style={styles.cardTitle}>Medical Info</Text>
          {editing ? (
            <>
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
              <Input label="Medical Notes" value={form.medical_notes} onChangeText={set('medical_notes')}
                multiline placeholder="Allergies, medications, conditions…" />
            </>
          ) : (
            <>
              <InfoRow label="Blood Group" value={user?.blood_group ?? '—'} />
              <InfoRow label="Medical Notes" value={user?.medical_notes ?? 'None'} />
            </>
          )}
        </Card>

        {/* Danger zone */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Lifeline v2.0 • IoT Accident Alert System</Text>
      </ScrollView>
    </View>
  );
}

// ─── Emergency Contacts Screen ────────────────────────────────────────────────

export function EmergencyContactsScreen({ navigation }: any) {
  const [contacts,  setContacts]  = useState<EmergencyContact[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<EmergencyContact | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<EmergencyContact, 'id' | 'is_active'>>({
    name: '', phone: '', email: '', relationship: '',
    priority: 1, notify_sms: true, notify_email: false,
  });
  const setF = (k: string) => (v: any) => setForm(p => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try { setContacts(await contactsApi.list()); }
    catch {}
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ name: '', phone: '', email: '', relationship: '', priority: 1, notify_sms: true, notify_email: false });
    setShowModal(true);
  };

  const openEdit = (c: EmergencyContact) => {
    setEditTarget(c);
    setForm({ name: c.name, phone: c.phone, email: c.email ?? '', relationship: c.relationship ?? '',
              priority: c.priority, notify_sms: c.notify_sms, notify_email: c.notify_email });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name || !form.phone) return Alert.alert('Error', 'Name and phone are required');
    setSaving(true);
    try {
      if (editTarget?.id) await contactsApi.update(editTarget.id, form);
      else                await contactsApi.create(form);
      setShowModal(false);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = (c: EmergencyContact) =>
    Alert.alert('Delete', `Remove ${c.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await contactsApi.delete(c.id!); load();
      }},
    ]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScreenHeader
        title="Emergency Contacts"
        subtitle="Notified by SMS during alerts"
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity style={styles.editBtn2} onPress={openAdd}>
            <Text style={styles.editBtnText2}>+ Add</Text>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={[...contacts].sort((a, b) => a.priority - b.priority)}
        keyExtractor={c => String(c.id)}
        contentContainerStyle={styles.contactList}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <EmptyState icon="👥" title="No emergency contacts"
            subtitle="Add contacts who will be notified when an accident is detected"
            action="+ Add Contact" onAction={openAdd} />
        }
        renderItem={({ item: c }) => (
          <Card style={styles.contactCard}>
            <View style={styles.contactCardRow}>
              <View style={[styles.priorityCircle, c.priority === 1 && styles.priorityCircle1]}>
                <Text style={[styles.priorityText, c.priority === 1 && { color: COLORS.primary }]}>
                  #{c.priority}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactName}>{c.name}</Text>
                <Text style={styles.contactPhone}>{c.phone}</Text>
                {c.relationship && <Text style={styles.contactRel}>{c.relationship}</Text>}
                <View style={styles.notifyPills}>
                  {c.notify_sms   && <View style={styles.notifyPill}><Text style={styles.notifyPillText}>💬 SMS</Text></View>}
                  {c.notify_email && <View style={styles.notifyPill}><Text style={styles.notifyPillText}>📧 Email</Text></View>}
                </View>
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity onPress={() => openEdit(c)} style={styles.editIconBtn}>
                  <Text style={styles.editIconBtnText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => remove(c)}>
                  <Text style={{ fontSize: 18 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}
      />

      {/* Add / Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>{editTarget ? 'Edit Contact' : 'Add Emergency Contact'}</Text>

              <Input label="Name *"  value={form.name}  onChangeText={setF('name')} placeholder="Vivek Saraswat" />
              <Input label="Phone *" value={form.phone} onChangeText={setF('phone')} placeholder="+91 9876543210" keyboardType="phone-pad" />
              <Input label="Email"   value={form.email ?? ''} onChangeText={setF('email')} placeholder="optional" keyboardType="email-address" autoCapitalize="none" />

              <Text style={styles.fieldLabel}>Relationship</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.lg }}>
                {RELATIONSHIPS.map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.chip, form.relationship === r && styles.chipActive]}
                    onPress={() => setF('relationship')(form.relationship === r ? '' : r)}
                  >
                    <Text style={[styles.chipText, form.relationship === r && styles.chipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Priority (1 = first notified)</Text>
              <View style={styles.priorityRow}>
                {[1, 2, 3, 4, 5].map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.priorityBtn, form.priority === p && styles.priorityBtnActive]}
                    onPress={() => setF('priority')(p)}
                  >
                    <Text style={[styles.priorityBtnText, form.priority === p && styles.priorityBtnTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Notify via</Text>
              {[
                { key: 'notify_sms',   label: '💬 SMS (recommended)' },
                { key: 'notify_email', label: '📧 Email' },
              ].map(opt => (
                <View key={opt.key} style={styles.switchRow}>
                  <Text style={styles.switchLabel}>{opt.label}</Text>
                  <Switch
                    value={!!form[opt.key as keyof typeof form]}
                    onValueChange={v => setF(opt.key)(v)}
                    trackColor={{ false: COLORS.border2, true: COLORS.primary }}
                    thumbColor="#fff"
                  />
                </View>
              ))}

              <View style={[styles.modalBtns, { marginTop: SPACING.xl }]}>
                <Button label="Cancel" variant="ghost" onPress={() => setShowModal(false)} style={{ flex: 1 }} />
                <Button label={editTarget ? 'Update' : 'Add Contact'} onPress={save} loading={saving} style={{ flex: 1 }} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll:    { paddingHorizontal: SPACING.xl, paddingBottom: 60 },

  editBtn:  { color: COLORS.primary, fontSize: FONT_SIZES.md, fontWeight: '700' },

  avatarSection: { alignItems: 'center', paddingVertical: SPACING['3xl'] },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.primaryDim, borderWidth: 2, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg,
  },
  avatarText:  { color: COLORS.primary, fontSize: 44, fontWeight: '900' },
  avatarName:  { color: COLORS.textPrimary, fontSize: FONT_SIZES.xl, fontWeight: '800' },
  avatarEmail: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, marginTop: 4 },
  bloodBadge:  {
    marginTop: SPACING.md, backgroundColor: 'rgba(255,59,92,0.1)',
    borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,59,92,0.3)',
  },
  bloodBadgeText: { color: COLORS.primary, fontWeight: '700', fontSize: FONT_SIZES.sm },

  menuSection: { marginBottom: SPACING.xl, gap: SPACING.sm },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg, padding: SPACING.lg, gap: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  menuItemIcon:  { fontSize: 22 },
  menuItemLabel: { color: COLORS.textPrimary, fontSize: FONT_SIZES.md, fontWeight: '600', flex: 1 },
  menuItemArrow: { color: COLORS.textMuted, fontSize: 22 },

  cardTitle:  { color: COLORS.textPrimary, fontSize: FONT_SIZES.md, fontWeight: '700', marginBottom: SPACING.md },
  fieldLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZES.xs, fontWeight: '600', letterSpacing: 0.5, marginBottom: SPACING.sm, textTransform: 'uppercase' },

  chip: {
    backgroundColor: COLORS.surface2, borderRadius: RADIUS.sm,
    paddingHorizontal: 14, paddingVertical: 8, marginRight: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  chipActive:     { backgroundColor: COLORS.primaryDim, borderColor: COLORS.primary },
  chipText:       { color: COLORS.textSecondary, fontWeight: '600', fontSize: FONT_SIZES.sm },
  chipTextActive: { color: COLORS.primary },

  logoutBtn: {
    marginTop: SPACING.xl, marginBottom: SPACING.md,
    borderWidth: 1.5, borderColor: 'rgba(255,59,92,0.3)',
    backgroundColor: 'rgba(255,59,92,0.06)',
    borderRadius: RADIUS.lg, paddingVertical: 16, alignItems: 'center',
  },
  logoutBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: FONT_SIZES.md },
  version: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, textAlign: 'center', marginBottom: SPACING.xl },

  // Contacts
  contactList: { padding: SPACING.xl, gap: SPACING.sm, paddingBottom: 40 },
  contactCard: {},
  contactCardRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  priorityCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.surface2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  priorityCircle1: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
  priorityText:    { color: COLORS.textMuted, fontWeight: '700', fontSize: FONT_SIZES.sm },
  contactName:  { color: COLORS.textPrimary, fontSize: FONT_SIZES.md, fontWeight: '700' },
  contactPhone: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
  contactRel:   { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: 2 },
  notifyPills:  { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.xs },
  notifyPill:   { backgroundColor: COLORS.surface2, borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 3 },
  notifyPillText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.xs },
  contactActions: { gap: SPACING.sm, alignItems: 'center' },
  editIconBtn:    { backgroundColor: COLORS.surface2, borderRadius: RADIUS.sm, padding: 6 },
  editIconBtnText:{ fontSize: 16 },

  editBtn2:     { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal: 14, paddingVertical: 7 },
  editBtnText2: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.sm },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'], padding: SPACING['2xl'],
    paddingBottom: 48, borderTopWidth: 1, borderColor: COLORS.border,
  },
  modalTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.xl, fontWeight: '800', marginBottom: SPACING.xl },
  modalBtns:  { flexDirection: 'row', gap: SPACING.md },

  priorityRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  priorityBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.surface2,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  priorityBtnActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  priorityBtnText:       { color: COLORS.textSecondary, fontWeight: '700' },
  priorityBtnTextActive: { color: '#fff' },

  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  switchLabel: { color: COLORS.textPrimary, fontSize: FONT_SIZES.md },
});