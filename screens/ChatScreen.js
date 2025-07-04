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
} from 'react-native';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';


const getAvatarUrl = (avatar_url, username) => {
    return avatar_url
        ? avatar_url
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'User')}&background=random`;
};


export default function ChatScreen({ route, navigation }) {
    const { chatId } = route.params;
    const { profile } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [otherUserName, setOtherUserName] = useState('');
    const [otherUserAvatar, setOtherUserAvatar] = useState('');
    const flatListRef = useRef(null);

    const fetchMessages = async () => {
        if (!chatId) return;

        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*, sender:profiles!messages_sender_id_fkey(username)')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true });
            // console.log('data', data, error);

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchChatInfo = async () => {
        if (!chatId || !profile) return;

        try {
            const { data, error } = await supabase
                .from('chats')
                .select(`
          *,
          participant1:profiles!chats_participant_1_fkey(username,avatar_url),
          participant2:profiles!chats_participant_2_fkey(username,avatar_url)
        `)
                .eq('id', chatId)
                .single();

            if (error) throw error;

            const otherUserName = data.participant_1 === profile.id
                ? data.participant2?.username
                : data.participant1?.username;
            const otherUserAvatar = data.participant_1 === profile.id
                ? data.participant2?.avatar_url
                : data.participant1?.avatar_url;
            setOtherUserName(otherUserName);
            setOtherUserAvatar(otherUserAvatar);
        } catch (error) {
            console.error('Error fetching chat info:', error);
        }
    };

    useEffect(() => {
        fetchMessages();
        fetchChatInfo();

        // Subscribe to new messages
        const subscription = supabase
            .channel(`messages:${chatId}`)
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${chatId}`
                },
                (payload) => {
                    setMessages(prev => [...prev, payload.new]);
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [chatId]);

    useEffect(() => {
        // Scroll to bottom when messages change
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !profile || !chatId) return;

        const messageContent = newMessage.trim();
        setNewMessage('');

        try {
            // Insert message
            const { error: messageError } = await supabase
                .from('messages')
                .insert({
                    chat_id: chatId,
                    sender_id: profile.id,
                    content: messageContent
                });

            if (messageError) throw messageError;

            // Update chat last message
            const { error: chatError } = await supabase
                .from('chats')
                .update({
                    last_message: messageContent,
                    last_updated: new Date().toISOString()
                })
                .eq('id', chatId);

            if (chatError) throw chatError;

        } catch (error) {
            console.error('Error sending message:', error);
            setNewMessage(messageContent); // Restore message on error
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

    const renderMessage = ({ item }) => {
        //console.log('item', item);
        const isOwn = item.sender_id === profile?.id;
        const senderName = item.sender?.username;


        return (
            <View style={[styles.messageContainer, isOwn ? styles.ownMessage : styles.otherMessage]}>
                <Text style={[styles.senderName, isOwn ? styles.ownSender : styles.otherSender]}>{senderName}</Text>
                <View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
                    <Text style={[styles.messageText, isOwn ? styles.ownText : styles.otherText]}>
                        {item.content}
                    </Text>
                    <Text style={[styles.messageTime, isOwn ? styles.ownTime : styles.otherTime]}>
                        {formatTime(item.created_at)}
                    </Text>
                </View>
            </View>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun message pour le moment</Text>
            <Text style={styles.emptySubtext}>Envoyez le premier message !</Text>
        </View>
    );

    // Log pour debug
    //console.log('Messages récupérés:', messages);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#1f2937" />
                </TouchableOpacity>
                <View style={styles.chatAvatarContainer}>
                    <Image
                        source={{ uri: getAvatarUrl(otherUserAvatar, otherUserName) }}
                        style={styles.chatAvatar}
                    />

                </View>
                <Text style={styles.headerTitle}>{otherUserName}</Text>
                <View style={styles.placeholder} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messagesList}
                    ListEmptyComponent={renderEmpty}
                    showsVerticalScrollIndicator={false}
                />
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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: 60,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
    },
    placeholder: {
        width: 32,
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
        color: '#2563eb',
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
});