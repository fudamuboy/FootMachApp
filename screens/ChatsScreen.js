import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function ChatsScreen({ navigation }) {
    const { profile } = useAuth();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchChats = async () => {
        if (!profile) return;

        try {
            const { data, error } = await supabase
                .from('chats')
                .select(`
          *,
          participant1:profiles!chats_participant_1_fkey(display_name),
          participant2:profiles!chats_participant_2_fkey(display_name)
        `)
                .or(`participant_1.eq.${profile.id},participant_2.eq.${profile.id}`)
                .order('last_updated', { ascending: false });

            if (error) throw error;

            const chatsWithNames = (data || []).map((chat) => ({
                ...chat,
                other_user_name: chat.participant_1 === profile.id
                    ? chat.participant2?.display_name
                    : chat.participant1?.display_name
            }));

            setChats(chatsWithNames);
        } catch (error) {
            console.error('Error fetching chats:', error);
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

    const renderChat = ({ item }) => (
        <TouchableOpacity
            style={styles.chatItem}
            onPress={() => navigation.navigate('Chat', { chatId: item.id })}
        >
            <View style={styles.chatContent}>
                <Text style={styles.chatName}>{item.other_user_name}</Text>
                <Text style={styles.chatMessage} numberOfLines={1}>
                    {item.last_message || 'Nouvelle conversation'}
                </Text>
            </View>
            <Text style={styles.chatTime}>{formatTime(item.last_updated)}</Text>
        </TouchableOpacity>
    );

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
});