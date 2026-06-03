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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { rs, isTablet } from '../constants/responsive';

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

    const handleRateApp = async () => {
        const appleId = '6738980983'; 
        const androidPackage = 'com.silmo.ESport';
        
        const url = Platform.OS === 'ios'
            ? `itms-apps://itunes.apple.com/app/id${appleId}?action=write-review`
            : `market://details?id=${androidPackage}`;

        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert(t('settings.info'), t('settings.notPublished'));
            }
        } catch (error) {
            Alert.alert(t('errors.title'), t('settings.notPublished'));
        }
    };

    const handleContactSupport = async () => {
        const email = 'appwebfusion@gmail.com';
        const subject = 'Dokuz On Support Request';
        const body = `App Name: Dokuz On\nApp Version: 1.0.0 (Build 42)\nPlatform: ${Platform.OS}\nUser Email: ${profile?.email || 'N/A'}\n\n---\nMessage: `;
        const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
            } else {
                Alert.alert(
                    t('errors.title'), 
                    t('settings.noMailApp')
                );
            }
        } catch (error) {
            Alert.alert(
                t('errors.title'), 
                t('settings.noMailApp')
            );
        }
    };

    const Section = ({ title, children }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionContent}>
                {children}
            </View>
        </View>
    );

    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top : rs(10) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={rs(24)} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('settings.title')}</Text>
                <View style={{ width: rs(40) }} />
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
        paddingHorizontal: rs(16),
        paddingVertical: rs(12),
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: rs(18),
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    backButton: {
        padding: rs(8),
    },
    scrollContent: {
        paddingBottom: rs(40),
        width: isTablet ? '100%' : '100%',
        maxWidth: isTablet ? 600 : '100%',
        alignSelf: 'center',
    },
    section: {
        marginTop: rs(24),
    },
    sectionTitle: {
        fontSize: rs(12),
        fontWeight: '700',
        color: '#757575',
        marginLeft: rs(20),
        marginBottom: rs(8),
        letterSpacing: 1,
    },
    sectionContent: {
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F0F0F0',
        borderRadius: isTablet ? rs(12) : 0,
        overflow: 'hidden',
    },
    versionContainer: {
        padding: rs(20),
        alignItems: 'center',
    },
    versionText: {
        fontSize: rs(12),
        color: '#BDBDBD',
    },
    langValue: {
        fontSize: rs(14),
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
        width: isTablet ? 400 : '80%',
        borderRadius: rs(20),
        padding: rs(24),
    },
    modalTitle: {
        fontSize: rs(18),
        fontWeight: 'bold',
        marginBottom: rs(20),
        textAlign: 'center',
    },
    langOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: rs(16),
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    langText: {
        fontSize: rs(16),
        color: '#424242',
    },
    activeLang: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    closeButton: {
        marginTop: rs(20),
        padding: rs(12),
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#D32F2F',
        fontSize: rs(16),
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
