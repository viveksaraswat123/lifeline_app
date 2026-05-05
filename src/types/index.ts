// ─── Enums ────────────────────────────────────────────────────────────────────

export type AlertType =
  | 'impact'
  | 'tilt'
  | 'freefall'
  | 'vibration'
  | 'combined'
  | 'manual';

export type AlertStatus = 'pending' | 'confirmed' | 'cancelled' | 'resolved';

export type BloodGroup =
  | 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

// ─── API Models ───────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  phone: string;
  full_name: string;
  blood_group?: BloodGroup;
  medical_notes?: string;
  profile_photo?: string;
  fcm_token?: string;
  is_active: boolean;
  created_at: string;
}

export interface Device {
  id: number;
  device_uid: string;
  name: string;
  firmware_version?: string;
  api_key: string;
  is_active: boolean;
  is_online: boolean;
  last_seen?: string;
  battery_level?: number;
  impact_threshold?: number;
  tilt_threshold?: number;
  created_at: string;
}

export interface Alert {
  id: number;
  user_id: number;
  device_id?: number;
  alert_type: AlertType;
  status: AlertStatus;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  speed_kmh?: number;
  heading_deg?: number;
  address?: string;
  impact_g?: number;
  tilt_deg?: number;
  vibration: boolean;
  temperature_c?: number;
  triggered_at: string;
  cancel_deadline?: string;
  confirmed_at?: string;
  cancelled_at?: string;
  resolved_at?: string;
  push_sent: boolean;
  sms_sent: boolean;
  contacts_notified: number;
  notes?: string;
}

export interface AlertListResponse {
  items: Alert[];
  total: number;
  page: number;
  size: number;
}

export interface LocationPoint {
  id: number;
  device_id: number;
  latitude: number;
  longitude: number;
  altitude?: number;
  speed_kmh?: number;
  heading_deg?: number;
  accuracy_m?: number;
  satellites?: number;
  recorded_at: string;
}

export interface EmergencyContact {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  relationship?: string;
  priority: number;
  notify_sms: boolean;
  notify_email: boolean;
  is_active?: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ─── WebSocket Messages ───────────────────────────────────────────────────────

export interface WSMessage {
  type:
    | 'alert_new'
    | 'alert_update'
    | 'location'
    | 'device_status'
    | 'pong';
  data: any;
}

export interface WSAlertNewData {
  alert_id: number;
  alert_type: AlertType;
  status: AlertStatus;
  latitude?: number;
  longitude?: number;
  impact_g?: number;
  tilt_deg?: number;
  speed_kmh?: number;
  cancel_deadline: string;
  triggered_at: string;
}

export interface WSLocationData {
  device_id: number;
  latitude: number;
  longitude: number;
  speed_kmh?: number;
  heading_deg?: number;
  battery_level?: number;
  satellites?: number;
  timestamp: string;
}

export interface WSDeviceStatusData {
  device_id: number;
  is_online: boolean;
  battery_level?: number;
  last_seen: string;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  MapTab: undefined;
  AlertsTab: undefined;
  DevicesTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  AlertDetail: { alertId: number };
};

export type DevicesStackParamList = {
  DeviceList: undefined;
  DeviceDetail: { deviceId: number };
  AddDevice: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  EmergencyContacts: undefined;
};

// ─── Redux State ─────────────────────────────────────────────────────────────

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AlertState {
  activeAlert: WSAlertNewData | null;
  alerts: Alert[];
  totalAlerts: number;
  isLoading: boolean;
  countdown: number;
}

export interface DeviceState {
  devices: Device[];
  isLoading: boolean;
  liveLocation: WSLocationData | null;
  locationHistory: LocationPoint[];
}