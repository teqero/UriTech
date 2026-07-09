import type { Location } from '@uritech/shared';

export type UriMapProps = {
  destinationLabel?: string;
  origin?: Location;
  destination?: Location;
  height?: number;
  flex?: boolean;
  showUserLocation?: boolean;
  markers?: Array<{ latitude: number; longitude: number; title?: string; pinColor?: string }>;
};
