// contexts/UnreadMessagesContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const UnreadMessagesContext = createContext();

export const UnreadMessagesProvider = ({ children }) => {
    const { profile } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadMessages = async () => {
        if (!profile?.id) return;

        try {
            const { data } = await api.get('/chats/unread-count');
            setUnreadCount(data.count || 0);
        } catch (error) {
            console.error('Erreur lecture messages non lus :', error);
        }
    };

    useEffect(() => {
        fetchUnreadMessages();

        const interval = setInterval(fetchUnreadMessages, 10000); // refresh every 10s
        return () => clearInterval(interval);
    }, [profile?.id]);

    return (
        <UnreadMessagesContext.Provider value={{ unreadCount, fetchUnreadMessages }}>
            {children}
        </UnreadMessagesContext.Provider>
    );
};

export const useUnreadMessages = () => useContext(UnreadMessagesContext);
