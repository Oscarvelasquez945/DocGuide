module.exports = () => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  const plugins = ['expo-sqlite', 'expo-font'];

  if (googleMapsApiKey) {
    plugins.push([
      'react-native-maps',
      { androidGoogleMapsApiKey: googleMapsApiKey },
    ]);
  }

  return {
    name: 'DocGuide',
    slug: 'docguide',
    version: '1.0.6',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    backgroundColor: '#EEF4FF',
    ios: {
      supportsTablet: true,
    },
    android: {
      package: 'com.docguidehn.app',
      versionCode: 7,
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins,
    extra: {
      eas: {
        projectId: 'efc16c9c-3f85-4bde-b690-20727772ecb2',
      },
    },
    owner: 'oscar_velasquez_itee',
  };
};
