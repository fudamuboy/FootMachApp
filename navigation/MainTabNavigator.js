import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Megaphone, MessageCircle, User, Star } from 'lucide-react-native';
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
import { useUnreadMessages } from '../contexts/UnreadmesagContext';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
    const { unreadCount } = useUnreadMessages();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#9DB88D',
                tabBarInactiveTintColor: '#6b7280',
                tabBarStyle: {
                    backgroundColor: 'white',
                    borderTopWidth: 0,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    paddingBottom: 24,
                    paddingTop: 8,
                    height: 85,
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
                    tabBarIcon: ({ focused, size, color }) => (
                        <User size={size} color={color} fill={focused ? color : 'transparent'} />
                    ),
                }}
            />
            <Tab.Screen
                name="Announcements"
                component={AnnouncementScreen}
                options={{
                    title: 'Ilan',
                    tabBarIcon: ({ focused, size, color }) => (
                        <Megaphone size={size} color={color} fill={focused ? color : 'transparent'} />
                    ),
                }}
            />
            <Tab.Screen
                name="Chats"
                component={ChatsScreen}
                options={{
                    title: 'Mesajlar',
                    tabBarBadge: unreadCount > 0 ? unreadCount : null,
                    tabBarBadgeStyle: {
                        backgroundColor: '#ef4444',
                        color: 'white',
                        fontSize: 10,
                        fontWeight: 'bold',
                    },
                    tabBarIcon: ({ focused, size, color }) => (
                        <MessageCircle size={size} color={color} fill={focused ? color : 'transparent'} />
                    ),
                }}
            />


            <Tab.Screen
                name="CommentsListScreen"
                component={CommentsListScreen}
                options={{
                    title: 'Yorumlar',
                    tabBarIcon: ({ focused, color, size }) => (
                        <Star size={size} color={color} fill={focused ? color : 'transparent'} />
                    ),
                }}
            />

        </Tab.Navigator>
    );
};

export default MainTabNavigator;
