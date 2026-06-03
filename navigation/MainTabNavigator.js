import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Megaphone, MessageCircle, User, Star } from 'lucide-react-native';
import AnnouncementScreen from '../screens/AnnouncementScreen';
import ChatsScreen from '../screens/ChatsScreen';
import Profile from '../screens/Profile';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { View, Text } from 'react-native'; // ✅ Ajout de Text
import api from '../lib/api';

import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Entypo from '@expo/vector-icons/Entypo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { rs } from '../constants/responsive';




import CommentsListScreen from '../screens/CommentsListScreen';
import { useUnreadMessages } from '../contexts/UnreadmesagContext';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
    const { unreadCount } = useUnreadMessages();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

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
                    paddingBottom: insets.bottom > 0 ? insets.bottom : rs(16),
                    paddingTop: rs(8),
                    height: rs(65) + (insets.bottom > 0 ? insets.bottom : rs(16)),
                    position: 'absolute',
                },
                tabBarLabelStyle: {
                    fontSize: rs(11),
                    fontWeight: '500',
                },
                tabBarIconStyle: {
                    marginTop: rs(4),
                }
            }}
        >
            <Tab.Screen
                name="Profile"
                component={Profile}
                options={{
                    title: t('tabs.profile'),
                    tabBarIcon: ({ focused, size, color }) => (
                        <User size={rs(24)} color={color} fill={focused ? color : 'transparent'} />
                    ),
                }}
            />
            <Tab.Screen
                name="Announcements"
                component={AnnouncementScreen}
                options={{
                    title: t('tabs.announcements'),
                    tabBarIcon: ({ focused, size, color }) => (
                        <Megaphone size={rs(24)} color={color} fill={focused ? color : 'transparent'} />
                    ),
                }}
            />
            <Tab.Screen
                name="Chats"
                component={ChatsScreen}
                options={{
                    title: t('tabs.chats'),
                    tabBarBadge: unreadCount > 0 ? unreadCount : null,
                    tabBarBadgeStyle: {
                        backgroundColor: '#ef4444',
                        color: 'white',
                        fontSize: rs(10),
                        fontWeight: 'bold',
                        minWidth: rs(16),
                        height: rs(16),
                        borderRadius: rs(8),
                        lineHeight: rs(16)
                    },
                    tabBarIcon: ({ focused, size, color }) => (
                        <MessageCircle size={rs(24)} color={color} fill={focused ? color : 'transparent'} />
                    ),
                }}
            />


            <Tab.Screen
                name="CommentsListScreen"
                component={CommentsListScreen}
                options={{
                    title: t('tabs.reviews'),
                    tabBarIcon: ({ focused, color, size }) => (
                        <Star size={rs(24)} color={color} fill={focused ? color : 'transparent'} />
                    ),
                }}
            />

        </Tab.Navigator>
    );
};

export default MainTabNavigator;
