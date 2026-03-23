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
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const FOOT_ICON = { 'Sağ': '🦶R', 'Sol': '🦶L', 'Her İkisi': '🦶B' };

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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1, backgroundColor: '#9DB88D',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        backgroundColor: '#9DB88D', paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center',
    },
    title: { fontSize: 22, fontWeight: 'bold', color: 'black' },
    subtitle: { fontSize: 14, color: '#374151', marginTop: 2 },
    contentContainer: {
        flex: 1, paddingHorizontal: 16, paddingTop: 10, backgroundColor: '#f1f5f9',
    },
    countText: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
    imageBackground: { flex: 1 },
    commentCard: {
        backgroundColor: 'white', padding: 14, borderRadius: 12,
        marginBottom: 10, borderColor: '#e5e7eb', borderWidth: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    teamName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', flex: 1 },
    overallBadge: {
        backgroundColor: '#fef9c3', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
        borderWidth: 1, borderColor: '#fbbf24',
    },
    overallText: { fontSize: 13, fontWeight: 'bold', color: '#92400e' },
    subRatingsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
    subBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#f0fdf4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
        borderWidth: 1, borderColor: '#bbf7d0',
    },
    subBadgeEmoji: { fontSize: 12, marginRight: 3 },
    subBadgeText: { fontSize: 12, color: '#15803d', fontWeight: '600' },
    commentUser: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
    commentText: { fontSize: 14, color: '#374151', lineHeight: 20 },
    emptyContainer: { alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: 16, color: '#6b7280' },
});
