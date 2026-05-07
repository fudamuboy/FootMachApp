import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, StatusBar, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const AboutScreen = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { profile } = useAuth();

    const handleContact = () => {
        const email = 'appwebfusion@gmail.com';
        const subject = 'Dokuz On Support';
        const body = `App Name: Dokuz On\nApp Version: 1.0.0 (Build 42)\nPlatform: ${Platform.OS}\nUser Email: ${profile?.email || 'N/A'}`;
        Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('about.title')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.logoContainer}>
                    <View style={styles.logo}>
                        <Text style={styles.logoText}>⚽</Text>
                    </View>
                    <Text style={styles.appName}>Dokuz On</Text>
                    <Text style={styles.version}>Version 1.0.0 (Build 42)</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.description}>{t('about.description')}</Text>
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.madeFor}>{t('about.madeFor')}</Text>
                </View>

                <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
                    <Feather name="mail" size={20} color="#FFF" style={{ marginRight: 10 }} />
                    <Text style={styles.contactButtonText}>{t('about.contact')}</Text>
                </TouchableOpacity>
            </ScrollView>
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
    scrollContent: {
        padding: 24,
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    logoText: {
        fontSize: 50,
    },
    appName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    version: {
        fontSize: 14,
        color: '#757575',
        marginTop: 4,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 2,
    },
    description: {
        fontSize: 16,
        color: '#424242',
        lineHeight: 24,
        textAlign: 'center',
    },
    infoSection: {
        marginVertical: 32,
        alignItems: 'center',
    },
    madeFor: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4CAF50',
    },
    contactButton: {
        flexDirection: 'row',
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    contactButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AboutScreen;
