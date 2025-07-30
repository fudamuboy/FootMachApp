import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking';

import { useAuth } from '../contexts/AuthContext';
import MainTabNavigator from './MainTabNavigator';
import ChatScreen from '../screens/ChatScreen';
import AuthScreen from '../screens/AuthScreen';
import SplashScreen from '../screens/SplashScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen'; // �� ajoute cet import
import UserInfoScreen from '../screens/UserInfoScreen';
import AddressScreen from '../screens/AddressScreen';

const Stack = createStackNavigator();

const linking = {
    prefixes: ['myapp://reset-password'], // 👈 ton schéma ici
    config: {
        screens: {
            ResetPassword: 'reset-password', // 👈 correspond à myapp://reset-password
        },
    },
};

export const AppNavigator = () => {
    const { user, loading } = useAuth();
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    if (loading || showSplash) {
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
                        <Stack.Screen name="AddressScreen" component={AddressScreen} />
                    </>
                ) : (
                    <Stack.Screen name="Auth" component={AuthScreen} />
                )}

                <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

            </Stack.Navigator>
        </NavigationContainer>

    );
};
