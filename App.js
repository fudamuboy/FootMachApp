import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './contexts/AuthContext';
import { AppNavigator } from './navigation/AppNavigator';
import { UnreadMessagesProvider } from './contexts/UnreadmesagContext';


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