import { Platform } from 'react-native';

export const TAB_BAR_HEIGHT = Platform.select({ web: 72, default: 60 }) ?? 60;
export const TAB_SCROLL_PADDING = TAB_BAR_HEIGHT + 24;
