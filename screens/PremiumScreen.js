import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { THEME } from '../constants/theme';

const { width } = Dimensions.get('window');

const PremiumScreen = ({ navigation, route }) => {
    const { t } = useTranslation();
    const { stats } = route.params || {};

    if (!stats) return null;

    const { isPremium, premiumExpiresAt, premiumSource, role, activityRemainingForPremium, premiumProgress } = stats;

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const benefits = [
        { icon: 'trending-up', title: t('premium.benefits.visibility_title'), desc: t('premium.benefits.visibility_desc') },
        { icon: 'award', title: t('premium.benefits.badge_title'), desc: t('premium.benefits.badge_desc') },
        { icon: 'zap', title: t('premium.benefits.priority_title'), desc: t('premium.benefits.priority_desc') },
        { icon: 'pie-chart', title: t('premium.benefits.stats_title'), desc: t('premium.benefits.stats_desc') },
        { icon: 'plus-circle', title: t('premium.benefits.matches_title'), desc: t('premium.benefits.matches_desc') },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            
            {/* Fixed Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.headerBackButton} 
                    onPress={() => navigation.goBack()}
                >
                    <Feather name="chevron-left" size={28} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitleText}>{t('premium.screen.title')}</Text>
                <View style={{ width: 44 }} /> 
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInDown.duration(600)} style={styles.heroSection}>
                    <LinearGradient
                        colors={isPremium ? [THEME.premium.gold, THEME.premium.goldDark] : [THEME.primary, THEME.dark]}
                        style={styles.heroGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.heroBadge}>
                            <Feather name="star" size={14} color="#FFF" />
                            <Text style={styles.heroBadgeText}>DOKUZ ON PREMIUM</Text>
                        </View>
                        
                        <Text style={styles.heroTitle}>
                            {isPremium ? t('premium.screen.activeTitle') : t('premium.screen.unlockTitle')}
                        </Text>
                        
                        {!isPremium && (
                            <Text style={styles.heroSubtitle}>{t('premium.screen.unlockSubtitle')}</Text>
                        )}
                        
                        {isPremium ? (
                            <View style={styles.activeStatusContainer}>
                                <Text style={styles.statusText}>
                                    {role === 'developer' || role === 'admin' 
                                        ? t('premium.screen.developerAccess')
                                        : premiumSource === 'earned' 
                                            ? t('premium.screen.earnedAccess')
                                            : t('premium.screen.expiresOn', { date: formatDate(premiumExpiresAt) })}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.progressCard}>
                                <View style={styles.progressHeader}>
                                    <Text style={styles.progressLabel}>{t('premium.screen.progressText')}</Text>
                                    <Text style={styles.progressXP}>{premiumProgress}%</Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${premiumProgress}%` }]} />
                                </View>
                                <Text style={styles.progressHint}>
                                    {t('premium.screen.progressTextActivity', { count: activityRemainingForPremium || 0 })}
                                </Text>
                            </View>
                        )}
                    </LinearGradient>
                </Animated.View>

                <View style={styles.benefitsSection}>
                    <Text style={styles.sectionTitle}>{t('premium.screen.benefitsTitle')}</Text>
                    {benefits.map((benefit, index) => (
                        <Animated.View 
                            key={index} 
                            entering={FadeInUp.delay(200 + index * 100)}
                            style={styles.benefitCard}
                        >
                            <View style={[styles.benefitIconWrapper, { backgroundColor: isPremium ? '#F5E6BE' : '#EBF2E8' }]}>
                                <Feather name={benefit.icon} size={20} color={isPremium ? THEME.premium.goldDark : THEME.primary} />
                            </View>
                            <View style={styles.benefitContent}>
                                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                                <Text style={styles.benefitDesc}>{benefit.desc}</Text>
                            </View>
                        </Animated.View>
                    ))}
                </View>

                {!isPremium && (
                    <View style={styles.footerAction}>
                        <TouchableOpacity style={styles.buyButton} activeOpacity={0.8}>
                            <Text style={styles.buyButtonText}>{t('premium.screen.buyNow')}</Text>
                            <Text style={styles.soonText}>{t('premium.screen.comingSoon')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 56,
        backgroundColor: '#FFF',
    },
    headerBackButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1F1F1F',
        letterSpacing: 0.5,
    },
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    content: {
        paddingHorizontal: 20,
    },
    heroSection: {
        borderRadius: 32,
        overflow: 'hidden',
        marginTop: 10,
        marginBottom: 32,
        ...THEME.shadow,
        shadowOpacity: 0.15,
        elevation: 8,
    },
    heroGradient: {
        padding: 32,
        alignItems: 'center',
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        marginBottom: 16,
    },
    heroBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFF',
        textAlign: 'center',
        lineHeight: 38,
    },
    heroSubtitle: {
        fontSize: 15,
        color: '#FFFFFFCC',
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 22,
        fontWeight: '500',
    },
    activeStatusContainer: {
        marginTop: 24,
        backgroundColor: '#00000020',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    statusText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
    },
    progressCard: {
        width: '100%',
        marginTop: 32,
        backgroundColor: '#FFFFFF15',
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#FFFFFF10',
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressLabel: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    progressXP: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
    },
    progressBarBg: {
        width: '100%',
        height: 8,
        backgroundColor: '#00000020',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#FFF',
        borderRadius: 4,
    },
    progressHint: {
        color: '#FFFFFFCC',
        fontSize: 12,
        marginTop: 12,
        textAlign: 'center',
        fontWeight: '600',
    },
    benefitsSection: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F1F1F',
        marginBottom: 20,
        letterSpacing: -0.5,
    },
    benefitCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F5F5F5',
        ...THEME.shadow,
        shadowOpacity: 0.03,
    },
    benefitIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    benefitContent: {
        flex: 1,
    },
    benefitTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F1F1F',
        marginBottom: 4,
    },
    benefitDesc: {
        fontSize: 13,
        color: '#757575',
        lineHeight: 18,
        fontWeight: '500',
    },
    footerAction: {
        marginTop: 8,
    },
    buyButton: {
        backgroundColor: '#1F1F1F',
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        ...THEME.shadow,
        shadowOpacity: 0.2,
    },
    buyButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFF',
    },
    soonText: {
        fontSize: 10,
        color: '#FFFFFF80',
        marginTop: 4,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});

export default PremiumScreen;
