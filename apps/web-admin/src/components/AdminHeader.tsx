'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  LogOut,
  Search,
  Settings,
  User,
  X,
} from 'lucide-react';
import { searchAdminRoutes } from '@/lib/admin-search';
import { useAuth } from '@/components/AuthProvider';
import { useAdminShell } from '@/components/AdminShellProvider';
import { Modal, FormField, FormInput, FormActions } from '@/components/Modal';
import styles from '../app/(admin)/admin.module.css';

export function AdminHeader() {
  const router = useRouter();
  const { logout } = useAuth();
  const {
    profile,
    updateProfile,
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    toast,
    showToast,
  } = useAdminShell();

  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<'perfil' | 'seguranca'>('perfil');
  const [draft, setDraft] = useState(profile);
  const [password, setPassword] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const results = searchAdminRoutes(search);

  useEffect(() => {
    setDraft(profile);
  }, [profile, profileOpen]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function goTo(href: string) {
    setSearch('');
    setSearchOpen(false);
    setNotifOpen(false);
    router.push(href);
  }

  function handleNotifClick(id: string, href: string) {
    markRead(id);
    goTo(href);
  }

  function handleSaveProfile() {
    updateProfile(draft);
    showToast('Perfil actualizado com sucesso.');
    setProfileOpen(false);
  }

  function handleSavePassword() {
    if (password.length > 0 && password.length < 6) {
      showToast('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }
    setPassword('');
    showToast('Palavra-passe actualizada.');
    setProfileOpen(false);
  }

  function handleLogout() {
    logout();
  }

  const initials = profile.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header className={styles.header}>
        <div className={styles.searchWrap} ref={searchRef}>
          <div className={styles.searchBar}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar páginas, motoristas, pedidos…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results[0]) goTo(results[0].href);
                if (e.key === 'Escape') setSearchOpen(false);
              }}
            />
            {search ? (
              <button type="button" className={styles.clearBtn} onClick={() => setSearch('')} aria-label="Limpar">
                <X size={14} />
              </button>
            ) : null}
          </div>
          {searchOpen && search.trim() && (
            <div className={styles.searchDropdown}>
              {results.length === 0 ? (
                <p className={styles.dropdownEmpty}>Nenhum resultado para &quot;{search}&quot;</p>
              ) : (
                results.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => goTo(item.href)}
                  >
                    <span className={styles.dropdownItemLabel}>{item.label}</span>
                    {item.section ? <span className={styles.dropdownItemMeta}>{item.section}</span> : null}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className={styles.headerActions}>
          <div className={styles.dropdownWrap} ref={notifRef}>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Notificações"
              aria-expanded={notifOpen}
              onClick={() => {
                setNotifOpen((v) => !v);
                setProfileOpen(false);
              }}
            >
              <Bell size={20} />
              {unreadCount > 0 ? <span className={styles.badge}>{unreadCount}</span> : null}
            </button>

            {notifOpen && (
              <div className={styles.notificationsPanel}>
                <div className={styles.panelHeader}>
                  <strong>Notificações</strong>
                  {unreadCount > 0 ? (
                    <button type="button" className={styles.linkBtn} onClick={markAllRead}>
                      <Check size={14} /> Marcar todas lidas
                    </button>
                  ) : null}
                </div>
                <div className={styles.panelBody}>
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className={`${styles.notifItem} ${n.read ? styles.notifRead : ''}`}
                      onClick={() => handleNotifClick(n.id, n.href)}
                    >
                      <div className={styles.notifTop}>
                        <span className={styles.notifTitle}>{n.title}</span>
                        <span className={styles.notifTime}>{n.time}</span>
                      </div>
                      <p className={styles.notifMessage}>{n.message}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className={styles.avatar}
            aria-label="Perfil"
            onClick={() => {
              setProfileOpen(true);
              setNotifOpen(false);
            }}
          >
            {initials}
          </button>
        </div>
      </header>

      {toast ? <div className={styles.toast}>{toast}</div> : null}

      <Modal open={profileOpen} title="Perfil do Administrador" onClose={() => setProfileOpen(false)}>
        <div className={styles.profileTabs}>
          {(['perfil', 'seguranca'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`${styles.profileTab} ${profileTab === tab ? styles.profileTabActive : ''}`}
              onClick={() => setProfileTab(tab)}
            >
              {tab === 'perfil' ? 'Perfil' : 'Segurança'}
            </button>
          ))}
        </div>

        {profileTab === 'perfil' ? (
          <>
            <div className={styles.profileHero}>
              <div className={styles.avatarLarge}>{initials}</div>
              <div>
                <p className={styles.profileName}>{profile.name}</p>
                <p className={styles.profileRole}>{profile.role} • {profile.city}</p>
              </div>
            </div>
            <FormField label="Nome completo">
              <FormInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </FormField>
            <FormField label="Email">
              <FormInput type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            </FormField>
            <FormField label="Telefone">
              <FormInput value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
            </FormField>
            <div className={styles.profileLinks}>
              <Link href="/settings" className={styles.profileLink} onClick={() => setProfileOpen(false)}>
                <Settings size={16} /> Configurações
              </Link>
              <Link href="/settings/marca" className={styles.profileLink} onClick={() => setProfileOpen(false)}>
                <User size={16} /> Identidade visual
              </Link>
            </div>
            <FormActions onCancel={() => setProfileOpen(false)} onSubmit={handleSaveProfile} submitLabel="Guardar perfil" />
          </>
        ) : (
          <>
            <FormField label="Nova palavra-passe">
              <FormInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </FormField>
            <p className={styles.profileHint}>A palavra-passe é guardada localmente nesta sessão de demo.</p>
            <FormActions onCancel={() => setProfileOpen(false)} onSubmit={handleSavePassword} submitLabel="Actualizar" />
            <button type="button" className={styles.logoutInline} onClick={handleLogout}>
              <LogOut size={16} /> Terminar sessão
            </button>
          </>
        )}
      </Modal>
    </>
  );
}

export function AdminLogoutButton() {
  const { logout } = useAuth();

  return (
    <button
      type="button"
      className={styles.logoutBtn}
      onClick={() => logout()}
    >
      <LogOut size={20} />
      <span>Sair</span>
    </button>
  );
}
