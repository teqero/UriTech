const appJson = require('./app.json');

/** Expo config — injects Google Maps API key from env for Android production builds. */
module.exports = () => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  const plugins = [...appJson.expo.plugins];
  if (googleMapsApiKey) {
    plugins.push(['react-native-maps', { googleMapsApiKey }]);
  } else {
    plugins.push('react-native-maps');
  }

  plugins.push([
    'expo-notifications',
    {
      icon: './assets/icon.png',
      color: '#00AA13',
    },
  ]);

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
