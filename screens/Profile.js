import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, StatusBar, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { SvgUri } from 'react-native-svg';
import api from '../lib/api';

export default function ProfileScreen() {
    const { profile, signOut, fetchProfile } = useAuth();
    const navigation = useNavigation();
    const { t } = useTranslation();

    // Avatar state
    const [modalVisible, setModalVisible] = React.useState(false);
    const [selectedStyle, setSelectedStyle] = React.useState('initials');
    const [selectedSeed, setSelectedSeed] = React.useState('User');
    const [saving, setSaving] = React.useState(false);

    const AVATAR_STYLES = ['initials', 'avataaars', 'bottts', 'lorelei', 'pixel-art', 'fun-emoji'];

    React.useEffect(() => {
        if (profile) {
            setSelectedStyle(profile.avatar_style || 'initials');
            setSelectedSeed(profile.avatar_seed || profile.username || 'User');
        }
    }, [profile, modalVisible]);

    const handleSaveAvatar = async () => {
        setSaving(true);
        try {
            await api.put('/auth/profile', {
                avatar_style: selectedStyle,
                avatar_seed: selectedSeed
            });
            if (fetchProfile) await fetchProfile();
            setModalVisible(false);
        } catch (error) {
            console.error('Error saving avatar:', error);
            alert(t('profile.errorUpdate'));
        } finally {
            setSaving(false);
        }
    };

    const getAvatarUrl = (style, seed) => {
        return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed || 'User')}`;
    };

    if (!profile) {
        return (
            <View style={styles.container}>
                <StatusBar backgroundColor="#B4C8A6" barStyle="dark-content" />
                <Text style={styles.title}>{t('profile.title')}</Text>
                <Text style={{ textAlign: 'center', color: 'black' }}>{t('profile.logout')}</Text>
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

                <Text style={styles.headerText}>{t('profile.title')}</Text>
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
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.avatarWrapper}>
                        <SvgUri
                            width="90"
                            height="90"
                            uri={getAvatarUrl(profile?.avatar_style || 'initials', profile?.avatar_seed || profile?.username || 'User')}
                        />
                        <View style={styles.editBadge}>
                            <Feather name="edit-2" size={12} color="white" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.name}>{profile?.username}</Text>
                    {(profile?.position || profile?.preferred_foot) && (
                        <View style={styles.footballBadgeRow}>
                            {profile?.position && (
                                <View style={styles.footballBadge}>
                                    <Text style={styles.footballBadgeText}>⚽ {profile.position}</Text>
                                </View>
                            )}
                            {profile?.preferred_foot && (
                                <View style={styles.footballBadge}>
                                    <Text style={styles.footballBadgeText}>🦶 {profile.preferred_foot}</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.item}
                    onPress={() => navigation.navigate('UserInfoScreen')}
                >
                    <Feather name="user" size={24} color="black" />
                    <Text style={styles.itemText}>{t('profile.userInfo')}</Text>
                    <MaterialIcons name="navigate-next" size={24} color="black" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.item}
                    onPress={() => navigation.navigate('FootballProfileScreen')}
                >
                    <Feather name="target" size={24} color="black" />
                    <Text style={styles.itemText}>{t('profile.footballInfo')}</Text>
                    <MaterialIcons name="navigate-next" size={24} color="black" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
                {/* Avatar Selection Modal */}
                <Modal visible={modalVisible} animationType="slide" transparent={true}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{t('profile.editAvatar')}</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Feather name="x" size={24} color="black" />
                                </TouchableOpacity>
                            </View>

                            {/* Live Preview */}
                            <View style={styles.previewContainer}>
                                <SvgUri
                                    width="120"
                                    height="120"
                                    uri={getAvatarUrl(selectedStyle, selectedSeed)}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.randomButton}
                                onPress={() => setSelectedSeed(Math.random().toString(36).substring(7))}
                            >
                                <Feather name="refresh-cw" size={16} color="white" />
                                <Text style={styles.randomButtonText}>{t('profile.randomize')}</Text>
                            </TouchableOpacity>

                            <Text style={styles.sectionTitle}>{t('profile.styleSelection')}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleList}>
                                {AVATAR_STYLES.map(style => (
                                    <TouchableOpacity
                                        key={style}
                                        style={[styles.styleOption, selectedStyle === style && styles.styleOptionSelected]}
                                        onPress={() => setSelectedStyle(style)}
                                    >
                                        <SvgUri
                                            width="50"
                                            height="50"
                                            uri={getAvatarUrl(style, selectedSeed)}
                                        />
                                        <Text style={[styles.styleOptionText, selectedStyle === style && styles.styleOptionTextSelected]}>
                                            {style === 'initials' ? t('profile.initials') : style}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSaveAvatar}
                                disabled={saving}
                            >
                                {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>{t('profile.save')}</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
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
    footballBadgeRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    footballBadge: {
        backgroundColor: '#9DB88D',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    footballBadgeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 13,
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
    avatarWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#9DB88D',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: 450,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    previewContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    randomButton: {
        flexDirection: 'row',
        backgroundColor: '#cbd5e1',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignSelf: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    randomButtonText: {
        color: '#475569',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        color: '#334155',
    },
    styleList: {
        flexGrow: 0,
        marginBottom: 24,
    },
    styleOption: {
        alignItems: 'center',
        marginRight: 16,
        padding: 8,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    styleOptionSelected: {
        borderColor: '#9DB88D',
        backgroundColor: '#f0fdf4',
    },
    styleOptionText: {
        marginTop: 8,
        fontSize: 12,
        color: '#64748b',
    },
    styleOptionTextSelected: {
        color: '#9DB88D',
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: '#9DB88D',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
