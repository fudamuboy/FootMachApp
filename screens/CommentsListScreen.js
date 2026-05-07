import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ImageBackground,
    SafeAreaView,
    Platform,
    StatusBar
} from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { THEME } from '../constants/theme';

const FOOT_ICON = { 'Sağ': '🦶R', 'Sol': '🦶L', 'Her İkisi': '🦶B' };

const AD_UNIT_ID = Platform.OS === 'ios'
    ? (process.env.EXPO_PUBLIC_IOS_AD_UNIT_ID_BANNER || TestIds.BANNER)
    : (process.env.EXPO_PUBLIC_AD_UNIT_ID_BANNER || TestIds.BANNER);

const SubRatingBadge = ({ label, emoji, value }) => {
    if (!value) return null;
    return (
        <View style={styles.subBadge}>
            <Text style={styles.subBadgeEmoji}>{emoji}</Text>
            <Text style={styles.subBadgeText}>{label} {value}/5</Text>
        </View>
    );
};

export default function CommentsListScreen() {
    const { profile } = useAuth();
    const { t } = useTranslation();
    const [comments, setComments] = useState([]);

    useEffect(() => {
        fetchComments();
    }, []);

    const fetchComments = async () => {
        try {
            const { data } = await api.get('/comments', {
                params: { city: profile?.city || undefined }
            });
            setComments(data || []);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const renderItem = ({ item }) => {
        const hasSubRatings = item.fair_play || item.punctuality || item.level_of_play;
        return (
            <View style={styles.commentCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.teamName}>{item.team_name || 'Bilinmeyen takım'}</Text>
                    <View style={styles.overallBadge}>
                        <Text style={styles.overallText}>⭐ {item.rating}/5</Text>
                    </View>
                </View>

                {hasSubRatings && (
                    <View style={styles.subRatingsRow}>
                        <SubRatingBadge label="Fair Play"  emoji="⚖️" value={item.fair_play} />
                        <SubRatingBadge label="Dakiklik"   emoji="⏰" value={item.punctuality} />
                        <SubRatingBadge label="Seviye"     emoji="⚽" value={item.level_of_play} />
                    </View>
                )}

                <Text style={styles.commentUser}>
                    👤 {item.username || 'anonim'}
                </Text>
                <Text style={styles.commentText}>{item.comment}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.title}>{t('reviews.title')}</Text>
                <Text style={styles.subtitle}>{profile?.city || t('reviews.allCities')}</Text>
            </View>
            <View style={styles.contentContainer}>
                <Text style={styles.countText}>{comments.length} {t('reviews.countText')}</Text>
                <ImageBackground
                    source={require('../assets/logos.jpg')}
                    style={styles.imageBackground}
                    imageStyle={{ opacity: 0.09 }}
                >
                    <FlatList
                        data={comments}
                        keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
                        renderItem={renderItem}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>{t('reviews.empty')}</Text>
                            </View>
                        }
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                    />
                </ImageBackground>
            </View>

            {BannerAd && AD_UNIT_ID ? (
                <View style={styles.adContainer}>
                    <BannerAd
                        unitId={AD_UNIT_ID}
                        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                        requestOptions={{
                            requestNonPersonalizedAdsOnly: true,
                        }}
                        onAdFailedToLoad={(error) => console.log('Banner Ad failed to load:', error)}
                    />
                </View>
            ) : null}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1, backgroundColor: THEME.primary,
    },
    header: {
        backgroundColor: THEME.primary, paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center',
    },
    title: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
    subtitle: { fontSize: 14, color: THEME.light, marginTop: 2 },
    contentContainer: {
        flex: 1, paddingHorizontal: 16, paddingTop: 16, backgroundColor: THEME.background,
    },
    countText: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
    imageBackground: { flex: 1 },
    adContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: THEME.border,
    },
    commentCard: {
        backgroundColor: 'white', padding: 16, borderRadius: 20,
        marginBottom: 12, borderColor: THEME.border, borderWidth: 1,
        ...THEME.shadow,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    teamName: { fontSize: 16, fontWeight: 'bold', color: THEME.text, flex: 1 },
    overallBadge: {
        backgroundColor: '#FFF9C4', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
    },
    overallText: { fontSize: 13, fontWeight: 'bold', color: '#B8860B' },
    subRatingsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    subBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: THEME.light, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
        borderWidth: 1, borderColor: THEME.border,
    },
    subBadgeEmoji: { fontSize: 12, marginRight: 4 },
    subBadgeText: { fontSize: 12, color: THEME.dark, fontWeight: '600' },
    commentUser: { fontSize: 13, color: THEME.subtext, marginBottom: 6, fontWeight: '600' },
    commentText: { fontSize: 14, color: THEME.text, lineHeight: 22 },
    emptyContainer: { alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: 16, color: '#6b7280' },
});
