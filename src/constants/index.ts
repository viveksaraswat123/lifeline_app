// ─── Server Config (Hybrid: ENV + Fallback) ───────────────────────────────────

// 🔥 Change this only if your WiFi IP changes
const SERVER_IP = '192.168.1.39';
const SERVER_PORT = '8000';

// Use ENV if available, else fallback to local IP
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  `http://${SERVER_IP}:${SERVER_PORT}/api/v1`;

export const WS_BASE_URL =
  process.env.EXPO_PUBLIC_WS_BASE_URL ||
  `ws://${SERVER_IP}:${SERVER_PORT}/api/v1`;

// Debug logs (VERY IMPORTANT during development)
console.log('🌐 API_BASE_URL:', API_BASE_URL);
console.log('🔌 WS_BASE_URL:', WS_BASE_URL);


// ─── Colors ───────────────────────────────────────────────────────────────────
export const COLORS = {
  bg: '#0A0A0F',
  bg2: '#111118',
  surface: '#16161F',
  surface2: '#1C1C28',
  border: '#242435',
  border2: '#2E2E42',

  primary: '#FF3B5C',
  primaryDim: 'rgba(255,59,92,0.15)',
  accent: '#00E5FF',
  accentDim: 'rgba(0,229,255,0.12)',

  success: '#00E676',
  successDim: 'rgba(0,230,118,0.12)',
  warning: '#FFB300',
  warningDim: 'rgba(255,179,0,0.12)',
  danger: '#FF3B5C',
  dangerDim: 'rgba(255,59,92,0.12)',
  info: '#448AFF',
  infoDim: 'rgba(68,138,255,0.12)',

  textPrimary: '#F0F0FF',
  textSecondary: '#8888AA',
  textMuted: '#44445A',
  textInverse: '#0A0A0F',

  statusPending: '#FFB300',
  statusConfirmed: '#FF3B5C',
  statusCancelled: '#00E676',
  statusResolved: '#448AFF',

  overlay: 'rgba(10,10,15,0.95)',
  overlayMid: 'rgba(10,10,15,0.75)',
} as const;


// ─── Typography ───────────────────────────────────────────────────────────────
export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
} as const;

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 38,
} as const;


// ─── Spacing ─────────────────────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
} as const;


// ─── Border Radius ────────────────────────────────────────────────────────────
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;


// ─── Alert Metadata ───────────────────────────────────────────────────────────
export const ALERT_META = {
  impact: {
    label: 'High Impact',
    icon: '💥',
    color: '#FF3B5C',
  },
  tilt: {
    label: 'Vehicle Tilt',
    icon: '🔄',
    color: '#FF6B35',
  },
  freefall: {
    label: 'Freefall',
    icon: '⬇️',
    color: '#FF3B5C',
  },
  vibration: {
    label: 'Vibration',
    icon: '📳',
    color: '#FFB300',
  },
  combined: {
    label: 'Accident Detected',
    icon: '🚨',
    color: '#FF3B5C',
  },
  manual: {
    label: 'SOS Activated',
    icon: '🆘',
    color: '#FF3B5C',
  },
} as const;


// ─── Status Metadata ──────────────────────────────────────────────────────────
export const STATUS_META = {
  pending: {
    label: 'PENDING',
    color: '#FFB300',
    bg: 'rgba(255,179,0,0.12)',
  },
  confirmed: {
    label: 'CONFIRMED',
    color: '#FF3B5C',
    bg: 'rgba(255,59,92,0.12)',
  },
  cancelled: {
    label: 'CANCELLED',
    color: '#00E676',
    bg: 'rgba(0,230,118,0.12)',
  },
  resolved: {
    label: 'RESOLVED',
    color: '#448AFF',
    bg: 'rgba(68,138,255,0.12)',
  },
} as const;


// ─── Static Lists ─────────────────────────────────────────────────────────────
export const BLOOD_GROUPS = [
  'A+','A-','B+','B-','O+','O-','AB+','AB-'
] as const;

export const RELATIONSHIPS = [
  'Father',
  'Mother',
  'Spouse',
  'Sibling',
  'Child',
  'Friend',
  'Doctor',
  'Other',
] as const;