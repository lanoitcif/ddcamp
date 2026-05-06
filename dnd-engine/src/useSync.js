import { useEffect, useState, useCallback, useRef } from 'react';

const SYNC_CHANNEL = 'dnd_engine_sync';
const MAX_RECONNECT_DELAY = 30000;

function getSyncParams() {
  const params = new URLSearchParams(window.location.search);
  const ws = params.get('ws');
  if (!ws) return { mode: 'local' };
  const room = params.get('room') || 'default';
  return { mode: 'remote', host: ws, room };
}

export function useSync(onMessage) {
  const config = getSyncParams();
  const mode = config.mode;
  const [isConnected, setIsConnected] = useState(mode === 'local');
  const [clientCount, setClientCount] = useState(null);

  const channelRef = useRef(null);
  const wsRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  const reconnectTimer = useRef(null);
  const reconnectDelay = useRef(1000);
  const unmountedRef = useRef(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    unmountedRef.current = false;
    const syncConfig = getSyncParams();

    if (syncConfig.mode === 'local') {
      const ch = new BroadcastChannel(SYNC_CHANNEL);
      channelRef.current = ch;

      ch.addEventListener('message', (e) => {
        onMessageRef.current?.(e.data);
      });

      return () => {
        unmountedRef.current = true;
        ch.close();
        channelRef.current = null;
        setIsConnected(false);
      };
    }

    // WebSocket mode
    function connect() {
      if (unmountedRef.current) return;

      const url = `ws://${syncConfig.host}?room=${encodeURIComponent(syncConfig.room)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.addEventListener('open', () => {
        setIsConnected(true);
        reconnectDelay.current = 1000;
      });

      ws.addEventListener('message', (e) => {
        let msg;
        try {
          msg = JSON.parse(e.data);
        } catch {
          return;
        }

        if (msg && typeof msg === 'object') {
          switch (msg.type) {
            case 'sync':
              onMessageRef.current?.(msg.payload);
              break;
            case 'welcome':
            case 'client_joined':
            case 'client_left':
              if (msg.clientCount != null) setClientCount(msg.clientCount);
              break;
          }
        }
      });

      ws.addEventListener('close', () => {
        setIsConnected(false);
        wsRef.current = null;
        scheduleReconnect();
      });

      ws.addEventListener('error', () => {
        ws.close();
      });
    }

    function scheduleReconnect() {
      if (unmountedRef.current) return;
      const delay = reconnectDelay.current;
      reconnectDelay.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
      reconnectTimer.current = setTimeout(connect, delay);
    }

    connect();

    return () => {
      unmountedRef.current = true;
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
    };
  }, []);

  const send = useCallback((data) => {
    if (mode === 'local') {
      channelRef.current?.postMessage(data);
    } else {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'state_update', payload: data }));
      }
    }
  }, [mode]);

  return { send, isConnected, mode, clientCount };
}
