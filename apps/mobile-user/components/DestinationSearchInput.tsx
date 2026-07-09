import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Platform, type NativeSyntheticEvent, type TextInputKeyPressEventData,
} from 'react-native';
import {
  DEFAULT_ORIGIN,
  colors,
  estimateRideMinutes,
  formatPlaceLabel,
  previewDemoPlace,
  resolveDemoPlace,
  searchDemoPlaces,
  spacing,
  borderRadius,
  type DemoPlace,
} from '@uritech/shared';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: (text: string, place?: DemoPlace) => void;
  placeholder?: string;
  compact?: boolean;
  showPreview?: boolean;
  /** Barra completa na home: ícone + input + botão, overlay por cima do scroll */
  variant?: 'default' | 'home';
  leading?: ReactNode;
  trailing?: ReactNode;
};

export function DestinationSearchInput({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Para onde vamos?',
  compact = false,
  showPreview = true,
  variant = 'default',
  leading,
  trailing,
}: Props) {
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => searchDemoPlaces(value), [value]);
  const preview = useMemo(() => previewDemoPlace(value), [value]);
  const previewEta = preview ? estimateRideMinutes(DEFAULT_ORIGIN, preview) : null;

  const applyText = useCallback(
    (text: string, place?: DemoPlace) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const resolved = place ?? resolveDemoPlace(trimmed);
      const label = resolved ? formatPlaceLabel(resolved) : trimmed;
      onChangeText(label);
      onSubmit?.(label, resolved);
      setOpen(false);
    },
    [onChangeText, onSubmit],
  );

  const selectPlace = (place: DemoPlace) => {
    const label = formatPlaceLabel(place);
    onChangeText(label);
    onSubmit?.(label, place);
    setOpen(false);
  };

  const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter') {
      e.preventDefault?.();
      applyText(value, preview);
    }
  };

  const showDropdown = open && suggestions.length > 0;
  const showPreviewChip = showPreview && preview && value.trim().length >= 2;

  const input = (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={colors.gray500}
      value={value}
      onChangeText={(t) => {
        onChangeText(t);
        setOpen(true);
      }}
      onFocus={() => setOpen(true)}
      onSubmitEditing={() => applyText(value, preview)}
      onKeyPress={onKeyPress}
      returnKeyType="search"
      blurOnSubmit
      style={variant === 'home' ? styles.inputHome : compact ? styles.inputCompact : styles.input}
    />
  );

  const overlay = (showPreviewChip || showDropdown) ? (
    <View style={variant === 'home' ? styles.homeOverlay : styles.inlineOverlay}>
      {showPreviewChip && (
        <View style={styles.previewChip}>
          <Text style={styles.pin}>📍</Text>
          <View style={styles.previewBody}>
            <Text style={styles.previewName}>{preview.name}</Text>
            <Text style={styles.previewMeta}>{preview.district} · ~{previewEta} min</Text>
          </View>
        </View>
      )}
      {showDropdown && (
        <View style={[styles.dropdown, Platform.OS === 'web' && styles.dropdownWeb]}>
          {!value.trim() && (
            <Text style={styles.dropdownLabel}>Destinos populares</Text>
          )}
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.suggestion}
              onPress={() => selectPlace(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.pin}>📍</Text>
              <View style={styles.suggestionBody}>
                <Text style={styles.suggestionName}>{item.name}</Text>
                <Text style={styles.suggestionMeta}>{item.district} · Luanda</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  ) : null;

  if (variant === 'home') {
    return (
      <View style={styles.homeWrap}>
        <View style={styles.homeBar}>
          {leading}
          <View style={styles.homeInputSlot}>{input}</View>
          {trailing}
        </View>
        {overlay}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {input}
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, zIndex: 10 },
  homeWrap: {
    position: 'relative',
    zIndex: 2000,
    ...(Platform.OS === 'web' ? { overflow: 'visible' as const } : {}),
  },
  homeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: 4,
    paddingLeft: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  homeInputSlot: { flex: 1, minWidth: 0 },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.black, paddingVertical: 12 },
  inputHome: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.black, paddingVertical: 12, minWidth: 0 },
  inputCompact: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.black, padding: 0 },
  homeOverlay: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    zIndex: 3000,
    elevation: 24,
    ...(Platform.OS === 'web' ? { overflow: 'visible' as const } : {}),
  },
  inlineOverlay: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    zIndex: 200,
    elevation: 12,
  },
  previewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    padding: 10,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  previewBody: { flex: 1 },
  previewName: { fontSize: 13, fontWeight: '700', color: colors.black },
  previewMeta: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  dropdown: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
    maxHeight: 220,
    overflow: 'hidden',
    elevation: 8,
  },
  dropdownWeb: {
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  },
  dropdownLabel: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    fontSize: 10,
    fontWeight: '700',
    color: colors.gray500,
    textTransform: 'uppercase',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    gap: 10,
  },
  pin: { fontSize: 16 },
  suggestionBody: { flex: 1 },
  suggestionName: { fontSize: 14, fontWeight: '600', color: colors.black },
  suggestionMeta: { fontSize: 12, color: colors.gray500, marginTop: 2 },
});
