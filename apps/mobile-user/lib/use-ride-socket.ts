import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getApiBaseUrl } from './api';
import { loadAuthSession } from './auth-storage';
import type { Ride, Location } from '@uritech/shared';

export interface RideSocketState {
  connected: boolean;
  ride: Ride | null;
  driverLocation: Location | null;
  error: string | null;
}

function getWsBaseUrl(): string {
  const api = getApiBaseUrl(); // e.g. http://host:4000/api/v1
  return api.replace(/\/api\/v1\/?$/, '');
}

export function useRideSocket(rideId: string | null) {
  const [state, setState] = useState<RideSocketState>({
    connected: false,
    ride: null,
    driverLocation: null,
    error: null,
  });
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(async () => {
    if (!rideId) return;
    if (socketRef.current?.connected) return;

    const session = await loadAuthSession();
    const token = session?.accessToken;
    if (!token) {
      setState((s) => ({ ...s, error: 'Sem sessão' }));
      return;
    }

    const base = getWsBaseUrl();
    const socket = io(`${base}/rides`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setState((s) => ({ ...s, connected: true, error: null }));
      socket.emit('subscribeRide', rideId);
    });

    socket.on('disconnect', (reason) => {
      setState((s) => ({ ...s, connected: false }));
      // Se o servidor forçou disconnect (ex: token inválido), não reconecta automaticamente
      if (reason === 'io server disconnect') {
        socket.close();
        // Tentar reconectar após 3s com novo token
        reconnectTimerRef.current = setTimeout(() => connect(), 3000);
      }
    });

    socket.on('subscribed', (payload: { rideId: string }) => {
      // console.log('Subscribed to ride', payload.rideId);
    });

    socket.on('rideUpdate', (payload: { rideId: string; ride: Ride; event: string }) => {
      setState((s) => ({ ...s, ride: payload.ride }));
    });

    socket.on('driverLocation', (payload: {
      rideId: string;
      lat: number;
      lng: number;
      driverId?: string;
      timestamp?: number;
    }) => {
      setState((s) => ({
        ...s,
        driverLocation: {
          latitude: payload.lat,
          longitude: payload.lng,
          address: `Motorista a ${payload.lat.toFixed(4)}, ${payload.lng.toFixed(4)}`,
        },
      }));
    });

    socket.on('error', (payload: { message: string }) => {
      setState((s) => ({ ...s, error: payload.message }));
    });

    socket.on('connect_error', (err: Error) => {
      setState((s) => ({ ...s, error: err.message, connected: false }));
    });
  }, [rideId]);

  const sendDriverLocation = useCallback((lat: number, lng: number) => {
    const socket = socketRef.current;
    if (!socket?.connected || !rideId) return;
    socket.emit('driverLocation', { rideId, lat, lng });
  }, [rideId]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.off();
      socketRef.current.close();
      socketRef.current = null;
    }
    setState({ connected: false, ride: null, driverLocation: null, error: null });
  }, []);

  useEffect(() => {
    if (rideId) {
      void connect();
    }
    return () => {
      disconnect();
    };
  }, [rideId, connect, disconnect]);

  return { ...state, sendDriverLocation, disconnect };
}
