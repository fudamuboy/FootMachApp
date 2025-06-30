import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Megaphone, MessageCircle } from 'lucide-react-native';
import AnnouncementScreen from '../screens/AnnouncementScreen';
import ChatsScreen from '../screens/ChatsScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#3b82f6',
                tabBarInactiveTintColor: '#6b7280',
                tabBarStyle: {
                    backgroundColor: 'white',
                    borderTopWidth: 1,
                    borderTopColor: '#e5e7eb',
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 60,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
            }}
        >
            <Tab.Screen
                name="Announcements"
                component={AnnouncementScreen}
                options={{
                    title: 'Annonces',
                    tabBarIcon: ({ size, color }) => (
                        <Megaphone size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Chats"
                component={ChatsScreen}
                options={{
                    title: 'Messages',
                    tabBarIcon: ({ size, color }) => (
                        <MessageCircle size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default MainTabNavigator;