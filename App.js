import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './contexts/AuthContext';
import { AppNavigator } from './navigation/AppNavigator';
import { UnreadMessagesProvider } from './contexts/UnreadmesagContext';
import './lib/i18n';
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
  return (
    <AuthProvider>
      <UnreadMessagesProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </UnreadMessagesProvider>
    </AuthProvider>
  );
}