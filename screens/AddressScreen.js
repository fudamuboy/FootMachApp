import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, StyleSheet,
    TouchableOpacity, Alert, Platform, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddressScreen() {
    const navigation = useNavigation();
    const { profile } = useAuth();
    const [address, setAddress] = useState('');

    useEffect(() => {
        if (profile?.address) {
            setAddress(profile.address);
        }
    }, [profile]);

    const handleSave = async () => {
        try {
            await api.put('/user/profile', { address });
            Alert.alert('Başarılı', 'Adres kaydedildi.');
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert('Hata', 'Adres güncellenemedi.');
        }
    };

    return (
        <SafeAreaView style={styles.safeContainer}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Adres Bilgilerim</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.label}>Bölge:</Text>
                    <Text style={styles.value}>{profile?.region || 'Belirtilmemiş'}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Adres:</Text>
                    <TextInput
                        style={styles.input}
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Adresinizi girin"
                        multiline
                    />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleSave}>
                    <Text style={styles.buttonText}>Kaydet</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 10 : 0, // petit padding en haut si Android
        marginBottom: 12,
    },
    backButton: {
        marginRight: 10,
        padding: 4,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 6,
    },
    value: {
        fontSize: 16,
        color: '#374151',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 10,
        minHeight: 80,
        textAlignVertical: 'top',
        backgroundColor: '#fff',
    },
    button: {
        backgroundColor: '#3b82f6',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
