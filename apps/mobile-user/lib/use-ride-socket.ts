import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getApiBaseUrl } from './api';
import { loadAuthSession } from './auth-storage';
import type { Ride, Location } from '@uritech/shared';

const MAX_TRAIL_POINTS = 80;

export interface RideSocketState {
  connected: boolean;
  ride: Ride | null;
  driverLocation: Location | null;
  /** Histórico recente da trajetória do motorista (ordem cronológica) */
  driverTrail: Array<{ latitude: number; longitude: number }>;
  error: string | null;
}

function getWsBaseUrl(): string {
  const api = getApiBaseUrl();
  return api.replace(/\/api\/v1\/?$/, '');
}

function appendTrail(
  trail: Array<{ latitude: number; longitude: number }>,
  lat: number,
  lng: number,
): Array<{ latitude: number; longitude: number }> {
  const last = trail[trail.length - 1];
  if (last && Math.abs(last.latitude - lat) < 0.00005 && Math.abs(last.longitude - lng) < 0.00005) {
    return trail;
  }
  const next = [...trail, { latitude: lat, longitude: lng }];
  return next.length > MAX_TRAIL_POINTS ? next.slice(next.length - MAX_TRAIL_POINTS) : next;
}

export function useRideSocket(rideId: string | null) {
  const [state, setState] = useState<RideSocketState>({
    connected: false,
    ride: null,
    driverLocation: null,
    driverTrail: [],
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
      if (reason === 'io server disconnect') {
        socket.close();
        reconnectTimerRef.current = setTimeout(() => connect(), 3000);
      }
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
          address: `Motorista`,
        },
        driverTrail: appendTrail(s.driverTrail, payload.lat, payload.lng),
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
    setState({
      connected: false,
      ride: null,
      driverLocation: null,
      driverTrail: [],
      error: null,
    });
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
