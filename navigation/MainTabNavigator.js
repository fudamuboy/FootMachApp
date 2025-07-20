import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Megaphone, MessageCircle, User } from 'lucide-react-native';
import AnnouncementScreen from '../screens/AnnouncementScreen';
import ChatsScreen from '../screens/ChatsScreen';
import Profile from '../screens/Profile';
import { useAuth } from '../contexts/AuthContext';
import { View, Text } from 'react-native'; // ✅ Ajout de Text
import { supabase } from '../lib/supabase'; // ✅ Assure-toi d'importer supabase si ce n'était pas fait
import UserInfoScreen from '../screens/UserInfoScreen';
import AddressScreen from '../screens/AddressScreen';
import EvaluationScreen from '../screens/EvaluationScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';


const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
    const { profile } = useAuth(); // ✅ Correction ici
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnreadMessages = async () => {
            if (!profile?.id) return;

            const { data, error } = await supabase
                .from('messages')
                .select('id')
                .eq('is_read', false)
                .neq('sender_id', profile.id); // Messages reçus non lus

            if (error) {
                console.error('Erreur chargement messages non lus', error);
            } else {
                setUnreadCount(data?.length || 0);
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
                tabBarActiveTintColor: '#3b82f6',
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
                    title: 'Reklamlar',
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
            <Tab.Screen name="UserInfoScreen" component={UserInfoScreen} options={{ tabBarButton: () => null }} />
            <Tab.Screen name="AddressScreen" component={AddressScreen} options={{ tabBarButton: () => null }} />

            <Tab.Screen
                name="Evaluations"
                component={EvaluationScreen}
                options={{
                    tabBarLabel: 'Değerlendirme',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="star" size={size} color={color} />
                    ),
                }}
            />

        </Tab.Navigator>
    );
};

export default MainTabNavigator;
