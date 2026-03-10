import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
    ImageBackground,
    StatusBar
} from 'react-native';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useUnreadMessages } from '../contexts/UnreadmesagContext';
import api from '../lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';


const getAvatarUrl = (avatar_url, username) => {
    return avatar_url
        ? avatar_url
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'User')}&background=random`;
};


export default function ChatScreen({ route, navigation }) {
    const { chatId, otherUserName: initialName, otherUserAvatar: initialAvatar } = route.params;
    const { profile } = useAuth();
    const { fetchUnreadMessages } = useUnreadMessages();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [otherUserName, setOtherUserName] = useState(initialName || '');
    const [otherUserAvatar, setOtherUserAvatar] = useState(initialAvatar || '');
    const flatListRef = useRef(null);


    const fetchMessages = async () => {
        if (!chatId) return;

        try {
            const { data } = await api.get(`/chats/${chatId}/messages`);
            setMessages(data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false); // ✅ Important ici
        }
    };


    const fetchChatInfo = async () => {
        if (!chatId || !profile) return;

        try {
             // Instead of a dedicated route since we return chat info with other users, 
             // We can use a simpler fetch or use the data pass from ChatsScreen. 
             // Temporarily bypassing detailed user avatar fetch or fetching from a missing route
        } catch (error) {
            console.error('Error fetching chat info:', error);
        }
    };

    useEffect(() => {
        fetchMessages();
        fetchChatInfo();
        const markMessagesAsRead = async () => {
            if (!profile?.id || !chatId) return;

            try {
                await api.put(`/chats/${chatId}/messages/mark-read`);
                await fetchMessages(); // Refresh
                await fetchUnreadMessages(); // ✅ Refresh tab badge immediately
            } catch(error) {
                 console.error('❌ UPDATE error:', error);
            }
            setLoading(false); // ✅ Toujours finir par ça
        };

        markMessagesAsRead();
    }, [chatId, profile?.id]);




    useEffect(() => {
        // Scroll to bottom when messages change
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);
    useEffect(() => {
        if (!chatId) return;

        // Long Polling since Supabase Realtime channel is removed
        const intervalId = setInterval(() => {
            fetchMessages();
        }, 5000);

        return () => {
            clearInterval(intervalId);
        };
    }, [chatId]);


    const sendMessage = async () => {
        if (!newMessage.trim() || !profile || !chatId) return;

        const messageContent = newMessage.trim();
        setNewMessage('');

        const optimisticMessage = {
            id: Date.now().toString(),
            chat_id: chatId,
            sender_id: profile?.id,
            content: messageContent,
            created_at: new Date().toISOString(),
            is_read: false, 
            sender_username: profile?.username,
        };

        // 1. Ajoute le message localement
        setMessages(prev => [...prev, optimisticMessage]);

        try {
            // 2. Envoie vers API Custom
            await api.post(`/chats/${chatId}/messages`, {
                content: messageContent
            });

        } catch (error) {
            console.error("Erreur lors de l'envoi du message :", error);
        }
    };



    const formatTime = (dateString) => {
        const date = new Date(dateString);
        // Affiche la date complète et l'heure locale d'Istanbul (Turquie)
        return date.toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Istanbul'
        });
    };

    const renderMessage = ({ item, index }) => {
        const isOwn = String(item.sender_id) === String(profile?.id);
        const senderName = item.sender_username;

        // 🔍 Si c’est le dernier message de l’utilisateur
        const isLastOwnMessage =
            isOwn &&
            [...messages].reverse().find(msg => msg.sender_id === profile?.id)?.id === item.id;

        return (

            <View style={[styles.messageContainer, isOwn ? styles.ownMessage : styles.otherMessage]}>
                <Text style={[styles.senderName, isOwn ? styles.ownSender : styles.otherSender]}>
                    {senderName}
                </Text>
                <View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
                    <Text style={[styles.messageText, isOwn ? styles.ownText : styles.otherText]}>
                        {item.content}
                    </Text>
                    <Text style={[styles.messageTime, isOwn ? styles.ownTime : styles.otherTime]}>
                        {formatTime(item.created_at)}
                    </Text>
                    {/* ✅ Ajout du badge "Vu" */}
                    {isLastOwnMessage && item.is_read && (
                        <Text style={styles.readReceipt}>gördü</Text>
                    )}
                </View>
            </View>

        );
    };


    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Şu an için mesaj yok</Text>
            <Text style={styles.emptySubtext}>İlk mesajı gönder!</Text>
        </View>
    );


    return (
        <SafeAreaView edges={['top', 'bottom']}
            style={{ flex: 1, backgroundColor: 'white' }}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#1f2937" />
                    </TouchableOpacity>
                    
                    <View style={styles.headerUserInfo}>
                        <Image
                            source={{ uri: getAvatarUrl(otherUserAvatar, otherUserName) }}
                            style={styles.headerAvatar}
                        />
                        <View style={styles.headerTextContainer}>
                             <Text style={styles.headerTitle} numberOfLines={1}>{otherUserName || 'Yükleniyor...'}</Text>
                             <Text style={styles.headerStatus}>çevrimiçi</Text>
                        </View>
                    </View>
                    
                    <View style={styles.headerActions} />
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                ) : (
                    <ImageBackground source={require('../assets/foot.jpg')}
                        style={{ flex: 1 }}
                        resizeMode="cover">
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderMessage}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.messagesList}
                            ListEmptyComponent={renderEmpty}
                            showsVerticalScrollIndicator={false}
                        />
                    </ImageBackground>
                )}


                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Tapez votre message..."
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={!newMessage.trim()}
                    >
                        <Send size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        paddingTop: Platform.OS === 'ios' ? 0 : 10,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    backButton: {
        padding: 8,
        marginRight: 4,
    },
    headerUserInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e5e7eb',
    },
    headerTextContainer: {
        marginLeft: 12,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    headerStatus: {
        fontSize: 11,
        color: '#10b981',
        fontWeight: '600',
    },
    headerActions: {
        width: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messagesList: {
        padding: 16,
        flexGrow: 1,
    },
    messageContainer: {
        marginBottom: 12,
    },
    ownMessage: {
        alignItems: 'flex-end',
    },
    otherMessage: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    ownBubble: {
        backgroundColor: '#3b82f6',
    },
    otherBubble: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    messageText: {
        fontSize: 16,
        lineHeight: 20,
    },
    ownText: {
        color: 'white',
    },
    otherText: {
        color: '#1f2937',
    },
    messageTime: {
        fontSize: 12,
        marginTop: 4,
    },
    ownTime: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    otherTime: {
        color: '#9ca3af',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 4,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9ca3af',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 12,
        maxHeight: 100,
        fontSize: 16,
        backgroundColor: '#f9fafb',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    senderName: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    ownSender: {
        color: 'white',
        textAlign: 'right',
    },
    otherSender: {
        color: '#6b7280',
        textAlign: 'left',
    },
    chatAvatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    chatAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    readReceipt: {
        fontSize: 10,
        marginTop: 4,
        textAlign: 'right',
        color: 'rgba(255,255,255,0.7)', // clair sur fond bleu
    },

});