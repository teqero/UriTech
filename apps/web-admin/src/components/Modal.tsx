'use client';

import React from 'react';
import { X } from 'lucide-react';
import styles from '../app/(admin)/dashboard.module.css';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className={styles.card}
        style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 id="modal-title" style={{ fontSize: 18, fontWeight: 600 }}>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" style={{ padding: 6, borderRadius: 8, background: 'var(--gray-50)' }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid var(--gray-100)',
  borderRadius: 10,
  fontSize: 14,
};

export function FormField({
  label,
  children,
}: {
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 13, color: 'var(--gray-500)', display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

export function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...fieldStyle, ...props.style }} />;
}

export function FormSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...fieldStyle, ...props.style }} />;
}

export function FormActions({
  onCancel,
  onSubmit,
  submitLabel = 'Guardar',
  loading,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  loading?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
      <button
        type="button"
        onClick={onSubmit}
        disabled={loading}
        style={{ background: 'var(--primary)', color: 'white', padding: '10px 24px', borderRadius: 10, fontWeight: 600, opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'A guardar…' : submitLabel}
      </button>
      <button type="button" onClick={onCancel} style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid var(--gray-100)' }}>
        Cancelar
      </button>
    </div>
  );
}
