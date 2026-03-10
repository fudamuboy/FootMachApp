import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                if (token) {
                    // Try to fetch user with token
                    const { data } = await api.get('/auth/me');
                    setUser(data);
                    setProfile(data);
                }
            } catch (error) {
                console.warn('Session expired or invalid token:', error.response?.data?.message || error.message);
                await AsyncStorage.removeItem('userToken');
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, []);

    const signUp = async (email, password, displayName, city, region, phoneNumber) => {
        try {
            const { data } = await api.post('/auth/register', {
                email,
                password,
                username: displayName,
                city,
                region,
                phoneNumber
            });

            const { token, user: newUser } = data;
            
            // Save token
            await AsyncStorage.setItem('userToken', token);
            setUser(newUser);
            setProfile(newUser);
            console.log('✅ Profil inséré avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de la création du profil:', error.response?.data?.message || error.message);
            throw new Error(error.response?.data?.message || "Erreur de création de compte");
        }
    };

    const signIn = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', {
                email,
                password
            });

            const { token, user: loggedInUser } = data;

            // Save token
            await AsyncStorage.setItem('userToken', token);
            setUser(loggedInUser);
            setProfile(loggedInUser);
        } catch (error) {
           console.error('SignIn error:', error.response?.data?.message || error.message);
           throw new Error(error.response?.data?.message || "Invalid credentials");
        }
    };

    const signOut = async () => {
        try {
           await AsyncStorage.removeItem('userToken');
           setUser(null);
           setProfile(null);
        } catch(error) {
           console.error("SignOut Error", error);
        }
    };

    const value = {
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
