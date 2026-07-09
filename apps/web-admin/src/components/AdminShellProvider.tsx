'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import {
  DEFAULT_NOTIFICATIONS,
  DEFAULT_PROFILE,
  loadNotifications,
  loadProfile,
  saveNotifications,
  saveProfile,
  type AdminNotification,
  type AdminProfile,
} from '@/lib/admin-session';

interface AdminShellState {
  profile: AdminProfile;
  notifications: AdminNotification[];
  toast: string | null;
}

let state: AdminShellState = {
  profile: DEFAULT_PROFILE,
  notifications: DEFAULT_NOTIFICATIONS,
  toast: null,
};

let hydrated = false;
const listeners = new Set<() => void>();
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  state = {
    ...state,
    profile: loadProfile(),
    notifications: loadNotifications(),
  };
  emit();
}

function setState(partial: Partial<AdminShellState>) {
  state = { ...state, ...partial };
  emit();
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function useAdminShell() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    profile: snap.profile,
    notifications: snap.notifications,
    toast: snap.toast,
    unreadCount: snap.notifications.filter((n) => !n.read).length,
    updateProfile: (data: Partial<AdminProfile>) => {
      const next = { ...snap.profile, ...data };
      saveProfile(next);
      setState({ profile: next });
    },
    markRead: (id: string) => {
      const next = snap.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveNotifications(next);
      setState({ notifications: next });
    },
    markAllRead: () => {
      const next = snap.notifications.map((n) => ({ ...n, read: true }));
      saveNotifications(next);
      setState({ notifications: next });
    },
    addNotification: (item: Omit<AdminNotification, 'id' | 'read' | 'time'> & { time?: string }) => {
      const nextItem: AdminNotification = {
        ...item,
        id: String(Date.now()),
        read: false,
        time: item.time ?? 'agora',
      };
      const next = [nextItem, ...snap.notifications];
      saveNotifications(next);
      setState({ notifications: next });
    },
    showToast: (message: string) => {
      if (toastTimer) clearTimeout(toastTimer);
      setState({ toast: message });
      toastTimer = setTimeout(() => setState({ toast: null }), 3200);
    },
  };
}

export function AdminShellProvider({ children }: { children: ReactNode }) {
  hydrate();
  return <>{children}</>;
}
