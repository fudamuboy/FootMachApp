import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, StatusBar } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function ProfileScreen() {
    const { profile, signOut } = useAuth();
    const navigation = useNavigation();

    if (!profile) {
        return (
            <View style={styles.container}>
                <StatusBar backgroundColor="#B4C8A6" barStyle="dark-content" />
                <Text style={styles.title}>Hesabım</Text>
                <Text style={{ textAlign: 'center', color: 'black' }}>Oturum kapatıldı.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Barre de statut */}
            <StatusBar backgroundColor="#B4C8A6" barStyle="dark-content" />

            <View style={styles.header}>
                {/* Bouton Çıkış en haut à gauche */}
                <TouchableOpacity onPress={async () => {
                    await signOut();
                }}
                    style={styles.logoutIcon}>
                    <MaterialIcons name="exit-to-app" size={24} color="red" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>

                <Text style={styles.headerText}>Hesabım</Text>
            </View>

            <ImageBackground
                source={require('../assets/logos.jpg')}
                style={{ flex: 1 }}
                imageStyle={{
                    opacity: 0.09,
                    resizeMode: 'contain'
                }}
            >
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
                    <Feather name="user" size={24} color="black" />
                    <Text style={styles.itemText}>Kullanıcı Bilgilerim</Text>
                    <MaterialIcons name="navigate-next" size={24} color="black" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>

                <TouchableOpacity

                    style={styles.item}
                    onPress={() => navigation.navigate('AddressScreen')}
                >
                    <Feather name="map-pin" size={24} color="black" />
                    <Text style={styles.itemText}>Adres Bilgilerim</Text>
                    <MaterialIcons name="navigate-next" size={24} color="black" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
                {/* Ce bouton est désormais remplacé par l’icône en haut */}
                {/* Tu peux le supprimer si tu veux */}
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#B4C8A6',
        paddingTop: 40,
        paddingBottom: 40,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoutIcon: {
        marginRight: 10,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1A1A',
        textAlign: 'center',
        flex: 1, // pour centrer le texte entre les bords
        marginRight: 24, // pour équilibrer l'espace à droite
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 30,
        paddingTop: 30,
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
        paddingHorizontal: 20,
    },
    itemText: {
        fontSize: 16,
        marginLeft: 12,
    },
});
