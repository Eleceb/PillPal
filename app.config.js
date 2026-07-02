// Expo config. API keys are read from environment variables (see .env.example);
// Expo loads .env automatically when running locally.
module.exports = {
  expo: {
    name: 'PillPal',
    slug: 'pillpal',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.eleceb.pillpal'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: 'com.eleceb.pillpal',
      permissions: [
        'android.permission.SCHEDULE_EXACT_ALARM'
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      }
    },
    web: {
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      }
    },
    extra: {
      eas: {
        projectId: 'fa554535-83e0-405a-a8c3-7db136656db6'
      }
    },
    owner: 'eleceb',
    runtimeVersion: 'exposdk:51.0.0',
    updates: {
      enabled: false
    }
  }
};
