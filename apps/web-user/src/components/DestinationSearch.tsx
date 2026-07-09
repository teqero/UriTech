'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  DEFAULT_ORIGIN,
  estimateRideMinutes,
  formatPlaceLabel,
  previewDemoPlace,
  resolveDemoPlace,
  searchDemoPlaces,
  type DemoPlace,
} from '@uritech/shared';
import styles from './DestinationSearch.module.css';

type DestinationSearchProps = {
  variant?: 'hero' | 'inline';
  mode?: 'navigate' | 'edit';
  initialValue?: string;
  onNavigate?: (dest: string, place?: DemoPlace) => void;
  onQueryChange?: (query: string, place?: DemoPlace) => void;
};

export function DestinationSearch({
  variant = 'hero',
  mode = 'navigate',
  initialValue = '',
  onNavigate,
  onQueryChange,
}: DestinationSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = searchDemoPlaces(query);
  const preview = useMemo(() => previewDemoPlace(query), [query]);
  const previewEta = preview ? estimateRideMinutes(DEFAULT_ORIGIN, preview) : null;

  const applySelection = useCallback(
    (text: string, place?: DemoPlace) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const resolved = place ?? resolveDemoPlace(trimmed);
      const dest = resolved ? formatPlaceLabel(resolved) : trimmed;
      if (mode === 'edit') {
        onQueryChange?.(dest, resolved);
        onNavigate?.(dest, resolved);
        return;
      }
      if (onNavigate) {
        onNavigate(dest, resolved);
        return;
      }
      router.push(`/taxi?dest=${encodeURIComponent(dest)}`);
    },
    [mode, onNavigate, onQueryChange, router],
  );

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const selectPlace = (place: DemoPlace) => {
    const label = formatPlaceLabel(place);
    setQuery(label);
    setOpen(false);
    applySelection(label, place);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (open && suggestions[highlight]) {
        selectPlace(suggestions[highlight]);
      } else {
        applySelection(query, preview);
      }
      return;
    }
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const isHero = variant === 'hero';
  const showSuggestions = open && suggestions.length > 0;

  return (
    <div ref={wrapRef} className={isHero ? styles.heroWrap : styles.inlineWrap}>
      <form
        className={isHero ? styles.searchBox : styles.inlineBox}
        onSubmit={(e) => {
          e.preventDefault();
          applySelection(query, preview);
        }}
      >
        <input
          type="text"
          value={query}
          placeholder="Para onde vamos hoje?"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            setOpen(true);
            setHighlight(0);
            onQueryChange?.(v, previewDemoPlace(v));
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        <button type="submit">{isHero ? 'PESQUISAR' : 'IR'}</button>
      </form>

      {preview && query.trim().length >= 2 && (
        <div className={styles.previewChip}>
          <span className={styles.previewPin}>📍</span>
          <span>
            <strong>{preview.name}</strong>
            <small>{preview.district} · ~{previewEta} min</small>
          </span>
        </div>
      )}

      {showSuggestions && (
        <ul className={styles.suggestions} role="listbox">
          {!query.trim() && (
            <li className={styles.suggestionsLabel}>Destinos populares em Luanda</li>
          )}
          {suggestions.map((place, i) => (
            <li key={place.id} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                className={i === highlight ? styles.suggestionActive : styles.suggestion}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => selectPlace(place)}
              >
                <span className={styles.pin}>📍</span>
                <span>
                  <strong>{place.name}</strong>
                  <small>{place.district} · Luanda</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isHero && (
        <p className={styles.originHint}>Origem: {formatPlaceLabel(DEFAULT_ORIGIN)}</p>
      )}
    </div>
  );
}
