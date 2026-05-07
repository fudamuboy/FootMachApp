import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking';

import { useAuth } from '../contexts/AuthContext';
import MainTabNavigator from './MainTabNavigator';
import ChatScreen from '../screens/ChatScreen';
import AuthScreen from '../screens/AuthScreen';
import SplashScreen from '../screens/SplashScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import UserInfoScreen from '../screens/UserInfoScreen';
import FootballProfileScreen from '../screens/FootballProfileScreen';
import PublicProfileScreen from '../screens/PublicProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';
import TermsScreen from '../screens/TermsScreen';
import PremiumScreen from '../screens/PremiumScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();

const linking = {
    prefixes: [Linking.createURL('/'), 'rakibim://'],
    config: {
        screens: {
            ForgotPassword: 'forgot-password',
        },
    },
};

export const AppNavigator = () => {
    const { user, loading } = useAuth();
    const [showSplash, setShowSplash] = useState(true);
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(null);

    useEffect(() => {
        const prepare = async () => {
            try {
                const onboardingSeen = await AsyncStorage.getItem('hasSeenOnboarding');
                setHasSeenOnboarding(onboardingSeen === 'true');
                
                // Keep splash for 3 seconds
                await new Promise(resolve => setTimeout(resolve, 3000));
                setShowSplash(false);
            } catch (e) {
                console.error(e);
                setShowSplash(false);
            }
        };

        prepare();
    }, []);

    if (loading || showSplash || hasSeenOnboarding === null) {
        return <SplashScreen />;
    }

    return (
        <NavigationContainer linking={linking}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <>
                        <Stack.Screen name="Main" component={MainTabNavigator} />
                        <Stack.Screen name="Chat" component={ChatScreen} />
                        <Stack.Screen name="UserInfoScreen" component={UserInfoScreen} />
                        <Stack.Screen name="FootballProfileScreen" component={FootballProfileScreen} />
                        <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                        <Stack.Screen name="About" component={AboutScreen} />
                        <Stack.Screen name="Terms" component={TermsScreen} />
                        <Stack.Screen name="Premium" component={PremiumScreen} />
                    </>
                ) : (
                    <>
                        {!hasSeenOnboarding && (
                            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                        )}
                        <Stack.Screen name="Auth" component={AuthScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
