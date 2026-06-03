import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Modal, ScrollView, ActivityIndicator, Share, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SvgUri } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../lib/api';
import { THEME } from '../constants/theme';
import ProfileHeader from '../components/profile/ProfileHeader';
import SettingItem from '../components/profile/SettingItem';
import ProgressionOnboarding from '../components/progression/ProgressionOnboarding';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { rs, isTablet } from '../constants/responsive';

const { width } = Dimensions.get('window');

const SummaryItem = ({ icon, label, value }) => (
    <View style={styles.summaryItem}>
        <View style={styles.summaryIconWrapper}>
            <Feather name={icon.trim()} size={16} color={THEME.primary} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>{label}</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>{value}</Text>
        </View>
    </View>
);

const CompletionCard = ({ percent, t }) => (
    <View style={styles.completionCompact}>
        <View style={styles.completionTextRow}>
            <Text style={styles.completionLabel}>{t('profile.completion')}</Text>
            <Text style={styles.completionValueText}>{percent}%</Text>
        </View>
        <View style={styles.miniBarBg}>
            <View style={[styles.miniBarFill, { width: `${percent}%` }]} />
        </View>
    </View>
);

export default function ProfileScreen() {
    const { profile, fetchProfile } = useAuth();
    const navigation = useNavigation();
    const { t } = useTranslation();

    const [onboardingVisible, setOnboardingVisible] = React.useState(false);
    const [modalVisible, setModalVisible] = React.useState(false);
    const [selectedStyle, setSelectedStyle] = React.useState('initials');
    const [selectedSeed, setSelectedSeed] = React.useState('User');
    const [saving, setSaving] = React.useState(false);
    const [stats, setStats] = React.useState(null);
    const [loadingStats, setLoadingStats] = React.useState(true);

    const AVATAR_STYLES = ['initials', 'avataaars', 'bottts', 'lorelei', 'pixel-art', 'fun-emoji'];

    const fetchStats = async () => {
        try {
            console.log('[ProfileScreen] 📊 Fetching user stats...');
            const response = await api.get('users/me/stats');
            setStats(response.data);
            if (response.data && response.data.hasSeenOnboarding === false) {
                setOnboardingVisible(true);
            }
        } catch (error) {
            console.log('❌ Error fetching stats:', error.response?.data?.detail || error.message);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleFinishOnboarding = async () => {
        setOnboardingVisible(false);
        try {
            await api.post('users/mark-onboarding-seen');
        } catch (error) {
            console.log('❌ Error marking onboarding seen:', error.message);
        }
    };

    // Refresh data when screen is focused (navigation back)
    useFocusEffect(
        React.useCallback(() => {
            console.log('[ProfileScreen] 🔄 Screen focused, refreshing data...');
            if (fetchProfile) fetchProfile();
            fetchStats();
        }, [])
    );

    // Debug logging for profile changes
    React.useEffect(() => {
        if (profile) {
            console.log("[ProfileScreen] 👤 Profile updated in Context:", {
                position: profile.position,
                preferred_foot: profile.preferred_foot,
                skill_level: profile.skill_level,
                playing_style: profile.playing_style
            });
        }
    }, [profile]);

    React.useEffect(() => {
        if (profile) {
            setSelectedStyle(profile.avatar_style || 'initials');
            setSelectedSeed(profile.avatar_seed || profile.username || 'User');
        }
    }, [profile, modalVisible]);

    const handleSaveAvatar = async () => {
        setSaving(true);
        try {
            await api.put('/auth/profile', {
                avatar_style: selectedStyle,
                avatar_seed: selectedSeed
            });
            if (fetchProfile) await fetchProfile();
            setModalVisible(false);
        } catch (error) {
            console.log('❌ Error saving avatar:', error.message);
            alert(t('profile.errorUpdate'));
        } finally {
            setSaving(false);
        }
    };

    const getAvatarUrl = (style, seed) => {
        return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed || 'User')}`;
    };

    if (!profile) {
        return (
            <View style={styles.container}>
                <StatusBar backgroundColor={THEME.background} barStyle="dark-content" />
                <ActivityIndicator size="large" color={THEME.primary} style={{ marginTop: rs(50) }} />
            </View>
        );
    }

    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor={THEME.light} barStyle="dark-content" />
            
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
            >
                {/* 1. Header & Stats */}
                <ProfileHeader 
                    profile={profile} 
                    onEditAvatar={() => setModalVisible(true)} 
                    stats={stats}
                    loadingStats={loadingStats}
                />

                {/* 2. Football Summary Section (Compact) */}
                <View style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}>{t('profile.footballSummary.title')}</Text>
                    <View style={styles.summaryGrid}>
                        <SummaryItem 
                            label={t('profile.footballSummary.position')} 
                            value={profile.position ? profile.position.toUpperCase() : t('profile.noPosition')} 
                            icon="target"
                        />
                        <SummaryItem 
                            label={t('profile.footballSummary.strongFoot')} 
                            value={profile.preferred_foot ? t(`footballInfo.footOptions.${profile.preferred_foot.toLowerCase()}`) : t('profile.noPosition')} 
                            icon="zap"
                        />
                        <SummaryItem 
                            label={t('profile.footballSummary.skillLevel')} 
                            value={profile.skill_level ? t(`footballInfo.levelOptions.${profile.skill_level.toLowerCase()}`) : t('profile.noPosition')} 
                            icon="award"
                        />
                        <SummaryItem 
                            label={t('profile.footballSummary.playingStyle')} 
                            value={profile.playing_style ? t(`footballInfo.styleOptions.${profile.playing_style.toLowerCase().trim()}`) : t('profile.noPosition')} 
                            icon="activity"
                        />
                    </View>
                </View>

                {/* 3. Navigation Menu */}
                <View style={styles.menuContainer}>
                    <SettingItem 
                        icon="user" 
                        label={t('profile.userInfo')} 
                        onPress={() => navigation.navigate('UserInfoScreen')} 
                    />
                    <View style={styles.divider} />
                    <SettingItem 
                        icon="target" 
                        label={t('profile.footballInfo')} 
                        onPress={() => navigation.navigate('FootballProfileScreen')} 
                    />
                    <View style={styles.divider} />
                    <SettingItem 
                        icon="settings" 
                        label={t('settings.title')} 
                        onPress={() => navigation.navigate('Settings')} 
                    />
                </View>

                {/* 4. Profile Completion (Compact) */}
                {stats && (
                    <CompletionCard percent={stats.profileCompletion || 0} t={t} />
                )}


                
                {/* Extra space for tab bar */}
                <View style={{ height: insets.bottom + rs(80) }} />
            </ScrollView>

            {/* Avatar Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('profile.editAvatar')}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Feather name="x" size={24} color={THEME.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.previewContainer}>
                            <SvgUri
                                width="120"
                                height="120"
                                uri={getAvatarUrl(selectedStyle, selectedSeed)}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.randomButton}
                            onPress={() => setSelectedSeed(Math.random().toString(36).substring(7))}
                        >
                            <Feather name="refresh-cw" size={16} color="white" />
                            <Text style={styles.randomButtonText}>{t('profile.randomize')}</Text>
                        </TouchableOpacity>

                        <Text style={styles.sectionTitle}>{t('profile.styleSelection')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleList}>
                            {AVATAR_STYLES.map(style => (
                                <TouchableOpacity
                                    key={style}
                                    style={[styles.styleOption, selectedStyle === style && styles.styleOptionSelected]}
                                    onPress={() => setSelectedStyle(style)}
                                >
                                    <SvgUri
                                        width="50"
                                        height="50"
                                        uri={getAvatarUrl(style, selectedSeed)}
                                    />
                                    <Text style={[styles.styleOptionText, selectedStyle === style && styles.styleOptionTextSelected]}>
                                        {style === 'initials' ? t('profile.initials') : style}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSaveAvatar}
                            disabled={saving}
                        >
                            {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>{t('profile.save')}</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            
            <ProgressionOnboarding 
                visible={onboardingVisible} 
                onFinish={handleFinishOnboarding} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    summaryContainer: {
        backgroundColor: THEME.card,
        marginTop: rs(-10),
        marginHorizontal: rs(16),
        padding: rs(16),
        borderRadius: rs(20),
        ...THEME.shadow,
        width: isTablet ? '100%' : 'auto',
        maxWidth: isTablet ? 800 : '100%',
        alignSelf: isTablet ? 'center' : 'auto',
    },
    summaryTitle: {
        fontSize: rs(16),
        fontWeight: 'bold',
        color: THEME.text,
        marginBottom: rs(12),
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: rs(8),
    },
    summaryItem: {
        width: isTablet ? '23%' : '48%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.background,
        padding: rs(10),
        borderRadius: rs(12),
        gap: rs(8),
    },
    summaryIconWrapper: {
        width: rs(28),
        height: rs(28),
        borderRadius: rs(8),
        backgroundColor: THEME.light,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: rs(9),
        color: THEME.subtext,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    summaryValue: {
        fontSize: rs(12),
        color: THEME.text,
        fontWeight: 'bold',
        marginTop: rs(1),
    },
    menuContainer: {
        backgroundColor: THEME.card,
        marginTop: rs(16),
        marginHorizontal: rs(16),
        borderRadius: rs(20),
        overflow: 'hidden',
        ...THEME.shadow,
        width: isTablet ? '100%' : 'auto',
        maxWidth: isTablet ? 800 : '100%',
        alignSelf: isTablet ? 'center' : 'auto',
    },
    divider: {
        height: 1,
        backgroundColor: THEME.border,
        marginHorizontal: rs(16),
    },
    completionCompact: {
        backgroundColor: THEME.card,
        marginHorizontal: rs(16),
        marginTop: rs(16),
        padding: rs(16),
        borderRadius: rs(20),
        ...THEME.shadow,
        width: isTablet ? '100%' : 'auto',
        maxWidth: isTablet ? 800 : '100%',
        alignSelf: isTablet ? 'center' : 'auto',
    },
    completionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    completionTextRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: rs(8),
    },
    completionLabel: {
        fontSize: rs(13),
        fontWeight: '600',
        color: THEME.text,
    },
    completionValueText: {
        fontSize: rs(13),
        fontWeight: 'bold',
        color: THEME.primary,
    },
    miniBarBg: {
        height: rs(8),
        backgroundColor: THEME.border,
        borderRadius: rs(4),
        overflow: 'hidden',
    },
    miniBarFill: {
        height: '100%',
        backgroundColor: THEME.primary,
        borderRadius: rs(4),
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: THEME.card,
        borderTopLeftRadius: rs(24),
        borderTopRightRadius: rs(24),
        padding: rs(24),
        minHeight: rs(450),
        width: isTablet ? '100%' : '100%',
        maxWidth: isTablet ? 600 : '100%',
        alignSelf: 'center',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: rs(20),
    },
    modalTitle: {
        fontSize: rs(20),
        fontWeight: 'bold',
        color: THEME.text,
    },
    previewContainer: {
        alignItems: 'center',
        marginVertical: rs(20),
    },
    randomButton: {
        flexDirection: 'row',
        backgroundColor: '#cbd5e1',
        paddingVertical: rs(10),
        paddingHorizontal: rs(16),
        borderRadius: rs(20),
        alignSelf: 'center',
        alignItems: 'center',
        marginBottom: rs(24),
    },
    randomButtonText: {
        color: '#475569',
        fontWeight: 'bold',
        marginLeft: rs(8),
    },
    sectionTitle: {
        fontSize: rs(16),
        fontWeight: '600',
        marginBottom: rs(12),
        color: THEME.text,
    },
    styleList: {
        flexGrow: 0,
        marginBottom: rs(24),
    },
    styleOption: {
        alignItems: 'center',
        marginRight: rs(16),
        padding: rs(8),
        borderRadius: rs(12),
        borderWidth: 2,
        borderColor: 'transparent',
    },
    styleOptionSelected: {
        borderColor: THEME.primary,
        backgroundColor: '#f0fdf4',
    },
    styleOptionText: {
        marginTop: rs(8),
        fontSize: rs(12),
        color: THEME.subtext,
    },
    styleOptionTextSelected: {
        color: THEME.primary,
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: THEME.primary,
        paddingVertical: rs(16),
        borderRadius: rs(16),
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontSize: rs(16),
        fontWeight: 'bold',
    },
});
