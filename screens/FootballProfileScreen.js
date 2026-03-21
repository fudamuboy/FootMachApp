import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, Platform, StatusBar, Alert, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

const POSITIONS = ['GK', 'DF', 'CM', 'LW', 'RW', 'ST'];
const FEET = ['Sağ', 'Sol', 'Her İkisi'];

export default function FootballProfileScreen() {
    const navigation = useNavigation();
    const { profile, fetchProfile } = useAuth();

    const [position, setPosition]       = useState(null);
    const [preferredFoot, setPreferredFoot] = useState(null);
    const [loading, setLoading]         = useState(false);

    useEffect(() => {
        if (profile) {
            setPosition(profile.position || null);
            setPreferredFoot(profile.preferred_foot || null);
        }
    }, [profile]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.put('/auth/profile', {
                position: position || null,
                preferred_foot: preferredFoot || null,
            });
            Alert.alert('Başarılı', 'Futbol bilgilerin güncellendi!');
            await fetchProfile();
        } catch (error) {
            Alert.alert('Hata', 'Bilgiler güncellenemedi.');
            console.error(error);
        }
        setLoading(false);
    };

    const ChipRow = ({ options, selected, onSelect }) => (
        <View style={styles.chipRow}>
            {options.map(opt => (
                <TouchableOpacity
                    key={opt}
                    style={[styles.chip, selected === opt && styles.chipSelected]}
                    onPress={() => onSelect(selected === opt ? null : opt)}
                >
                    <Text style={[styles.chipText, selected === opt && styles.chipTextSelected]}>
                        {opt}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>⚽ Futbol Bilgilerim</Text>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.subText}>
                        Rakiplerinizin sizi daha iyi tanımasını sağlayın.
                    </Text>

                    <Text style={styles.label}>Mevki:</Text>
                    <ChipRow options={POSITIONS} selected={position} onSelect={setPosition} />

                    <Text style={[styles.label, { marginTop: 20 }]}>Baskın Ayak:</Text>
                    <ChipRow options={FEET} selected={preferredFoot} onSelect={setPreferredFoot} />
                </View>

                <View style={styles.section}>
                    <TouchableOpacity
                        style={[styles.saveButton, loading && { opacity: 0.6 }]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Text style={styles.saveText}>
                            {loading ? 'Kaydediliyor...' : 'Kaydet'}
                        </Text>
                    </TouchableOpacity>
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
        paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
        backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
    scroll: { flex: 1 },
    section: {
        backgroundColor: 'white', marginHorizontal: 16, marginTop: 16,
        borderRadius: 12, padding: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    subText: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
    label: { fontSize: 15, fontWeight: '600', marginBottom: 10, color: '#374151' },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20,
        borderWidth: 1.5, borderColor: '#d1d5db', backgroundColor: '#f9fafb',
    },
    chipSelected: { backgroundColor: '#9DB88D', borderColor: '#9DB88D' },
    chipText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
    chipTextSelected: { color: 'white', fontWeight: '700' },
    saveButton: {
        backgroundColor: '#9DB88D', padding: 14, borderRadius: 10, alignItems: 'center',
    },
    saveText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
