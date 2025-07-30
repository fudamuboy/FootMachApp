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
} from 'react-native';
import { Plus, Star, MessageSquare, Award, X } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import AnnouncementCard from '../components/AnnouncementCard';
import CreateAnnouncement from '../components/CreateAnnouncement';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AnnouncementScreen({ navigation }) {
    const { profile } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEvaluationModal, setShowEvaluationModal] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [searchRegion, setSearchRegion] = useState('');

    // États pour l'évaluation
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [evaluationLoading, setEvaluationLoading] = useState(false);
    const [numericRating, setNumericRating] = useState(null);



    const REGIONS = [
        'Konak', 'Karşıyaka', 'Bornova', 'Buca', 'Çiğli', 'Balçova', 'Gaziemir',
        'Güzelbahçe', 'Karabağlar', 'Bayraklı', 'Menemen', 'Narlıdere', 'Tire',
        'Urla', 'Ödemiş', 'Torbalı', 'Kemalpaşa', 'Aliağa', 'Selçuk', 'Seferihisar'
    ];

    const fetchAnnouncements = async (query = '') => {
        if (!profile) return;

        try {
            setLoading(true);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            nextWeek.setHours(23, 59, 59, 999);

            let request = supabase
                .from('announcements')
                .select('*')
                .gte('match_time', today.toISOString())
                .lte('match_time', nextWeek.toISOString())
                .order('match_time', { ascending: true })
                .range(0, 999); // 👈 affiche jusqu'à 1000 résultats

            if (query.trim()) {
                request = request.ilike('location', `%${query.trim()}%`);
            } else {
                request = request.in('location', REGIONS);
            }

            const { data, error } = await request;

            if (error) throw error;
            setAnnouncements(data || []);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (profile) fetchAnnouncements('');
    }, [profile]);
    // actualiser la liste des annonces
    const handleRefresh = () => {
        setRefreshing(true);
        fetchAnnouncements(searchRegion);
    };

    const handleSearchChange = (text) => {
        setSearchRegion(text);
        fetchAnnouncements(text);
    };

    const handleContact = async (announcement) => {
        if (!profile) return;
        try {
            const { data: existingChats, error: fetchError } = await supabase
                .from('chats')
                .select('id')
                .or(
                    `and(participant_1.eq.${profile?.id},participant_2.eq.${announcement.user_id}),and(participant_1.eq.${announcement.user_id},participant_2.eq.${profile?.id})`
                );

            if (fetchError) throw fetchError;

            let chatId = existingChats?.[0]?.id;

            if (!chatId) {
                const { data: newChat, error: insertError } = await supabase
                    .from('chats')
                    .insert({
                        participant_1: profile?.id,
                        participant_2: announcement.user_id,
                        last_updated: new Date().toISOString(),
                    })
                    .select('id')
                    .single();

                if (insertError) throw insertError;
                chatId = newChat.id;
            }

            navigation.navigate('Chat', { chatId });
        } catch (error) {
            console.error('Error creating/finding chat:', error);
            alert("Erreur lors de l'accès au chat. Veuillez réessayer.");
        }
    };

    const handleEvaluate = (announcement) => {
        setSelectedAnnouncement(announcement);
        setRating(0);
        setComment('');
        setShowEvaluationModal(true);
    };

    const handleStarPress = (selectedRating) => {
        setRating(selectedRating);
    };

    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity
                    key={i}
                    onPress={() => handleStarPress(i)}
                    style={styles.starButton}
                >
                    <Star
                        size={28}
                        color={i <= rating ? '#f59e0b' : '#d1d5db'}
                        fill={i <= rating ? '#f59e0b' : 'transparent'}
                    />
                </TouchableOpacity>
            );
        }
        return stars;
    };

    const getRatingText = () => {
        switch (rating) {
            case 1: return 'Çok Kötü';
            case 2: return 'Kötü';
            case 3: return 'Orta';
            case 4: return 'İyi';
            case 5: return 'Mükemmel';
            default: return 'Puanınızı seçin';
        }
    };

    const handleSubmitEvaluation = async () => {
        if (!selectedAnnouncement) return;

        if (rating === 0) {
            Alert.alert("Hata", "Lütfen bir puan seçin.");
            return;
        }

        if (!comment.trim()) {
            Alert.alert("Hata", "Lütfen bir yorum girin.");
            return;
        }

        setEvaluationLoading(true);

        try {
            const { error } = await supabase.from('comments').insert({
                announcement_id: selectedAnnouncement?.id,
                user_id: profile?.id,
                rating: rating,
                comment: comment,
                team_name: selectedAnnouncement?.team_name ?? null
            });

            if (error) {
                console.error('Evaluation error:', error);
                Alert.alert('Hata', 'Değerlendirme gönderilemedi. Lütfen tekrar deneyin.');
            } else {
                Alert.alert('Başarılı', 'Teşekkürler! Değerlendirmeniz kaydedildi.', [
                    { text: 'Tamam', onPress: () => setShowEvaluationModal(false) }
                ]);
            }
        } catch (error) {
            console.error('Evaluation error:', error);
            Alert.alert('Hata', 'Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setEvaluationLoading(false);
        }
    };

    const renderAnnouncement = ({ item }) => (
        <AnnouncementCard
            announcement={item}
            isOwner={profile?.id === item.user_id}
            onContact={handleContact}
            onEvaluate={handleEvaluate}
        />
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>⚽</Text>
            </View>
            <Text style={styles.emptyTitle}>Hiç ilan</Text>
            <Text style={styles.emptySubtitle}>
                Arama çubuğunda başka bir bölge deneyin
            </Text>
        </View>
    );

    return (
        <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Ilanlar</Text>
                        <Text style={styles.subtitle}>Bölgem: {profile?.region}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setShowCreateModal(true)}
                    >
                        <Plus size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Bir bölge arayın (örn: Buca)"
                        value={searchRegion}
                        onChangeText={handleSearchChange}
                    />
                </View>

                <Text style={{ textAlign: 'center', color: 'gray', marginBottom: 6 }}>
                    Toplam: {announcements.length} reklam
                </Text>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                ) : (
                    <FlatList
                        data={announcements}
                        renderItem={renderAnnouncement}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.list}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                        }
                        ListEmptyComponent={renderEmpty}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                <CreateAnnouncement
                    visible={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => fetchAnnouncements(searchRegion)}
                />

                {/* Modal d'évaluation */}
                <Modal
                    visible={showEvaluationModal}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowEvaluationModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity
                                    onPress={() => setShowEvaluationModal(false)}
                                    style={styles.closeButton}
                                >
                                    <X size={24} color="#6b7280" />
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>Takım Değerlendirmesi</Text>
                                <View style={styles.placeholder} />
                            </View>

                            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                {selectedAnnouncement && (
                                    <>
                                        <View style={styles.teamInfo}>
                                            <Award size={28} color="#3b82f6" />
                                            <Text style={styles.teamName}>{selectedAnnouncement.team_name}</Text>
                                        </View>

                                        <View style={styles.ratingSection}>
                                            <Text style={styles.sectionTitle}>Takım Performansını Değerlendirin</Text>
                                            <View style={styles.starsContainer}>
                                                {renderStars()}
                                            </View>
                                            <Text style={styles.ratingText}>{getRatingText()}</Text>
                                        </View>

                                        <View style={styles.commentSection}>
                                            <View style={styles.commentHeader}>
                                                <MessageSquare size={18} color="#6b7280" />
                                                <Text style={styles.sectionTitle}>Yorumunuz</Text>
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
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: 60,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 2,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    list: {
        padding: 20,
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingBottom: 10,
        backgroundColor: 'white',
    },
    searchInput: {
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        color: '#1f2937',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyIconText: {
        fontSize: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        width: '90%',
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    closeButton: {
        padding: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        flex: 1,
        textAlign: 'center',
    },
    placeholder: {
        width: 40, // Adjust as needed for spacing
    },
    modalBody: {
        padding: 20,
    },
    teamInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    teamName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1f2937',
        marginLeft: 10,
    },
    ratingSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 10,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    starButton: {
        padding: 5,
    },
    ratingText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
    },
    commentSection: {
        marginBottom: 20,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    commentInput: {
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1f2937',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'right',
        marginTop: 5,
    },
    submitButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        backgroundColor: '#a0aec0',
    },
});
