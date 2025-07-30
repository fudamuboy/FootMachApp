import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
    const { profile, signOut } = useAuth();
    const navigation = useNavigation();

    // 🔐 Ajout d’une vérification : si profile est null, on ne rend rien.
    if (!profile) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.title}>Hesabım</Text>
                <Text style={{ textAlign: 'center', color: '#999' }}>Oturum kapatıldı.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Hesabım</Text>

            <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {profile?.username?.slice(0, 1)?.toUpperCase() || 'K'}
                    </Text>
                </View>
                <Text style={styles.name}>{profile?.username}</Text>
            </View>

            <TouchableOpacity
                style={styles.item}
                onPress={() => navigation.navigate('UserInfoScreen')}
            >
                <Ionicons name="person-outline" size={20} color="#000" />
                <Text style={styles.itemText}>Kullanıcı Bilgilerim</Text>
                <Ionicons name="chevron-forward" size={18} color="#aaa" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.item}
                onPress={() => navigation.navigate('AddressScreen')}
            >
                <Ionicons name="location-outline" size={20} color="#000" />
                <Text style={styles.itemText}>Adres Bilgilerim</Text>
                <Ionicons name="chevron-forward" size={18} color="#aaa" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                <Text style={styles.logoutText}>Çıkış Yap</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        alignSelf: 'center',
        marginBottom: 20,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#d1d5db',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    name: {
        fontSize: 18,
        marginTop: 10,
        fontWeight: '600',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    itemText: {
        fontSize: 16,
        marginLeft: 12,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
        justifyContent: 'center',
    },
    logoutText: {
        fontSize: 16,
        marginLeft: 8,
        color: '#ef4444',
        fontWeight: 'bold',
    },
});
