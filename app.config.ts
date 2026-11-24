import type { ConfigContext, ExpoConfig } from 'expo/config';

// Android needs a Google Maps key for release builds (Expo Go works without one).
const googleMapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Curby',
  slug: 'curby',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'curby',
  userInterfaceStyle: 'light',
  backgroundColor: '#F8F9FC',
  ios: {
    bundleIdentifier: 'app.curby.ios',
    supportsTablet: false,
    usesAppleSignIn: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'Curby uses your location to show parking spaces near you.',
      NSPhotoLibraryUsageDescription: 'Curby uses your photos so you can add pictures of your parking space.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'app.curby.android',
    adaptiveIcon: {
      backgroundColor: '#FFFFFF',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
    predictiveBackGestureEnabled: false,
  },
  web: { favicon: './assets/images/favicon.png' },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-web-browser',
    'expo-apple-authentication',
    [
      'expo-splash-screen',
      { backgroundColor: '#FFFFFF', image: './assets/images/splash-icon.png', imageWidth: 120 },
    ],
    [
      'expo-location',
      { locationWhenInUsePermission: 'Curby uses your location to show parking spaces near you.' },
    ],
    [
      'expo-image-picker',
      { photosPermission: 'Curby uses your photos so you can add pictures of your parking space.', cameraPermission: false },
    ],
    ['react-native-maps', googleMapsKey ? { androidGoogleMapsApiKey: googleMapsKey } : {}],
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
});
