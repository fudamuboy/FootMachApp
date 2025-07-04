import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator, Image
} from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';


const getAvatarUrl = (avatar_url, username) => {
    if (avatar_url) return avatar_url;

    const name = username?.trim();
    let initials = 'US'; // Valeur par défaut

    if (name) {
        const parts = name.split(' ');
        if (parts.length === 1) {
            initials = parts[0].slice(0, 2).toUpperCase(); // Ex: Meh → ME
        } else {
            initials = (parts[0][0] + parts[1][0]).toUpperCase(); // Ex: Salim Samake → SS
        }
    }

    return `https://ui-avatars.com/api/?name=${initials}&background=random&color=ffffff&bold=true`;
};




export default function ChatsScreen({ navigation }) {
    const { profile } = useAuth();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchChats = async () => {
        if (!profile?.id) return;

        try {
            const { data, error } = await supabase
                .from('chats')
                .select(`
                *,
                participant_1_profile:profiles!chats_participant_1_fkey(username,avatar_url),
                participant_2_profile:profiles!chats_participant_2_fkey(username,avatar_url)
            `)
                .or(`participant_1.eq.${profile.id},participant_2.eq.${profile.id}`)
                .order('last_updated', { ascending: false });

            if (error) throw error;

            // 🔍 LOG ICI POUR DEBUG
            console.log('Résultat brut depuis Supabase:', JSON.stringify(data, null, 2));

            const chatsWithNames = (data || []).map((chat) => {
                const isOwn = chat.participant_1 === profile.id;
                const otherProfile = isOwn ? chat.participant_2_profile : chat.participant_1_profile;

                return {
                    ...chat,
                    other_user_name: otherProfile?.username ?? 'Utilisateur inconnu',
                    other_user_avatar: otherProfile?.avatar_url ?? null,
                };
            });

            setChats(chatsWithNames);
        } catch (error) {
            console.error('❌ Erreur lors du fetch des chats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };



    useEffect(() => {
        fetchChats();

        // Subscribe to chat updates
        const subscription = supabase
            .channel('chats')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chats',
                    filter: `participant_1=eq.${profile?.id},participant_2=eq.${profile?.id}`
                },
                () => {
                    fetchChats();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [profile]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchChats();
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        }
    };

    const renderChat = ({ item }) => {
        console.log('Rendering chat for:', item.other_user_name);

        return (
            <TouchableOpacity
                style={styles.chatItem}
                onPress={() => navigation.navigate('Chat', { chatId: item.id })}
            >
                <Image
                    source={{ uri: getAvatarUrl(item.other_user_avatar, item.other_user_name) }}
                    style={styles.chatAvatar}
                />

                <View style={styles.chatContent}>
                    <Text style={styles.chatName}>{item.other_user_name}</Text>
                    <Text style={styles.chatMessage} numberOfLines={1}>
                        {item.last_message || 'Nouvelle conversation'}
                    </Text>
                </View>
                <Text style={styles.chatTime}>{formatTime(item.last_updated)}</Text>
            </TouchableOpacity>
        );
    };


    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
                <MessageCircle size={48} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>Aucune conversation</Text>
            <Text style={styles.emptySubtitle}>
                Contactez une équipe depuis les annonces pour commencer à discuter !
            </Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Messages</Text>
            </View>

            <FlatList
                data={chats}
                renderItem={renderChat}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={renderEmpty}
                showsVerticalScrollIndicator={false}
            />
        </View>
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
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    chatContent: {
        flex: 1,
    },
    chatName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    chatMessage: {
        fontSize: 14,
        color: '#6b7280',
    },
    chatTime: {
        fontSize: 12,
        color: '#9ca3af',
        marginLeft: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 80,
        paddingHorizontal: 20,
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
        lineHeight: 24,
    },
    chatAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e5e7eb',
        marginRight: 12,
    },

});