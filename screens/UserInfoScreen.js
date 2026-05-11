import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView, Platform, StatusBar, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../constants/theme';

const InputField = ({ 
    label, value, onChangeText, placeholder, icon, 
    keyboardType = 'default', multiline = false, numberOfLines = 1, 
    editable = true, autoCorrect = true, returnKeyType = 'done' 
}) => (
    <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.inputWrapper, multiline && styles.textAreaWrapper, !editable && styles.disabledInput]}>
            <Feather name={icon} size={18} color="#9E9E9E" style={styles.inputIcon} />
            <TextInput
                style={[styles.input, multiline && styles.textArea]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#BDBDBD"
                keyboardType={keyboardType}
                multiline={multiline}
                numberOfLines={numberOfLines}
                editable={editable}
                autoCorrect={autoCorrect}
                returnKeyType={multiline ? 'default' : returnKeyType}
                textAlignVertical={multiline ? 'top' : 'center'}
                blurOnSubmit={!multiline}
            />
        </View>
    </View>
);

const UserInfoScreen = () => {
    const navigation = useNavigation();
    const { profile, fetchProfile, updateProfile } = useAuth();
    const { t } = useTranslation();

    const [username, setUsername] = useState('');
    const [phone, setPhone]       = useState('');
    const [email, setEmail]       = useState('');
    const [bio, setBio]           = useState('');
    const [favTeam, setFavTeam]   = useState('');
    const [loading, setLoading]   = useState(false);

    useEffect(() => {
        if (profile) {
            setUsername(profile.username || '');
            setPhone(profile.phone_number || '');
            setEmail(profile.email || '');
            // Only set if they exist and are strings to avoid [object Object] or other issues
            setBio(typeof profile.bio === 'string' ? profile.bio : '');
            setFavTeam(typeof profile.favorite_team === 'string' ? profile.favorite_team : '');
        }
    }, [profile]);

    const handleUpdate = async () => {
        setLoading(true);
        const payload = { 
            username, 
            displayName: username, // Support both
            phone, 
            email,
            bio,
            favoriteTeam: favTeam, // User requested camelCase
            favorite_team: favTeam // Compatibility
        };

        console.log('[UserInfoScreen] 📤 Sending update to /auth/profile');
        console.log('[UserInfoScreen] 📦 Payload:', JSON.stringify(payload, null, 2));

        try {
            const response = await api.put('/auth/profile', payload);
            console.log('[UserInfoScreen] ✅ Success:', response.status);
            Alert.alert(t('userInfo.successTitle'), t('userInfo.successMsg'));
            if (response.data) {
                updateProfile(response.data);
            }
            navigation.goBack();
        } catch (error) {
            console.error('[UserInfoScreen] ❌ Error:', error.message);
            
            // Log full backend response for debugging
            if (error.response?.data) {
                console.log('[UserInfoScreen] 📥 Error Data:', JSON.stringify(error.response.data, null, 2));
            }

            let errorMsg = t('userInfo.errorMsg');

            // If the error object has a specific message from api.js interceptor
            if (error.message && error.message !== 'Error') {
                errorMsg = error.message;
            }
            
            // Append backend detail for developers if available
            const backendDetail = error.response?.data?.detail || error.response?.data?.message;
            if (backendDetail && __DEV__) {
                errorMsg += `\n\n(${backendDetail})`;
            }

            Alert.alert(t('userInfo.errorTitle'), errorMsg);
        }
        setLoading(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('userInfo.title')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{t('userInfo.contactInfo')}</Text>
                        <Text style={styles.cardDesc}>{t('userInfo.contactDesc')}</Text>

                        <InputField 
                            label={t('userInfo.displayName')} 
                            value={username} 
                            onChangeText={setUsername} 
                            placeholder="John Doe"
                            icon="user"
                        />

                        <InputField 
                            label={t('userInfo.email')} 
                            value={email} 
                            onChangeText={setEmail} 
                            placeholder="john@example.com"
                            icon="mail"
                            keyboardType="email-address"
                        />

                        <InputField 
                            label={t('userInfo.phone')} 
                            value={phone} 
                            onChangeText={setPhone} 
                            placeholder="+90 5xx xxx xx xx"
                            icon="phone"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>More About You</Text>
                        
                        <InputField 
                            label={t('userInfo.bio')} 
                            value={bio} 
                            onChangeText={setBio} 
                            placeholder={t('userInfo.bioPlaceholder')}
                            icon="edit-3"
                            multiline={true}
                            numberOfLines={4}
                            autoCorrect={true}
                        />

                        <InputField 
                            label={t('userInfo.favTeam')} 
                            value={favTeam} 
                            onChangeText={setFavTeam} 
                            placeholder="e.g. Galatasaray, Real Madrid"
                            icon="shield"
                            autoCorrect={false}
                            returnKeyType="done"
                        />
                    </View>

                    <TouchableOpacity 
                        style={styles.saveButton} 
                        onPress={handleUpdate} 
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={[THEME.primary, THEME.dark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.saveText}>{t('userInfo.updateBtn')}</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.deleteButton}>
                        <Text style={styles.deleteText}>{t('userInfo.deleteAccount')}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    backButton: {
        padding: 8,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    cardDesc: {
        fontSize: 13,
        color: '#757575',
        marginBottom: 20,
        lineHeight: 18,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#424242',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    textAreaWrapper: {
        alignItems: 'flex-start',
        paddingVertical: 12,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 15,
        color: '#1A1A1A',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    disabledInput: {
        backgroundColor: '#EEEEEE',
        opacity: 0.7,
    },
    saveButton: {
        marginTop: 10,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    gradient: {
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    deleteButton: {
        marginTop: 20,
        padding: 16,
        alignItems: 'center',
    },
    deleteText: {
        color: '#D32F2F',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default UserInfoScreen;
