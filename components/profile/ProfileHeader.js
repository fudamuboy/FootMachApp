import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgUri } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { THEME } from '../../constants/theme';
import { rs, isTablet } from '../../constants/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

    const completion = stats?.profileCompletion || 0;
    const badges = stats?.badges || [];
    const position = profile?.position || t('profile.noPosition');
    const city = profile?.city || t('profile.noCity');

    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top > 0 ? insets.top + rs(20) : rs(60) }]}>
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
                                width={rs(90)}
                                height={rs(90)}
                                uri={getAvatarUrl(profile?.avatar_style || 'initials', profile?.avatar_seed || profile?.username || 'User')}
                            />
                        </View>
                        <View style={styles.editBadge}>
                            <Feather name="camera" size={rs(14)} color="white" />
                        </View>
                    </TouchableOpacity>
                    
                    <Text style={styles.userName}>{profile?.username || 'Player'}</Text>
                    
                    <View style={styles.badgeRow}>
                        <View style={[styles.badge, styles.regularBadge]}>
                                <Text style={styles.regularBadgeText}>🔰 {t('profile.newPlayer')}</Text>
                            </View>
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
                        color={THEME.primary}
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


            </Animated.View>
        </View>
    );
};

const StatItem = ({ label, value, icon, color }) => (
    <View style={styles.statItem}>
        <View style={[styles.statIconWrapper, { backgroundColor: `${color}15` }]}>
            <Feather name={icon} size={rs(16)} color={color} />
        </View>
        <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        paddingBottom: rs(20),
        backgroundColor: '#FFF',
    },
    gradientBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: rs(300),
    },
    content: {
        paddingHorizontal: rs(20),
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: rs(20),
    },
    avatarWrapper: {
        width: rs(110),
        height: rs(110),
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    avatarGlow: {
        position: 'absolute',
        width: rs(120),
        height: rs(120),
        borderRadius: rs(60),
        backgroundColor: `${THEME.primary}10`,
        borderWidth: 1,
        borderColor: `${THEME.primary}05`,
    },
    avatarBorder: {
        width: rs(100),
        height: rs(100),
        borderRadius: rs(50),
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
        bottom: rs(5),
        right: rs(5),
        backgroundColor: THEME.primary,
        width: rs(32),
        height: rs(32),
        borderRadius: rs(16),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    userName: {
        fontSize: rs(24),
        fontWeight: 'bold',
        color: THEME.text,
        marginTop: rs(12),
        marginBottom: rs(4),
    },
    badgeRow: {
        flexDirection: 'row',
        marginTop: rs(4),
        gap: rs(8),
        justifyContent: 'center',
    },
    favTeamRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: rs(8),
        backgroundColor: THEME.background,
        paddingHorizontal: rs(12),
        paddingVertical: rs(4),
        borderRadius: rs(20),
        gap: rs(6),
    },
    favTeamText: {
        fontSize: rs(12),
        color: THEME.primary,
        fontWeight: '600',
    },
    bioContainer: {
        marginTop: rs(12),
        paddingHorizontal: rs(20),
        width: '100%',
        maxWidth: isTablet ? 600 : '100%',
    },
    bioText: {
        fontSize: rs(14),
        color: THEME.subtext,
        textAlign: 'center',
        lineHeight: rs(20),
        fontStyle: 'italic',
    },
    badge: {
        paddingHorizontal: rs(12),
        paddingVertical: rs(6),
        borderRadius: rs(20),
        borderWidth: 1,
    },
    goldBadge: {
        backgroundColor: '#F5E6BE20',
        borderColor: '#D4B15A30',
    },
    goldBadgeText: {
        fontSize: rs(11),
        fontWeight: '700',
        color: '#B89040',
        letterSpacing: 0.3,
    },
    regularBadge: {
        backgroundColor: '#F0F0F0',
        borderColor: '#E0E0E0',
    },
    regularBadgeText: {
        fontSize: rs(11),
        fontWeight: '600',
        color: '#757575',
    },
    devBadge: {
        backgroundColor: '#1F1F1F',
        borderColor: '#1F1F1F',
    },
    devBadgeText: {
        fontSize: rs(10),
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: 1,
    },
    positionBadge: {
        backgroundColor: '#EBF2E8',
        borderColor: '#9DB88D30',
    },
    positionBadgeText: {
        fontSize: rs(11),
        fontWeight: '700',
        color: '#7C966D',
    },
    levelCard: {
        backgroundColor: '#FFF',
        borderRadius: rs(24),
        padding: rs(24),
        marginBottom: rs(16),
        ...THEME.shadow,
        shadowOpacity: 0.06,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        width: isTablet ? '100%' : '100%',
        maxWidth: isTablet ? 800 : '100%',
        alignSelf: isTablet ? 'center' : 'auto',
    },
    levelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: rs(20),
    },
    levelLabel: {
        fontSize: rs(10),
        color: THEME.subtext,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        fontWeight: '700',
    },
    levelTitle: {
        fontSize: rs(22),
        fontWeight: '800',
        color: THEME.text,
        marginTop: rs(4),
    },
    xpBadge: {
        backgroundColor: THEME.primary,
        paddingHorizontal: rs(12),
        paddingVertical: rs(6),
        borderRadius: rs(12),
    },
    xpText: {
        color: '#FFF',
        fontSize: rs(11),
        fontWeight: '800',
    },
    levelBarContainer: {
        marginTop: rs(5),
    },
    levelBarBg: {
        height: rs(8),
        backgroundColor: '#F0F0F0',
        borderRadius: rs(4),
        overflow: 'hidden',
    },
    levelBarFill: {
        height: '100%',
        backgroundColor: THEME.primary,
        borderRadius: rs(4),
    },
    levelBarInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: rs(10),
    },
    levelNextText: {
        fontSize: rs(12),
        color: THEME.subtext,
        fontWeight: '600',
    },
    levelPercentText: {
        fontSize: rs(12),
        color: THEME.primary,
        fontWeight: '800',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        borderRadius: rs(24),
        paddingHorizontal: rs(12),
        paddingVertical: rs(24),
        ...THEME.shadow,
        shadowOpacity: 0.06,
        marginBottom: rs(16),
        borderWidth: 1,
        borderColor: '#F0F0F0',
        width: isTablet ? '100%' : '100%',
        maxWidth: isTablet ? 800 : '100%',
        alignSelf: isTablet ? 'center' : 'auto',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statIconWrapper: {
        width: rs(40),
        height: rs(40),
        borderRadius: rs(20),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: rs(10),
    },
    statValue: {
        fontSize: rs(15),
        fontWeight: '800',
        color: THEME.text,
        textAlign: 'center',
    },
    statLabel: {
        fontSize: rs(11),
        color: THEME.subtext,
        marginTop: rs(4),
        fontWeight: '600',
    },
    limitCard: {
        backgroundColor: '#FFF',
        borderRadius: rs(20),
        padding: rs(20),
        marginBottom: rs(20),
        ...THEME.shadow,
        shadowOpacity: 0.06,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    limitHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: rs(12),
    },
    limitTitle: {
        flex: 1,
        fontSize: rs(13),
        fontWeight: '700',
        color: THEME.text,
        marginLeft: rs(10),
    },
    limitValue: {
        fontSize: rs(14),
        fontWeight: '800',
        color: THEME.text,
    },
    limitBarBg: {
        height: rs(6),
        backgroundColor: '#F0F0F0',
        borderRadius: rs(3),
        overflow: 'hidden',
    },
    limitBarFill: {
        height: '100%',
        borderRadius: rs(3),
    },
});

export default ProfileHeader;
