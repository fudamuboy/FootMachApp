import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    TextInput,
    Modal,
    ScrollView,
    Alert,
    ImageBackground,
} from 'react-native';
import { Plus, Star, MessageSquare, Award, X } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import AnnouncementCard from '../components/AnnouncementCard';
import CreateAnnouncement from '../components/CreateAnnouncement';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { BannerAd, BannerAdSize, RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

const AD_UNIT_ID = Platform.OS === 'ios' 
    ? (process.env.EXPO_PUBLIC_IOS_AD_UNIT_ID_BANNER || TestIds.BANNER) 
    : (process.env.EXPO_PUBLIC_AD_UNIT_ID_BANNER || TestIds.BANNER);

const REWARDED_AD_UNIT_ID = Platform.OS === 'ios'
    ? (process.env.EXPO_PUBLIC_IOS_AD_UNIT_ID_REWARDED || TestIds.REWARDED)
    : (process.env.EXPO_PUBLIC_AD_UNIT_ID_REWARDED || TestIds.REWARDED);

let rewarded = null;
try {
    if (RewardedAd) {
        rewarded = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
            requestNonPersonalizedAdsOnly: true,
        });
    }
} catch (e) {
    console.warn("RewardedAd creation failed:", e.message);
}

// ─── Filter helpers ───────────────────────────────────────────────────────────
const FORMAT_OPTIONS = ['5v5', '7v7', '11v11'];
const TIME_OPTIONS   = ['today', 'thisWeek'];
const FEE_OPTIONS    = ['free', 'paid'];

const isToday = (date) => {
    const now = new Date();
    return date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();
};
const isThisWeek = (date) => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return date >= now && date <= weekFromNow;
};

