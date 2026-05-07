import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { THEME } from '../../constants/theme';

const PremiumCard = ({ stats, onPress }) => {
    const { t } = useTranslation();
    
    if (!stats) return null;

    const { isPremium, premiumExpiresAt, activityRemainingForPremium, premiumProgress, role, premiumSource } = stats;

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const getRemainingDays = (dateString) => {
        if (!dateString) return 0;
        const diffTime = new Date(dateString) - new Date();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    return (
        <Animated.View entering={FadeInRight.delay(300)} style={styles.container}>
            <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
                <LinearGradient
                    colors={isPremium ? [THEME.premium.gold, THEME.premium.goldDark] : [THEME.primary, THEME.dark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0.8 }}
                    style={styles.gradient}
                >
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            <Feather name="star" size={18} color="#FFF" />
                            <Text style={styles.title}>
                                {isPremium ? t('premium.activeTitle') : t('premium.getFreeTitle')}
                            </Text>
                        </View>
                        {isPremium && (
                            <View style={styles.daysBadge}>
                                <Text style={styles.daysText}>
                                    {role === 'developer' || role === 'admin' 
                                        ? 'DEV' 
                                        : `${getRemainingDays(premiumExpiresAt)} ${t('premium.daysLeft')}`}
                                </Text>
                            </View>
                        )}
                    </View>

                    {isPremium ? (
                        <View style={styles.activeBenefits}>
                            <View style={styles.benefitList}>
                                <BenefitItem icon="zap" text={t('premium.benefits.visibility_title')} />
                                <BenefitItem icon="shield" text={t('premium.benefits.badge_title')} />
                            </View>
                            <Text style={styles.expiryText}>
                                {role === 'developer' || role === 'admin' 
                                    ? t('premium.screen.developerAccess')
                                    : t('premium.expiresOn', { date: formatDate(premiumExpiresAt) })}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.progressSection}>
                            <Text style={styles.progressDesc}>
                                {t('premium.screen.progressTextActivity', { count: activityRemainingForPremium || 0 })}
                            </Text>
                            <View style={styles.progressBarContainer}>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${premiumProgress}%` }]} />
                                </View>
                                <Text style={styles.progressPercent}>{premiumProgress}%</Text>
                            </View>
                            <TouchableOpacity style={styles.learnMore} onPress={onPress}>
                                <Text style={styles.learnMoreText}>{t('premium.learnMore')}</Text>
                                <Feather name="arrow-right" size={14} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
                <Feather 
                    name="star" 
                    size={120} 
                    color="#FFFFFF10" 
                    style={styles.bgIcon} 
                />
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};

const BenefitItem = ({ icon, text }) => (
    <View style={styles.benefitItem}>
        <Feather name={icon} size={12} color="#FFF" />
        <Text style={styles.benefitText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 24,
        overflow: 'hidden',
        ...THEME.shadow,
        shadowOpacity: 0.1,
    },
    gradient: {
        padding: 24,
        position: 'relative',
    },
    content: {
        zIndex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    title: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    daysBadge: {
        backgroundColor: '#FFFFFF25',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFFFFF20',
    },
    daysText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    activeBenefits: {
        gap: 12,
    },
    benefitList: {
        flexDirection: 'row',
        gap: 16,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    benefitText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
    },
    expiryText: {
        color: '#FFFFFF90',
        fontSize: 11,
        marginTop: 12,
        fontWeight: '500',
    },
    progressSection: {
        gap: 16,
    },
    progressDesc: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
    },
    progressBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: '#00000020',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#FFF',
        borderRadius: 3,
    },
    progressPercent: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '800',
    },
    learnMore: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: '#FFFFFF20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    learnMoreText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    bgIcon: {
        position: 'absolute',
        right: -30,
        bottom: -30,
    },
});

export default PremiumCard;
