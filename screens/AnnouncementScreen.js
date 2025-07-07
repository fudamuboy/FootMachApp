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
} from 'react-native';
import { Plus } from 'lucide-react-native';
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
    const [searchRegion, setSearchRegion] = useState('');

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

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(23, 59, 59, 999);

            let request = supabase
                .from('announcements')
                .select('*')
                .gte('match_time', today.toISOString())
                .lte('match_time', tomorrow.toISOString())
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
                    `and(participant_1.eq.${profile.id},participant_2.eq.${announcement.user_id}),and(participant_1.eq.${announcement.user_id},participant_2.eq.${profile.id})`
                );

            if (fetchError) throw fetchError;

            let chatId = existingChats?.[0]?.id;

            if (!chatId) {
                const { data: newChat, error: insertError } = await supabase
                    .from('chats')
                    .insert({
                        participant_1: profile.id,
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

    const renderAnnouncement = ({ item }) => (
        <AnnouncementCard
            announcement={item}
            onContact={handleContact}
            isOwner={item.user_id === profile?.id}
        />
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>⚽</Text>
            </View>
            <Text style={styles.emptyTitle}>Hiç reklam</Text>
            <Text style={styles.emptySubtitle}>
                Arama çubuğunda başka bir bölge deneyin
            </Text>
        </View>
    );

    return (
        <SafeAreaView edges={['bottom']} // ✅ ne protège que le bas
            style={{ flex: 1 }}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Reklamlar</Text>
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
});
