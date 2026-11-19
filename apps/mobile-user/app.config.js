const appJson = require('./app.json');

/** Expo config — injects Google Maps API key from env for Android production builds. */
module.exports = () => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  const isWebExport = process.env.EXPO_EXPORT_WEB === '1';
  let plugins = [...appJson.expo.plugins];
  if (isWebExport) {
    plugins = plugins.filter((p) => (Array.isArray(p) ? p[0] : p) === 'expo-router');
  }
  // react-native-maps não tem config plugin Expo válido; chave Google só em android.config

  if (!isWebExport) plugins.push([
    'expo-notifications',
    {
      icon: './assets/icon.png',
      color: '#00AA13',
    },
  ]);

  if (isWebExport) {
    return {
      ...appJson,
      expo: { ...appJson.expo, plugins },
    };
  }

  return {
    ...appJson,
    expo: {
      ...appJson.expo,
      plugins,
      android: {
        ...appJson.expo.android,
        config: {
          ...(appJson.expo.android?.config ?? {}),
          googleMaps: { apiKey: googleMapsApiKey },
        },
      },
    },
  };
};
