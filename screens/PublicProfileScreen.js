import React, { useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, ScrollView, ActivityIndicator,
    Platform, StatusBar, Image
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { SvgUri } from 'react-native-svg';
import api from '../lib/api';

const POSITION_LABELS = { GK: '🥅 Kaleci', DF: '🛡️ Defans', CM: '🔄 Orta Saha', LW: '⬅️ Sol Kanat', RW: '➡️ Sağ Kanat', ST: '🎯 Forvet' };
const FOOT_LABELS    = { Sağ: '🦶 Sağ Ayak', Sol: '🦶 Sol Ayak', 'Her İkisi': '🦶 Her İkisi' };

const getAvatarUrl = (style, seed) => {
    return `https://api.dicebear.com/9.x/${style || 'initials'}/svg?seed=${encodeURIComponent(seed || 'User')}`;
};

export default function PublicProfileScreen() {
    const navigation  = useNavigation();
    const route       = useRoute();
    const { userId }  = route.params;

    const [user, setUser]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await api.get(`/auth/user/${userId}`);
                setUser(data);
            } catch (err) {
                setError('Profil yüklenemedi.');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [userId]);

    if (loading) return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profil</Text>
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#9DB88D" />
            </View>
        </SafeAreaView>
    );

    if (error || !user) return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profil</Text>
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#6b7280' }}>{error || 'Kullanıcı bulunamadı.'}</Text>
            </View>
        </SafeAreaView>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profil</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Avatar + name */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarWrapper}>
                        <SvgUri
                            width="90"
                            height="90"
                            uri={getAvatarUrl(user.avatar_style, user.avatar_seed || user.username)}
                        />
                    </View>
                    <Text style={styles.username}>{user.username}</Text>
                    {user.city && (
                        <Text style={styles.cityText}>📍 {user.city}{user.region ? `, ${user.region}` : ''}</Text>
                    )}

                    {/* Football badges */}
                    {(user.position || user.preferred_foot) && (
                        <View style={styles.badgeRow}>
                            {user.position && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{POSITION_LABELS[user.position] || user.position}</Text>
                                </View>
                            )}
                            {user.preferred_foot && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{FOOT_LABELS[user.preferred_foot] || user.preferred_foot}</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Football info card */}
                {(user.position || user.preferred_foot) && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>⚽ Futbol Bilgileri</Text>
                        {user.position && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Mevki</Text>
                                <Text style={styles.infoValue}>{POSITION_LABELS[user.position] || user.position}</Text>
                            </View>
                        )}
                        {user.preferred_foot && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Baskın Ayak</Text>
                                <Text style={styles.infoValue}>{FOOT_LABELS[user.preferred_foot] || user.preferred_foot}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Contact info card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>👤 Genel Bilgiler</Text>
                    {user.city && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Şehir</Text>
                            <Text style={styles.infoValue}>{user.city}</Text>
                        </View>
                    )}
                    {user.region && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Bölge</Text>
                            <Text style={styles.infoValue}>{user.region}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, backgroundColor: '#f9fafb',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 12 },
    scroll: { padding: 16 },
    avatarSection: { alignItems: 'center', marginBottom: 20 },
    avatarWrapper: {
        width: 90,
        height: 90,
        borderRadius: 45,
        overflow: 'hidden',
        backgroundColor: '#f3f4f6',
        marginBottom: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    username: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
    cityText: { fontSize: 14, color: '#6b7280', marginTop: 4 },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, justifyContent: 'center' },
    badge: {
        backgroundColor: '#9DB88D', borderRadius: 14,
        paddingHorizontal: 12, paddingVertical: 5,
    },
    badgeText: { color: 'white', fontWeight: '700', fontSize: 13 },
    card: {
        backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
    infoRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    },
    infoLabel: { fontSize: 14, color: '#6b7280' },
    infoValue: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
});
