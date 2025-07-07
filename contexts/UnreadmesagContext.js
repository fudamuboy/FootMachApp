// contexts/UnreadMessagesContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const UnreadMessagesContext = createContext();

export const UnreadMessagesProvider = ({ children }) => {
    const { profile } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadMessages = async () => {
        if (!profile?.id) return;

        const { data, error } = await supabase
            .from('messages')
            .select('id')
            .eq('is_read', false)
            .neq('sender_id', profile.id);

        if (error) {
            console.error('Erreur lecture messages non lus :', error);
            return;
        }

        setUnreadCount(data.length);
    };

    useEffect(() => {
        fetchUnreadMessages();

        const interval = setInterval(fetchUnreadMessages, 10000); // refresh every 10s
        return () => clearInterval(interval);
    }, [profile?.id]);

    return (
        <UnreadMessagesContext.Provider value={{ unreadCount }}>
            {children}
        </UnreadMessagesContext.Provider>
    );
};

export const useUnreadMessages = () => useContext(UnreadMessagesContext);
