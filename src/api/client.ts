import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants';
import type {
  TokenResponse, User, Device, Alert, AlertListResponse,
  LocationPoint, EmergencyContact,
} from '../types';

// ─── Axios instance ───────────────────────────────────────────────────────────

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from AsyncStorage to every request
client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalise error messages
client.interceptors.response.use(
  r => r,
  (err: AxiosError<{ detail: string }>) => {
    const msg = err.response?.data?.detail ?? err.message ?? 'Network error';
    console.log('API ERROR:', msg, err.response?.data);
    return Promise.reject(new Error(String(msg)));
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: {
    email: string; phone: string; full_name: string;
    password: string; blood_group?: string; medical_notes?: string;
  }) => client.post<TokenResponse>('/auth/register', data).then(r => r.data),

  login: (email: string, password: string) =>
    client.post<TokenResponse>('/auth/login', { email, password }).then(r => r.data),

  // FIX: accept optional token parameter for cold-boot case.
  // On app start, AsyncStorage read in the interceptor may race with this call.
  // Passing the token directly guarantees it's attached to THIS request.
  me: (explicitToken?: string) => {
    const cfg = explicitToken
      ? { headers: { Authorization: `Bearer ${explicitToken}` } }
      : {};
    return client.get<User>('/auth/me', cfg).then(r => r.data);
  },

  logout: () => client.post('/auth/logout').then(r => r.data),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const userApi = {
  getProfile: () => client.get<User>('/users/me').then(r => r.data),

  updateProfile: (data: Partial<User> & { fcm_token?: string }) =>
    client.patch<User>('/users/me', data).then(r => r.data),
};

// ─── Devices ──────────────────────────────────────────────────────────────────

export const deviceApi = {
  register: (device_uid: string, name: string, firmware_version?: string) =>
    client.post<Device>('/devices/register', { device_uid, name, firmware_version }).then(r => r.data),

  list: () => client.get<Device[]>('/devices/').then(r => r.data),

  get: (id: number) => client.get<Device>(`/devices/${id}`).then(r => r.data),

  update: (id: number, data: { name?: string; impact_threshold?: number; tilt_threshold?: number }) =>
    client.patch<Device>(`/devices/${id}`, data).then(r => r.data),

  regenerateKey: (id: number) =>
    client.post<Device>(`/devices/${id}/regenerate-key`).then(r => r.data),
};

// ─── Alerts ───────────────────────────────────────────────────────────────────

export const alertApi = {
  list: (page = 1, size = 20, status?: string) =>
    client.get<AlertListResponse>('/alerts/', {
      params: { page, size, ...(status ? { status } : {}) },
    }).then(r => r.data),

  get: (id: number) => client.get<Alert>(`/alerts/${id}`).then(r => r.data),

  action: (id: number, action: 'cancel' | 'confirm' | 'resolve', notes?: string) =>
    client.post<Alert>(`/alerts/${id}/action`, { action, notes }).then(r => r.data),
};

// ─── Location ─────────────────────────────────────────────────────────────────

export const locationApi = {
  latest: (deviceId: number) =>
    client.get<LocationPoint>(`/location/latest/${deviceId}`).then(r => r.data),

  history: (deviceId: number, limit = 200) =>
    client.get<LocationPoint[]>(`/location/history/${deviceId}`, { params: { limit } }).then(r => r.data),
};

// ─── Emergency Contacts ───────────────────────────────────────────────────────

export const contactsApi = {
  list: () => client.get<EmergencyContact[]>('/emergency-contacts/').then(r => r.data),

  create: (data: Omit<EmergencyContact, 'id' | 'is_active'>) =>
    client.post<EmergencyContact>('/emergency-contacts/', data).then(r => r.data),

  update: (id: number, data: Omit<EmergencyContact, 'id' | 'is_active'>) =>
    client.put<EmergencyContact>(`/emergency-contacts/${id}`, data).then(r => r.data),

  delete: (id: number) => client.delete(`/emergency-contacts/${id}`),
};

export default client;