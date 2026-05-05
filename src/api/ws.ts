import AsyncStorage from '@react-native-async-storage/async-storage';
import { WS_BASE_URL } from '../constants';
import type { WSMessage } from '../types';

type Listener = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private userId: number | null = null;
  private token: string | null = null;           // cache token so reconnects are instant
  private listeners: Map<string, Set<Listener>> = new Map();
  private shouldRun = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectDelay = 2000;
  private _isConnected = false;

  // ── Public ───────────────────────────────────────────────────────────────────

  on(event: string, fn: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
  }

  off(event: string, fn: Listener) {
    this.listeners.get(event)?.delete(fn);
  }

  async start(userId: number) {
    // If already running for this user, do nothing
    if (this.shouldRun && this.userId === userId) return;

    this.userId        = userId;
    this.shouldRun     = true;
    this.reconnectDelay= 2000;

    // Pre-load token so first connect is instant
    this.token = await AsyncStorage.getItem('access_token');
    await this._connect();
  }

  stop() {
    this.shouldRun = false;
    this.token     = null;
    this._clearTimers();
    if (this.ws) {
      this.ws.onclose = null; // prevent auto-reconnect on explicit stop
      this.ws.close();
      this.ws = null;
    }
    this._isConnected = false;
    this._emit('connection_change', { connected: false });
  }

  get isConnected() { return this._isConnected; }

  // ── Internal ─────────────────────────────────────────────────────────────────

  private async _connect() {
    if (!this.shouldRun || !this.userId) return;

    // Refresh token on each connect attempt (could have changed)
    const token = this.token ?? await AsyncStorage.getItem('access_token');
    if (!token) {
      console.log('[WS] No token — will retry in 3s');
      this.reconnectTimer = setTimeout(() => this._connect(), 3000);
      return;
    }
    this.token = token;

    // Build URL:  ws://IP:8000/api/v1/alerts/ws/{userId}?token=...
    const url = `${WS_BASE_URL}/alerts/ws/${this.userId}?token=${token}`;
    console.log('[WS] Connecting to', url.replace(token, token.slice(0, 20) + '…'));

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[WS] Connected ✓');
        this._isConnected = true;
        this.reconnectDelay = 2000;
        this._emit('connection_change', { connected: true });
        this._startPing();
      };

      this.ws.onmessage = ({ data }) => {
        try {
          const msg: WSMessage = JSON.parse(data);
          if (msg.type === 'pong') return; // ignore pong
          console.log('[WS] ←', msg.type);
          this._emit(msg.type, msg.data);
          this._emit('*', msg);
        } catch (e) {
          console.warn('[WS] Bad message:', data);
        }
      };

      this.ws.onerror = (e) => {
        // onerror always fires before onclose — log and let onclose handle retry
        console.warn('[WS] Error (reconnect will follow)');
      };

      this.ws.onclose = (e) => {
        console.log(`[WS] Disconnected — code=${e.code} reason=${e.reason || 'none'}`);
        this._isConnected = false;
        this._clearTimers();
        this._emit('connection_change', { connected: false });

        if (e.code === 4001) {
          // Server rejected the token — don't keep retrying
          console.error('[WS] Token rejected (4001) — not reconnecting');
          return;
        }
        if (this.shouldRun) {
          this._scheduleReconnect();
        }
      };
    } catch (e) {
      console.warn('[WS] Connection error:', e);
      if (this.shouldRun) this._scheduleReconnect();
    }
  }

  private _scheduleReconnect() {
    const delay = this.reconnectDelay;
    console.log(`[WS] Reconnecting in ${delay}ms…`);
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
      await this._connect();
    }, delay);
  }

  private _startPing() {
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 25000);
  }

  private _clearTimers() {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer);  this.reconnectTimer = null; }
    if (this.pingTimer)      { clearInterval(this.pingTimer);       this.pingTimer = null; }
  }

  private _emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(fn => {
      try { fn(data); } catch (e) { console.warn('[WS] Listener error:', e); }
    });
  }
}

export const wsService = new WebSocketService();