export default function AnnouncementScreen({ navigation }) {
    const { profile } = useAuth();
    const { t } = useTranslation();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEvaluationModal, setShowEvaluationModal] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [searchRegion, setSearchRegion] = useState('');
    const [newAnnouncementsCount, setNewAnnouncementsCount] = useState(0);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [pastAnnouncements, setPastAnnouncements] = useState([]);
    const [loadingPast, setLoadingPast] = useState(false);

    // Filters
    const [filterFormat, setFilterFormat] = useState('all');
    const [filterTime, setFilterTime] = useState('all');
    const [filterFee, setFilterFee]   = useState('all');

    // Sub-criteria evaluation
    const [fairPlay, setFairPlay]     = useState(0);
    const [punctuality, setPunctuality] = useState(0);
    const [levelOfPlay, setLevelOfPlay] = useState(0);
    const [comment, setComment]       = useState('');
    const [evaluationLoading, setEvaluationLoading] = useState(false);

    // ─── Fetch ────────────────────────────────────────────────────────────────
    const fetchAnnouncements = async (query = '') => {
        if (!profile) return;
        try {
            setLoading(true);
            const { data } = await api.get('/announcements', {
                params: { city: profile.city || undefined, location: query.trim() || undefined }
            });
            setAnnouncements((data || []).map(item => ({ ...item, match_time: new Date(item.match_time) })));
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchPastAnnouncements = async (query = '') => {
        if (!profile) return;
        try {
            setLoadingPast(true);
            const { data } = await api.get('/announcements', {
                params: {
                    city: profile.city || undefined,
                    location: query.trim() || undefined,
                    past: 'true'
                }
            });
            const now = new Date();
            // Client-side safety: only keep actual past matches
            const past = (data || [])
                .map(item => ({ ...item, match_time: new Date(item.match_time) }))
                .filter(item => item.match_time < now);
            setPastAnnouncements(past);
        } catch (error) {
            console.error('Error fetching past announcements:', error);
        } finally {
            setLoadingPast(false);
        }
    };

    useEffect(() => {
        if (profile) {
            fetchAnnouncements('');
            fetchPastAnnouncements('');
        }

        if (!rewarded) return;

        const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
            // Ad loaded
        });

        const unsubscribeEarned = rewarded.addAdEventListener(
            RewardedAdEventType.EARNED_REWARD,
            reward => {
                if (selectedAnnouncement) {
                    handleBoostSuccess(selectedAnnouncement.id);
                }
            },
        );

        if (!rewarded.loaded) {
            rewarded.load();
        }

        return () => {
            if (rewarded) {
                unsubscribeLoaded();
                unsubscribeEarned();
            }
        };
    }, [profile, selectedAnnouncement]);

    useEffect(() => {
        if (!profile) return;
        const intervalId = setInterval(() => fetchAnnouncements(searchRegion), 30000);
        return () => clearInterval(intervalId);
    }, [profile, searchRegion]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchAnnouncements(searchRegion);
        fetchPastAnnouncements(searchRegion);
    };

    const handleSearchChange = (text) => {
        setSearchRegion(text);
        setTimeout(() => {
            fetchAnnouncements(text);
            fetchPastAnnouncements(text);
        }, 300);
    };

    // ─── Client-side filter ──────────────────────────────────────────────────
    const applyFilters = (list) => {
        return list.filter(item => {
            // strict format filter: only show announcements that exactly match the selected format
            if (filterFormat !== 'all' && item.match_format !== filterFormat) return false;
            if (filterFee === 'free' && item.match_fee !== 'free') return false;
            if (filterFee === 'paid'  && item.match_fee !== 'paid') return false;
            if (filterTime === 'today'    && !isToday(item.match_time))    return false;
            if (filterTime === 'thisWeek' && !isThisWeek(item.match_time)) return false;
            return true;
        });
    };

    const displayedList = activeTab === 'upcoming'
        ? applyFilters(announcements)
        : pastAnnouncements;

    // ─── Handlers ─────────────────────────────────────────────────────────────
    const handleContact = async (announcement) => {
        if (!profile) return;
        try {
            const { data: newChat } = await api.post('/chats', {
                participant_2: announcement.user_id,
                city: profile?.city
            });
            navigation.navigate('Chat', { chatId: newChat.id, otherUserId: announcement.user_id });
        } catch (error) {
            console.error('Error creating/finding chat:', error);
            alert("Sohbete erişimde hata oluştu. Tekrar deneyin.");
        }
    };

    const handleEvaluate = (announcement) => {
        setSelectedAnnouncement(announcement);
        setFairPlay(0);
        setPunctuality(0);
        setLevelOfPlay(0);
        setComment('');
        setShowEvaluationModal(true);
    };

    const handleSubmitEvaluation = async () => {
        if (!selectedAnnouncement) return;
        if (fairPlay === 0 || punctuality === 0 || levelOfPlay === 0) {
            Alert.alert("Hata", "Lütfen tüm kriterleri puanlayın.");
            return;
        }
        if (!comment.trim()) {
            Alert.alert("Hata", "Lütfen bir yorum girin.");
            return;
        }

        setEvaluationLoading(true);
        try {
            await api.post('/comments', {
                announcement_id: selectedAnnouncement?.id,
                comment,
                team_name: selectedAnnouncement?.team_name ?? null,
                city: profile?.city,
                fair_play: fairPlay,
                punctuality,
                level_of_play: levelOfPlay,
            });
            Alert.alert('Başarılı', 'Değerlendirmeniz kaydedildi.', [
                { text: 'Tamam', onPress: () => setShowEvaluationModal(false) }
            ]);
        } catch (error) {
            console.error('Evaluation error:', error);
            Alert.alert('Hata', 'Değerlendirme gönderilemedi. Tekrar deneyin.');
        } finally {
            setEvaluationLoading(false);
        }
    };

    const handleBoost = (announcement) => {
        setSelectedAnnouncement(announcement);
        if (rewarded && rewarded.loaded) {
            rewarded.show();
        } else {
            Alert.alert("Bilgi", "Reklam şu anda hazır değil, lütfen tekrar deneyin.");
            if (rewarded && !rewarded.loaded) {
                rewarded.load();
            }
        }
    };

    const handleBoostSuccess = async (announcementId) => {
        try {
            await api.post(`/announcements/${announcementId}/boost`);
            Alert.alert("Başarılı", "İlanınız başarıyla öne çıkarıldı! Artık listede en üstte görünecek.");
            fetchAnnouncements(searchRegion);
        } catch (error) {
            console.error('Error boosting announcement:', error);
            Alert.alert("Hata", "Öne çıkarma işlemi sırasında bir sorun oluştu.");
        }
    };

    // ─── Sub-render: star row ─────────────────────────────────────────────────
    const StarRow = ({ label, emoji, value, onChange }) => (
        <View style={styles.starRowContainer}>
            <Text style={styles.starRowLabel}>{emoji} {label}</Text>
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map(i => (
                    <TouchableOpacity key={i} onPress={() => onChange(i)} style={styles.starButton}>
                        <Star
                            size={26}
                            color={i <= value ? '#f59e0b' : '#d1d5db'}
                            fill={i <= value ? '#f59e0b' : 'transparent'}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderAnnouncement = ({ item }) => (
        <AnnouncementCard
            announcement={item}
            isOwner={profile?.id === item.user_id}
            onContact={handleContact}
            onEvaluate={handleEvaluate}
            onBoost={handleBoost}
        />
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>⚽</Text>
            </View>
            <Text style={styles.emptyTitle}>
                {searchRegion ? 'Bu bölgede ilan yok' : 'Hiç ilan yok'}
            </Text>
            <Text style={styles.emptySubtitle}>
                {searchRegion
                    ? 'Başka bir bölge deneyin veya ilk ilanı oluşturun'
                    : 'İlk ilanı oluşturarak başlayın'
                }
            </Text>
        </View>
    );

    // ─── Render: single filter row ────────────────────────────────────────────

    return (
        <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>{t('announcements.title')}</Text>
                        <Text style={styles.subtitle}>
                            {searchRegion ? `Arama: ${searchRegion}` : `${profile?.city || 'Tüm şehirler'}`}
                        </Text>
                        {newAnnouncementsCount > 0 && (
                            <Text style={styles.newAnnouncementsText}>
                                🆕 {newAnnouncementsCount} yeni ilan
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
                        <Plus size={24} color="black" />
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Bir bölge arayın (örn: Buca)"
                        value={searchRegion}
                        onChangeText={handleSearchChange}
                    />
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
                        onPress={() => setActiveTab('upcoming')}
                    >
                        <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
                            {t('announcements.upcoming')} ({announcements.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'past' && styles.activeTab]}
                        onPress={() => setActiveTab('past')}
                    >
                        <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
                            {t('announcements.past')} ({pastAnnouncements.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Filters (only for upcoming) */}
                {activeTab === 'upcoming' && (
                    <View style={styles.filtersWrapper}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.singleFilterRow}>
                            {FORMAT_OPTIONS.map(opt => (
                                <TouchableOpacity
                                    key={opt}
                                    style={[styles.filterChip, filterFormat === opt && styles.filterChipActive]}
                                    onPress={() => setFilterFormat(filterFormat === opt ? 'all' : opt)}
                                >
                                    <Text style={[styles.filterChipText, filterFormat === opt && styles.filterChipTextActive]}>
                                        {opt}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            {TIME_OPTIONS.map(opt => (
                                <TouchableOpacity
                                    key={opt}
                                    style={[styles.filterChip, filterTime === opt && styles.filterChipActive]}
                                    onPress={() => setFilterTime(filterTime === opt ? 'all' : opt)}
                                >
                                    <Text style={[styles.filterChipText, filterTime === opt && styles.filterChipTextActive]}>
                                        {t(`announcements.${opt}`)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            {FEE_OPTIONS.map(opt => (
                                <TouchableOpacity
                                    key={opt}
                                    style={[styles.filterChip, filterFee === opt && styles.filterChipActive]}
                                    onPress={() => setFilterFee(filterFee === opt ? 'all' : opt)}
                                >
                                    <Text style={[styles.filterChipText, filterFee === opt && styles.filterChipTextActive]}>
                                        {t(`announcements.${opt}`)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#9DB88D" />
                    </View>
                ) : (
                    <ImageBackground
                        source={require('../assets/logos.jpg')}
                        style={{ flex: 1 }}
                        imageStyle={{ opacity: 0.09, resizeMode: 'contain' }}
                    >
                        <FlatList
                            data={displayedList}
                            renderItem={renderAnnouncement}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={styles.list}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                            }
                            ListEmptyComponent={renderEmpty}
                            showsVerticalScrollIndicator={false}
                        />
                    </ImageBackground>
                )}

                {/* Banner Ad (Safe check) */}
                {/* Banner Ad with safety check */}
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

                <CreateAnnouncement
                    visible={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => { fetchAnnouncements(searchRegion); fetchPastAnnouncements(searchRegion); }}
                />

                {/* ── Evaluation Modal ── */}
                <Modal
                    visible={showEvaluationModal}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowEvaluationModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={() => setShowEvaluationModal(false)} style={styles.closeButton}>
                                    <X size={24} color="#6b7280" />
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>Takım Değerlendirmesi</Text>
                                <View style={styles.placeholder} />
                            </View>

                            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                {selectedAnnouncement && (
                                    <>
                                        <View style={styles.teamInfo}>
                                            <Award size={26} color="#9DB88D" />
                                            <Text style={styles.teamName}>{selectedAnnouncement.team_name}</Text>
                                        </View>

                                        <Text style={styles.sectionTitle}>Kriterleri Değerlendirin</Text>

                                        <StarRow label="Sportif Davranış"  emoji="⚖️" value={fairPlay}    onChange={setFairPlay} />
                                        <StarRow label="Dakiklik"           emoji="⏰" value={punctuality} onChange={setPunctuality} />
                                        <StarRow label="Oyun Seviyesi"      emoji="⚽" value={levelOfPlay} onChange={setLevelOfPlay} />

                                        {(fairPlay > 0 && punctuality > 0 && levelOfPlay > 0) && (
                                            <View style={styles.overallRow}>
                                                <Text style={styles.overallLabel}>Genel Puan:</Text>
                                                <Text style={styles.overallValue}>
                                                    ⭐ {Math.round((fairPlay + punctuality + levelOfPlay) / 3)}/5
                                                </Text>
                                            </View>
                                        )}

                                        <View style={styles.commentSection}>
                                            <View style={styles.commentHeader}>
                                                <MessageSquare size={16} color="#6b7280" />
                                                <Text style={styles.sectionTitle}> Yorumunuz</Text>
                                            </View>
                                            <TextInput
                                                style={styles.commentInput}
                                                placeholder="Bu takım hakkında düşüncelerinizi paylaşın..."
                                                multiline
                                                numberOfLines={4}
                                                value={comment}
                                                onChangeText={setComment}
                                                maxLength={500}
                                                textAlignVertical="top"
                                            />
                                            <Text style={styles.charCount}>{comment.length}/500 karakter</Text>
                                        </View>

                                        <TouchableOpacity
                                            style={[styles.submitButton, evaluationLoading && styles.buttonDisabled]}
                                            onPress={handleSubmitEvaluation}
                                            disabled={evaluationLoading}
                                        >
                                            <Text style={styles.submitButtonText}>
                                                {evaluationLoading ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: 60,
        backgroundColor: '#9DB88D',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
    subtitle: { fontSize: 13, color: '#374151', marginTop: 2 },
    newAnnouncementsText: { fontSize: 12, color: '#fff', marginTop: 4, fontWeight: 'bold' },
    addButton: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: 'white',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
    },
    searchContainer: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'white' },
    searchInput: {
        backgroundColor: '#f3f4f6', borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: 9,
        fontSize: 15, color: '#1f2937',
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        marginHorizontal: 12,
        marginTop: 8,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    tab: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
    activeTab: { backgroundColor: '#9DB88D' },
    tabText: { fontSize: 13, fontWeight: 'bold', color: '#6b7280' },
    activeTabText: { color: 'white' },
    // Filter chips
    filtersWrapper: { paddingVertical: 10 },
    singleFilterRow: { gap: 8, paddingHorizontal: 16 },
    filterChip: {
        paddingHorizontal: 14, paddingVertical: 5,
        borderRadius: 16, borderWidth: 1, borderColor: '#d1d5db',
        backgroundColor: '#fff',
    },
    filterChipActive: { backgroundColor: '#9DB88D', borderColor: '#9DB88D' },
    filterChipText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
    filterChipTextActive: { color: 'white', fontWeight: '700' },
    list: { padding: 16 },
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: {
        width: 72, height: 72, borderRadius: 36, backgroundColor: '#f3f4f6',
        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    },
    emptyIconText: { fontSize: 30 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 6 },
    emptySubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', paddingHorizontal: 20 },
    // Evaluation modal
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: {
        backgroundColor: 'white', borderRadius: 16, width: '92%', maxHeight: '85%',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    },
    closeButton: { padding: 4 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', flex: 1, textAlign: 'center' },
    placeholder: { width: 36 },
    modalBody: { padding: 20 },
    teamInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    teamName: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginLeft: 10 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 10 },
    starRowContainer: { marginBottom: 16 },
    starRowLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
    starsContainer: { flexDirection: 'row', gap: 6 },
    starButton: { padding: 2 },
    overallRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#f0fdf4', borderRadius: 10, padding: 12, marginBottom: 16,
    },
    overallLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
    overallValue: { fontSize: 18, fontWeight: 'bold', color: '#15803d' },
    commentSection: { marginBottom: 18 },
    commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    commentInput: {
        backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 14,
        paddingVertical: 10, fontSize: 15, color: '#1f2937', minHeight: 90, textAlignVertical: 'top',
    },
    charCount: { fontSize: 12, color: '#9ca3af', textAlign: 'right', marginTop: 4 },
    submitButton: {
        backgroundColor: '#9DB88D', borderRadius: 12, paddingVertical: 14,
        alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    },
    submitButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    buttonDisabled: { backgroundColor: '#a0aec0' },
    adContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
});
