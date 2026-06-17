import { useEffect, useRef, useState, useCallback } from 'react';
import { tokenStorage } from '../utils/tokenStorage';
import type { ChatMessage } from '../api/types';

export interface UseWebSocketOptions {
  roomId: number | null;
  onMessage: (message: ChatMessage) => void;
}

const isChatMessage = (value: unknown): value is ChatMessage => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ChatMessage>;
  return (
    typeof candidate.message_id === 'number' &&
    typeof candidate.message === 'string' &&
    typeof candidate.is_read === 'boolean' &&
    typeof candidate.sender_id === 'number' &&
    typeof candidate.timestamp === 'string'
  );
};

// ✅ Token refresh karne ki utility — WS connect se pehle call hoti hai
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const res = await fetch(`${apiBase}/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.access) {
      tokenStorage.setAccessToken(data.access);
      return data.access;
    }
    return null;
  } catch {
    return null;
  }
};

export const useWebSocket = ({ roomId, onMessage }: UseWebSocketOptions) => {
  const [status, setStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const retryCountRef = useRef<number>(0);
  const manualCloseRef = useRef<boolean>(false);

  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!roomId) {
      setStatus('DISCONNECTED');
      return;
    }

    manualCloseRef.current = false;
    retryCountRef.current = 0;

    const baseUrl =
      import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000/chatApplication/ws/chat';

    // ✅ Async function — connect se pehle fresh token ensure karta hai
    const createSocket = async () => {
      if (manualCloseRef.current) return;

      // Step 1: Pehle refresh karo
      let freshToken = await refreshAccessToken();

      // Step 2: Agar refresh fail hua toh storage wala try karo
      if (!freshToken) {
        freshToken = tokenStorage.getAccessToken();
      }

      // Step 3: Koi token nahi toh disconnect
      if (!freshToken) {
        setStatus('DISCONNECTED');
        return;
      }

      const wsUrl = `${baseUrl}/${roomId}/?token=${encodeURIComponent(freshToken)}`;

      setStatus('CONNECTING');

      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setStatus('CONNECTED');
        retryCountRef.current = 0;

        if (heartbeatIntervalRef.current) {
          window.clearInterval(heartbeatIntervalRef.current);
        }
        heartbeatIntervalRef.current = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send('ping');
          }
        }, 30000);
      };

      socket.onmessage = (event) => {
        if (event.data === 'pong' || event.data === 'ping') return;
        try {
          const parsed: unknown = JSON.parse(event.data);
          if (isChatMessage(parsed)) {
            onMessageRef.current(parsed);
          }
        } catch {
          console.warn('Ignoring malformed WebSocket message:', event.data);
        }
      };

      socket.onclose = (event) => {
        setStatus('DISCONNECTED');

        if (heartbeatIntervalRef.current) {
          window.clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        if (manualCloseRef.current) return;
        if (event.code === 4003) return;

        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
        retryCountRef.current += 1;

        if (reconnectTimeoutRef.current) {
          window.clearTimeout(reconnectTimeoutRef.current);
        }
        // ✅ Reconnect pe bhi fresh token milega (async createSocket)
        reconnectTimeoutRef.current = window.setTimeout(() => {
          createSocket();
        }, delay);
      };

      socket.onerror = (error) => {
        console.error('WebSocket connection error:', error);
      };
    };

    createSocket();

    return () => {
      manualCloseRef.current = true;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (heartbeatIntervalRef.current) {
        window.clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      setStatus('DISCONNECTED');
    };
  }, [roomId]);

  const disconnect = useCallback(() => {
    manualCloseRef.current = true;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      window.clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    setStatus('DISCONNECTED');
  }, []);

  useEffect(() => {
    window.addEventListener('chat-ws-disconnect', disconnect);
    window.addEventListener('auth-logout', disconnect);
    return () => {
      window.removeEventListener('chat-ws-disconnect', disconnect);
      window.removeEventListener('auth-logout', disconnect);
    };
  }, [disconnect]);

  const sendMessage = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(text);
      return true;
    }
    console.error('WebSocket is not ready to send messages.');
    return false;
  }, []);

  return {
    status,
    sendMessage,
    reconnect: disconnect,
  };
};