import type { ImageStyle, StyleProp, TextStyle, ViewStyle } from 'react-native';

type Style = ViewStyle | TextStyle | ImageStyle;

/** Merge styles safely for react-native-web (avoids false in style arrays). */
export function cx(...parts: (Style | false | null | undefined)[]): StyleProp<ViewStyle> {
  const out: Style[] = [];
  for (const part of parts) {
    if (part) out.push(part);
  }
  return out.length === 1 ? out[0] : out;
}
