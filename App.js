import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './contexts/AuthContext';
import { AppNavigator } from './navigation/AppNavigator';
import { UnreadMessagesProvider } from './contexts/UnreadmesagContext';
import './lib/i18n';
import api from './lib/api';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

// Initialize the Mobile Ads SDK safely
try {
  const mobileAds = require('react-native-google-mobile-ads').default;
  if (mobileAds) {
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        console.log('AdMob SDK initialized:', adapterStatuses);
      });
  }
} catch (e) {
  console.log('AdMob module not found, skipping initialization (probably Expo Go)');
}

export default function App() {
  React.useEffect(() => {
    (async () => {
      // 1. Backend Ping (to wake up Render server)
      try {
        if (__DEV__) console.log('Ping backend to wake up...');
        api.get('/health').catch(() => {}); // Fire and forget, we don't need to wait
      } catch (e) {
        // ignore errors here, it's just a wake-up call
      }

      // 2. Tracking Permissions
      try {
        const { status } = await requestTrackingPermissionsAsync();
        if (status === 'granted') {
          console.log('Tracking permission granted');
        }
      } catch (e) {
        console.log('Tracking permission error:', e);
      }
      // 3. Load persisted language
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const i18n = require('./lib/i18n').default;
        const savedLanguage = await AsyncStorage.getItem('userLanguage');
        if (savedLanguage && i18n.language !== savedLanguage) {
          await i18n.changeLanguage(savedLanguage);
          console.log('Language loaded from storage:', savedLanguage);
        }
      } catch (e) {
        console.log('Error loading language:', e);
      }
    })();
  }, []);

  return (
    <AuthProvider>
      <UnreadMessagesProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </UnreadMessagesProvider>
    </AuthProvider>
  );
}