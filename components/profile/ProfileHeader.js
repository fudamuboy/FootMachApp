import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgUri } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { THEME } from '../../constants/theme';

const { width } = Dimensions.get('window');

const ProfileHeader = ({ profile, onEditAvatar, stats, loadingStats }) => {
    const { t } = useTranslation();

    const getAvatarUrl = (style, seed) => {
        return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed || 'User')}`;
    };

    // Default values if stats are not loaded
    const rating = stats?.rating || "New";
    const matchesCount = stats?.matchesCount || 0;
    const level = stats?.level || "Beginner";
    const nextLevel = stats?.nextLevel || "Amateur";
    const levelProgress = stats?.progressToNext || 0;
    const xpPoints = stats?.xpPoints || 0;
    const isPremium = stats?.isPremium || false;
    const completion = stats?.profileCompletion || 0;
    const badges = stats?.badges || [];
    const position = profile?.position || t('profile.noPosition');
    const city = profile?.city || t('profile.noCity');

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[THEME.light, '#FFFFFF']}
                style={styles.gradientBg}
            />
            
            <Animated.View entering={FadeInDown.delay(200)} style={styles.content}>
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={onEditAvatar} style={styles.avatarWrapper}>
                        <View style={styles.avatarGlow} />
                        <View style={styles.avatarBorder}>
                            <SvgUri
                                width="90"
                                height="90"
                                uri={getAvatarUrl(profile?.avatar_style || 'initials', profile?.avatar_seed || profile?.username || 'User')}
                            />
                        </View>
                        <View style={styles.editBadge}>
                            <Feather name="camera" size={14} color="white" />
                        </View>
                    </TouchableOpacity>
                    
                    <Text style={styles.userName}>{profile?.username || 'Player'}</Text>
                    
                    <View style={styles.badgeRow}>
                        {isPremium ? (
                            <View style={[styles.badge, styles.goldBadge]}>
                                <Text style={styles.goldBadgeText}>⭐ {t('profile.goldMember')}</Text>
                            </View>
                        ) : (
                            <View style={[styles.badge, styles.regularBadge]}>
                                <Text style={styles.regularBadgeText}>🔰 {t('profile.newPlayer')}</Text>
                            </View>
                        )}
                        {stats?.role === 'developer' && (
                            <View style={[styles.badge, styles.devBadge]}>
                                <Text style={styles.devBadgeText}>💻 DEV</Text>
                            </View>
                        )}
                        <View style={[styles.badge, styles.positionBadge]}>
                            <Text style={styles.positionBadgeText}>⚽ {position}</Text>
                        </View>
                    </View>

                    {profile?.favorite_team && (
                        <View style={styles.favTeamRow}>
                            <Feather name="shield" size={12} color={THEME.subtext} />
                            <Text style={styles.favTeamText}>{profile.favorite_team}</Text>
                        </View>
                    )}

                    {profile?.bio && (
                        <View style={styles.bioContainer}>
                            <Text style={styles.bioText} numberOfLines={3}>{profile.bio}</Text>
                        </View>
                    )}
                </View>

                {/* Level Progression Bar */}
                <View style={styles.levelCard}>
                    <View style={styles.levelHeader}>
                        <View>
                            <Text style={styles.levelLabel}>{t('profile.stats.level')}</Text>
                            <Text style={styles.levelTitle}>{t(`profile.levels.${level}`)}</Text>
                        </View>
                        <View style={styles.xpBadge}>
                            <Text style={styles.xpText}>{xpPoints} XP</Text>
                        </View>
                    </View>
                    <View style={styles.levelBarContainer}>
                        <View style={styles.levelBarBg}>
                            <Animated.View 
                                style={[styles.levelBarFill, { width: `${levelProgress}%` }]} 
                            />
                        </View>
                        <View style={styles.levelBarInfo}>
                            <Text style={styles.levelNextText}>{t(`profile.levels.${nextLevel}`)}</Text>
                            <Text style={styles.levelPercentText}>{levelProgress}%</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <StatItem 
                        label={t('profile.stats.rating')} 
                        value={rating} 
                        icon="star" 
                        color={THEME.premium.gold} 
                    />
                    <StatItem 
                        label={t('profile.stats.matches')} 
                        value={matchesCount.toString()} 
                        icon="activity" 
                        color={THEME.primary} 
                    />
                    <StatItem 
                        label={t('profile.stats.city')} 
                        value={city} 
                        icon="map-pin" 
                        color="#4A90E2" 
                    />
                </View>

                {!isPremium && stats?.role !== 'developer' && stats?.role !== 'admin' && (
                    <View style={styles.limitCard}>
                        <View style={styles.limitHeader}>
                            <Feather name="info" size={14} color={THEME.subtext} />
                            <Text style={styles.limitTitle}>
                                {t('profile.limits.activeMatches', 'Annonces Actives')}
                            </Text>
                            <Text style={styles.limitValue}>
                                {stats?.activeFutureMatchesCount || 0} / 10
                            </Text>
                        </View>
                        <View style={styles.limitBarBg}>
                            <Animated.View 
                                style={[styles.limitBarFill, { width: `${Math.min(100, ((stats?.activeFutureMatchesCount || 0) / 10) * 100)}%`, backgroundColor: (stats?.activeFutureMatchesCount || 0) >= 10 ? '#FF4444' : THEME.primary }]} 
                            />
                        </View>
                    </View>
                )}
            </Animated.View>
        </View>
    );
};

const StatItem = ({ label, value, icon, color }) => (
    <View style={styles.statItem}>
        <View style={[styles.statIconWrapper, { backgroundColor: `${color}15` }]}>
            <Feather name={icon} size={16} color={color} />
        </View>
        <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#FFF',
    },
    gradientBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
    },
    content: {
        paddingHorizontal: 20,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarWrapper: {
        width: 110,
        height: 110,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    avatarGlow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: `${THEME.primary}10`,
        borderWidth: 1,
        borderColor: `${THEME.primary}05`,
    },
    avatarBorder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
        ...THEME.shadow,
        overflow: 'hidden',
    },
    editBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: THEME.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: THEME.text,
        marginTop: 12,
        marginBottom: 4,
    },
    badgeRow: {
        flexDirection: 'row',
        marginTop: 4,
        gap: 8,
        justifyContent: 'center',
    },
    favTeamRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: THEME.background,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 6,
    },
    favTeamText: {
        fontSize: 12,
        color: THEME.primary,
        fontWeight: '600',
    },
    bioContainer: {
        marginTop: 12,
        paddingHorizontal: 20,
        width: '100%',
    },
    bioText: {
        fontSize: 14,
        color: THEME.subtext,
        textAlign: 'center',
        lineHeight: 20,
        fontStyle: 'italic',
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    goldBadge: {
        backgroundColor: '#F5E6BE20',
        borderColor: '#D4B15A30',
    },
    goldBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#B89040',
        letterSpacing: 0.3,
    },
    regularBadge: {
        backgroundColor: '#F0F0F0',
        borderColor: '#E0E0E0',
    },
    regularBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#757575',
    },
    devBadge: {
        backgroundColor: '#1F1F1F',
        borderColor: '#1F1F1F',
    },
    devBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: 1,
    },
    positionBadge: {
        backgroundColor: '#EBF2E8',
        borderColor: '#9DB88D30',
    },
    positionBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#7C966D',
    },
    levelCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        marginBottom: 16,
        ...THEME.shadow,
        shadowOpacity: 0.06,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    levelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    levelLabel: {
        fontSize: 10,
        color: THEME.subtext,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        fontWeight: '700',
    },
    levelTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: THEME.text,
        marginTop: 4,
    },
    xpBadge: {
        backgroundColor: THEME.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    xpText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '800',
    },
    levelBarContainer: {
        marginTop: 5,
    },
    levelBarBg: {
        height: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    levelBarFill: {
        height: '100%',
        backgroundColor: THEME.primary,
        borderRadius: 4,
    },
    levelBarInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    levelNextText: {
        fontSize: 12,
        color: THEME.subtext,
        fontWeight: '600',
    },
    levelPercentText: {
        fontSize: 12,
        color: THEME.primary,
        fontWeight: '800',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        borderRadius: 24,
        paddingHorizontal: 12,
        paddingVertical: 24,
        ...THEME.shadow,
        shadowOpacity: 0.06,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statValue: {
        fontSize: 15,
        fontWeight: '800',
        color: THEME.text,
        textAlign: 'center',
    },
    statLabel: {
        fontSize: 11,
        color: THEME.subtext,
        marginTop: 4,
        fontWeight: '600',
    },
    limitCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        ...THEME.shadow,
        shadowOpacity: 0.06,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    limitHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    limitTitle: {
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
        color: THEME.text,
        marginLeft: 10,
    },
    limitValue: {
        fontSize: 14,
        fontWeight: '800',
        color: THEME.text,
    },
    limitBarBg: {
        height: 6,
        backgroundColor: '#F0F0F0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    limitBarFill: {
        height: '100%',
        borderRadius: 3,
    },
});

export default ProfileHeader;
