import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    RefreshControl, ActivityIndicator, Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MessageCircle } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const getAvatarUrl = (avatar_url, username) => {
    if (avatar_url) return avatar_url;
    const name = username?.trim() || 'User';
    const initials = name.split(' ').length === 1
        ? name.slice(0, 2).toUpperCase()
        : (name[0] + name.split(' ')[1][0]).toUpperCase();

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
                participant_1_profile:profiles!chats_participant_1_fkey(username, avatar_url),
                participant_2_profile:profiles!chats_participant_2_fkey(username, avatar_url),
                messages(id, chat_id, sender_id, is_read)
            `)
                .or(`participant_1.eq.${profile?.id},participant_2.eq.${profile?.id}`)
                .order('last_updated', { ascending: false });

            if (error) throw error;

            const chatsWithNames = await Promise.all(
                (data || []).map(async (chat) => {
                    const isOwn = chat.participant_1 === profile?.id;
                    const otherProfile = isOwn ? chat.participant_2_profile : chat.participant_1_profile;

                    // 🔴 Compte les messages non lus pour ce chat
                    const { count: unreadCount, error: countError } = await supabase
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('chat_id', chat.id)
                        .eq('is_read', false)
                        .neq('sender_id', profile?.id);

                    if (countError) console.error('Erreur unread count:', countError);

                    return {
                        ...chat,
                        other_user_name: otherProfile?.username?.trim() || 'Bilinmeyen kullanıcı',
                        other_user_avatar: otherProfile?.avatar_url || null,
                        unread_count: unreadCount || 0,
                    };
                })
            );

            setChats(chatsWithNames);
            // console.log('✅ Chats chargés :', chatsWithNames);
        } catch (error) {
            console.error('❌ Erreur fetchChats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };


    // 🔁 Recharge à chaque retour sur l'écran
    useFocusEffect(
        useCallback(() => {
            fetchChats();
        }, [profile?.id])
    );
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (navigation?.getState) {
                const route = navigation.getState().routes.find(r => r.name === 'Chats');
                const refreshFlag = route?.params?.refreshFromChat;

                if (refreshFlag) {
                    console.log('🔄 Rafraîchissement demandé après retour depuis Chat');
                    fetchChats(); // recharge proprement
                    navigation.setParams({ refreshFromChat: false }); // reset le flag
                }
            }
        });

        return unsubscribe;
    }, [navigation, profile?.id]);


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
            <Image
                source={{ uri: getAvatarUrl(item.other_user_avatar, item.other_user_name) }}
                style={styles.chatAvatar}
            />
            <View style={styles.chatContent}>
                <Text style={styles.chatName}>{item.other_user_name}</Text>
                <Text style={styles.chatMessage} numberOfLines={1}>
                    {item.last_message || 'Yeni konuşma'}
                </Text>
            </View>
            <View style={styles.chatRightSide}>
                <Text style={styles.chatTime}>{formatTime(item.last_updated)}</Text>
                {item.unread_count > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{item.unread_count}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
                <MessageCircle size={48} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>Konuşma yok</Text>
            <Text style={styles.emptySubtitle}>
                Sohbete başlamak için duyurulardan bir ekiple iletişime geçin!
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
                <Text style={styles.title}>Mesajlar</Text>
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
    container: { flex: 1, backgroundColor: '#f9fafb' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: 60,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    chatContent: { flex: 1 },
    chatName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    chatMessage: { fontSize: 14, color: '#6b7280' },
    chatTime: { fontSize: 12, color: '#9ca3af', marginLeft: 12 },
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
    chatRightSide: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginLeft: 12,
    },
    unreadBadge: {
        backgroundColor: '#ef4444',
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginTop: 4,
        minWidth: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unreadBadgeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
        textAlign: 'center',
    },
});
