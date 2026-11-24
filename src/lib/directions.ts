import { Linking, Platform } from 'react-native';

/** Open turn-by-turn directions in Apple Maps / Google Maps. */
export function openDirections(lat: number, lng: number, label: string) {
  const q = encodeURIComponent(label);
  const url = Platform.OS === 'ios' ? `maps://?daddr=${lat},${lng}&q=${q}` : `geo:${lat},${lng}?q=${lat},${lng}(${q})`;
  Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`));
}
