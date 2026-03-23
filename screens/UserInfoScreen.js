import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView, Platform, StatusBar, Alert, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

const UserInfoScreen = () => {
    const navigation = useNavigation();
    const { profile, fetchProfile } = useAuth();
    const { t } = useTranslation();

    const [username, setUsername] = useState('');
    const [phone, setPhone]       = useState('');
    const [email, setEmail]       = useState('');
    const [loading, setLoading]   = useState(false);

    useEffect(() => {
        if (profile) {
            setUsername(profile.username || '');
            setPhone(profile.phone_number || '');
            setEmail(profile.email || '');
        }
    }, [profile]);

    const handleUpdate = async () => {
        setLoading(true);
        try {
            await api.put('/auth/profile', { username, phone, email });
            Alert.alert(t('userInfo.successTitle'), t('userInfo.successMsg'));
            await fetchProfile();
        } catch (error) {
            Alert.alert(t('userInfo.errorTitle'), t('userInfo.errorMsg'));
            console.error(error);
        }
        setLoading(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('userInfo.title')}</Text>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('userInfo.contactInfo')}</Text>
                    <Text style={styles.subText}>
                        {t('userInfo.contactDesc')}
                    </Text>

                    {/* City — read-only, set at registration */}
                    <Text style={styles.label}>{t('userInfo.city')}</Text>
                    <View style={styles.readOnlyField}>
                        <Text style={styles.readOnlyText}>{profile?.city || '—'}</Text>
                    </View>

                    {/* Region — read-only, set at registration */}
                    <Text style={styles.label}>{t('userInfo.region')}</Text>
                    <View style={styles.readOnlyField}>
                        <Text style={styles.readOnlyText}>{profile?.region || '—'}</Text>
                    </View>

                    <Text style={styles.label}>{t('userInfo.phone')}</Text>
                    <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+90 5xx xxx xx xx" />

                    <Text style={styles.label}>{t('userInfo.email')}</Text>
                    <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

                    <Text style={styles.label}>{t('userInfo.displayName')}</Text>
                    <TextInput style={styles.input} value={username} onChangeText={setUsername} />
                </View>

                <View style={styles.section}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleUpdate} disabled={loading}>
                        <Text style={styles.saveText}>{loading ? t('userInfo.saving') : t('userInfo.updateBtn')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton}>
                        <Text style={styles.deleteText}>{t('userInfo.deleteAccount')}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default UserInfoScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1, backgroundColor: '#f9fafb',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
        backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
    scroll: { flex: 1 },
    section: {
        backgroundColor: 'white', marginHorizontal: 16, marginTop: 16,
        borderRadius: 12, padding: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    sectionTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 4, color: '#1f2937' },
    subText: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
    label: { fontSize: 15, fontWeight: '600', marginBottom: 6, color: '#374151' },
    input: {
        backgroundColor: '#f9fafb', borderRadius: 8, padding: 12,
        marginBottom: 14, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 15,
    },
    readOnlyField: {
        backgroundColor: '#f0f0f0', borderRadius: 8, padding: 12,
        marginBottom: 14, borderWidth: 1, borderColor: '#e5e7eb',
    },
    readOnlyText: {
        fontSize: 15, color: '#6b7280',
    },
    saveButton: {
        backgroundColor: '#3b82f6', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10,
    },
    saveText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    deleteButton: {
        backgroundColor: '#ef4444', padding: 14, borderRadius: 10, alignItems: 'center',
    },
    deleteText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
