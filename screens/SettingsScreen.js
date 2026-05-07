import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, SafeAreaView, 
    TouchableOpacity, Linking, Platform, StatusBar, 
    Alert, Modal, Share, ActivityIndicator 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import SettingItem from '../components/profile/SettingItem';
import api from '../lib/api';

const SettingsScreen = () => {
    const navigation = useNavigation();
    const { t, i18n } = useTranslation();
    const { profile, signOut } = useAuth();
    
    const [langModalVisible, setLangModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            t('settings.logout'),
            t('settings.logoutConfirm'),
            [
                { text: t('settings.cancel'), style: 'cancel' },
                { text: t('settings.confirm'), style: 'destructive', onPress: async () => await signOut() }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            t('settings.deleteConfirm'),
            t('settings.irreversible'),
            [
                { text: t('settings.cancel'), style: 'cancel' },
                { 
                    text: t('settings.confirm'), 
                    style: 'destructive', 
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await api.delete('/auth/profile');
                            await signOut();
                        } catch (error) {
                            Alert.alert('Error', error.message);
                        } finally {
                            setLoading(false);
                        }
                    } 
                }
            ]
        );
    };

    const changeLanguage = async (lng) => {
        try {
            await i18n.changeLanguage(lng);
            await AsyncStorage.setItem('userLanguage', lng);
            setLangModalVisible(false);
        } catch (error) {
            console.error('Error changing language:', error);
        }
    };

    const handlePasswordReset = () => {
        navigation.navigate('ChangePassword');
    };

    const handleShare = async () => {
        try {
            const message = t('settings.shareMessage') || `Découvre Dokuz On, l’app pour trouver et organiser des matchs de football près de toi. https://rakibim.app`;
            await Share.share({ message });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleRateApp = () => {
        const appleId = '6738980983'; 
        const androidPackage = 'com.silmo.ESport';
        
        const url = Platform.OS === 'ios'
            ? `itms-apps://itunes.apple.com/app/id${appleId}?action=write-review`
            : `market://details?id=${androidPackage}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert(t('settings.info'), t('settings.notPublished') || "La notation sera disponible après publication.");
            }
        });
    };

    const handleContactSupport = () => {
        const email = 'appwebfusion@gmail.com';
        const subject = 'Dokuz On Support';
        const body = `App Name: Dokuz On\nApp Version: 1.0.0 (Build 42)\nPlatform: ${Platform.OS}\nUser Email: ${profile?.email || 'N/A'}\n\n---\nMessage: `;
        Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    };

    const Section = ({ title, children }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionContent}>
                {children}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('settings.title')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Section title={t('settings.sections.account')}>
                    <SettingItem 
                        icon="user" 
                        label={t('settings.personalInfo')} 
                        onPress={() => navigation.navigate('UserInfoScreen')} 
                    />
                    <SettingItem 
                        icon="target" 
                        label={t('settings.footballInfo')} 
                        onPress={() => navigation.navigate('FootballProfileScreen')} 
                    />
                    <SettingItem 
                        icon="lock" 
                        label={t('settings.changePassword')} 
                        onPress={handlePasswordReset} 
                    />
                    <SettingItem 
                        icon="globe" 
                        label={t('settings.language')} 
                        onPress={() => setLangModalVisible(true)} 
                        rightElement={<Text style={styles.langValue}>{i18n.language.toUpperCase()}</Text>}
                    />
                </Section>

                <Section title={t('settings.sections.app')}>
                    <SettingItem 
                        icon="shield" 
                        label={t('settings.privacyPolicy')} 
                        onPress={() => Linking.openURL('https://www.privacypolicies.com/live/27e3cfae-c97a-41f3-ba7a-2eedc3221363')} 
                    />
                    <SettingItem 
                        icon="file-text" 
                        label={t('settings.termsConditions')} 
                        onPress={() => navigation.navigate('Terms')} 
                    />
                    <SettingItem 
                        icon="help-circle" 
                        label={t('settings.contactSupport')} 
                        onPress={handleContactSupport} 
                    />
                    <SettingItem 
                        icon="info" 
                        label={t('settings.aboutApp')} 
                        onPress={() => navigation.navigate('About')} 
                    />
                    <SettingItem 
                        icon="share-2" 
                        label={t('settings.shareApp')} 
                        onPress={handleShare} 
                    />
                    <SettingItem 
                        icon="star" 
                        label={t('settings.rateApp')} 
                        onPress={handleRateApp} 
                    />
                    <View style={styles.versionContainer}>
                        <Text style={styles.versionText}>{t('settings.appVersion')}: 1.0.0 (Build 42)</Text>
                    </View>
                </Section>

                <Section title={t('settings.sections.security')}>
                    <SettingItem 
                        icon="trash-2" 
                        label={t('settings.deleteAccount')} 
                        onPress={handleDeleteAccount} 
                        destructive 
                    />
                    <SettingItem 
                        icon="log-out" 
                        label={t('settings.logout')} 
                        onPress={handleLogout} 
                        destructive 
                    />
                </Section>
            </ScrollView>

            {/* Language Selection Modal */}
            <Modal visible={langModalVisible} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('settings.languageModalTitle')}</Text>
                        
                        <TouchableOpacity style={styles.langOption} onPress={() => changeLanguage('fr')}>
                            <Text style={[styles.langText, i18n.language === 'fr' && styles.activeLang]}>Français</Text>
                            {i18n.language === 'fr' && <Feather name="check" size={20} color="#4CAF50" />}
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.langOption} onPress={() => changeLanguage('en')}>
                            <Text style={[styles.langText, i18n.language === 'en' && styles.activeLang]}>English</Text>
                            {i18n.language === 'en' && <Feather name="check" size={20} color="#4CAF50" />}
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.langOption} onPress={() => changeLanguage('tr')}>
                            <Text style={[styles.langText, i18n.language === 'tr' && styles.activeLang]}>Türkçe</Text>
                            {i18n.language === 'tr' && <Feather name="check" size={20} color="#4CAF50" />}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.closeButton} onPress={() => setLangModalVisible(false)}>
                            <Text style={styles.closeButtonText}>{t('settings.cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                </View>
            )}
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
        paddingBottom: 40,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#757575',
        marginLeft: 20,
        marginBottom: 8,
        letterSpacing: 1,
    },
    sectionContent: {
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F0F0F0',
    },
    versionContainer: {
        padding: 20,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 12,
        color: '#BDBDBD',
    },
    langValue: {
        fontSize: 14,
        color: '#757575',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFF',
        width: '80%',
        borderRadius: 20,
        padding: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    langOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    langText: {
        fontSize: 16,
        color: '#424242',
    },
    activeLang: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    closeButton: {
        marginTop: 20,
        padding: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#D32F2F',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default SettingsScreen;
