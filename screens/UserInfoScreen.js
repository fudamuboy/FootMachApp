import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase'; // adapte selon ton chemin

const UserInfoScreen = () => {
    const navigation = useNavigation();
    const { profile, fetchProfile } = useAuth();

    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile) {
            setUsername(profile.username || '');
            setPhone(profile.phone || '');
            setEmail(profile.email || '');
        }
    }, [profile]);

    const handleUpdate = async () => {
        setLoading(true);
        const { error } = await supabase
            .from('profiles')
            .update({
                username,
                phone,
                email,
                updated_at: new Date(), // ajouter ça seulement si la colonne existe
            })
            .eq('id', profile.id);

        if (error) {
            Alert.alert('Hata', 'Bilgiler güncellenemedi');
            console.error(error);
        } else {
            Alert.alert('Başarılı', 'Bilgiler güncellendi');
            await fetchProfile(); // recharger les données utilisateur depuis Supabase
        }

        setLoading(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kullanıcı Bilgilerim</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>İletişim Bilgileri</Text>
                <Text style={styles.subText}>
                    Bu bilgileri değiştirebilmek için yeni e-posta adresinizi veya telefon numaranızı doğrulamanız istenebilir.
                </Text>

                <Text style={styles.label}>Cep Telefonu:</Text>
                <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                />

                <Text style={styles.label}>E-Posta:</Text>
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                />

                <Text style={styles.label}>Görüntü Adı:</Text>
                <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                />

                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleUpdate}
                    disabled={loading}
                >
                    <Text style={styles.saveText}>Bilgileri Güncelle</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteButton}>
                    <Text style={styles.deleteText}>Hesabı Sil</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};
export default UserInfoScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subText: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    saveButton: {
        backgroundColor: '#3b82f6',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    saveText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    deleteButton: {
        backgroundColor: '#ef4444',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    deleteText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
