import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Megaphone, MessageCircle, User } from 'lucide-react-native';
import AnnouncementScreen from '../screens/AnnouncementScreen';
import ChatsScreen from '../screens/ChatsScreen';
import Profile from '../screens/Profile';
import { useAuth } from '../contexts/AuthContext';
import { View, Text } from 'react-native'; // ✅ Ajout de Text
import api from '../lib/api';

// ✅ Bon pour Expo
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Entypo from '@expo/vector-icons/Entypo';




import CommentsListScreen from '../screens/CommentsListScreen';


const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
    const { profile } = useAuth(); // ✅ Correction ici
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnreadMessages = async () => {
            if (!profile?.id) return;

            try {
                const { data } = await api.get('/chats/unread-count');
                setUnreadCount(data.unreadCount || 0);
            } catch (error) {
                console.error('Erreur chargement messages non lus', error);
            }
        };

        fetchUnreadMessages();
        const interval = setInterval(fetchUnreadMessages, 10000); // ✅ actualise toutes les 10s
        return () => clearInterval(interval);
    }, [profile?.id]);

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#9DB88D',
                tabBarInactiveTintColor: '#6b7280',
                tabBarStyle: {
                    backgroundColor: 'white',
                    borderTopWidth: 1,
                    borderTopColor: '#e5e7eb',
                    paddingBottom: 20,
                    paddingTop: 8,
                    height: 80,
                    position: 'absolute',
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
            }}
        >
            <Tab.Screen
                name="Profile"
                component={Profile}
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ size, color }) => (
                        <User size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Announcements"
                component={AnnouncementScreen}
                options={{
                    title: 'Ilan',
                    tabBarIcon: ({ size, color }) => (
                        <Megaphone size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Chats"
                component={ChatsScreen}
                options={{
                    title: 'Mesajlar',
                    tabBarIcon: ({ size, color }) => (
                        <View style={{ position: 'relative' }}>
                            <MessageCircle size={size} color={color} />
                            {unreadCount > 0 && (
                                <View
                                    style={{
                                        position: 'absolute',
                                        top: -4,
                                        right: -10,
                                        backgroundColor: 'red',
                                        borderRadius: 10,
                                        paddingHorizontal: 5,
                                        minWidth: 18,
                                        height: 18,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ),
                }}
            />


            <Tab.Screen
                name="CommentsListScreen"
                component={CommentsListScreen}
                options={{
                    tabBarLabel: 'Değerlendirme',
                    tabBarIcon: ({ color, size }) => (
                        <Entypo name="star-outlined" size={size} color={color} />
                    ),
                }}
            />

        </Tab.Navigator>
    );
};

export default MainTabNavigator;
