import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    RefreshControl, ActivityIndicator, Image,
    ImageBackground
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MessageCircle } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';

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
    const { t } = useTranslation();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchChats = async () => {
        if (!profile?.id) return;

        try {
            const { data } = await api.get('/chats');

            const chatsWithNames = (data || []).map((chat) => {
                const isOwn = chat.participant_1 === profile?.id;
                
                return {
                    ...chat,
                    other_user_name: isOwn ? chat.participant_2_username : chat.participant_1_username || t('chats.unknownUser'),
                    other_user_avatar: isOwn ? chat.participant_2_avatar : chat.participant_1_avatar || null,
                    other_user_id: isOwn ? chat.participant_2 : chat.participant_1,
                    unread_count: parseInt(chat.unread_count) || 0,
                };
            });

            // If we want exact unread count per chat, we could aggregate it from the API or fetch it per chat,
            // but for now, we set it to 0 or leave it to rely on the general unread messages API count context.

            setChats(chatsWithNames);
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
            onPress={() => navigation.navigate('Chat', { 
                chatId: item.id,
                otherUserName: item.other_user_name,
                otherUserAvatar: item.other_user_avatar,
                otherUserId: item.other_user_id,
            })}
        >
            <Image
                source={{ uri: getAvatarUrl(item.other_user_avatar, item.other_user_name) }}
                style={styles.chatAvatar}
            />
            <View style={styles.chatContent}>
                <Text style={styles.chatName}>{item.other_user_name}</Text>
                <Text style={styles.chatMessage} numberOfLines={1}>
                    {item.last_message || t('chats.newChat')}
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
            <Text style={styles.emptyTitle}>{t('chats.noChats')}</Text>
            <Text style={styles.emptySubtitle}>
                {t('chats.noChatsDesc')}
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
                <Text style={styles.title}>{t('chats.title')}</Text>
                <Text style={styles.subtitle}>{profile?.city || t('chats.allCities')}</Text>
            </View>

            <ImageBackground
                source={require('../assets/logos.jpg')}
                style={{ flex: 1 }}
                imageStyle={{
                    opacity: 0.09,
                    resizeMode: 'contain'
                }} // 👈 transparence ici
            >
                <FlatList
                    data={chats}
                    renderItem={renderChat}
                    keyExtractor={(item) => item.id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                    ListEmptyComponent={renderEmpty}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                />
            </ImageBackground>

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
        backgroundColor: '#9DB88D'
    },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
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
