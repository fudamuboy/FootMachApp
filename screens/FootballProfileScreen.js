import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, Platform, StatusBar, Alert, ScrollView, ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import FootballPill from '../components/profile/FootballPill';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../constants/theme';

const POSITIONS = ['GK', 'LB', 'CB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
const FEET = ['Right', 'Left', 'Both'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Pro'];
const STYLES = ['Attacker', 'Defender', 'Playmaker', 'Box-to-Box', 'Speedster'];

const PillSection = ({ title, options, selected, onSelect, icon }) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Feather name={icon} size={18} color="#4CAF50" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={styles.pillContainer}>
            {options.map(opt => {
                const label = typeof opt === 'object' ? opt.label : opt;
                const value = typeof opt === 'object' ? opt.value : opt;
                return (
                    <FootballPill 
                        key={value} 
                        label={label} 
                        selected={selected === value} 
                        onSelect={() => onSelect(selected === value ? null : value)} 
                    />
                );
            })}
        </View>
    </View>
);

export default function FootballProfileScreen() {
    const navigation = useNavigation();
    const { profile, fetchProfile } = useAuth();
    const { t } = useTranslation();

    const [position, setPosition]               = useState(null);
    const [secondaryPosition, setSecondaryPosition] = useState(null);
    const [preferredFoot, setPreferredFoot]     = useState(null);
    const [skillLevel, setSkillLevel]           = useState(null);
    const [playingStyle, setPlayingStyle]       = useState(null);
    const [loading, setLoading]                 = useState(false);

    useEffect(() => {
        if (profile) {
            setPosition(profile.position || null);
            setPreferredFoot(profile.preferred_foot || null);
            setSecondaryPosition(profile.secondary_position || null);
            setSkillLevel(profile.skill_level || null);
            setPlayingStyle(profile.playing_style || null);
        }
    }, [profile]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.put('/auth/profile', {
                position: position || null,
                preferred_foot: preferredFoot || null,
                secondary_position: secondaryPosition || null,
                skill_level: skillLevel || null,
                playing_style: playingStyle || null
            });
            Alert.alert(t('footballInfo.successTitle'), t('footballInfo.successMsg'));
            await fetchProfile();
            navigation.goBack();
        } catch (error) {
            Alert.alert(t('footballInfo.errorTitle'), t('footballInfo.errorMsg'));
            console.error(error);
        }
        setLoading(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('footballInfo.title')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.introCard}>
                    <Text style={styles.introText}>{t('footballInfo.desc')}</Text>
                </View>

                <PillSection 
                    title={t('footballInfo.position')} 
                    options={POSITIONS} 
                    selected={position} 
                    onSelect={setPosition}
                    icon="crosshair"
                />

                <PillSection 
                    title={t('footballInfo.secondaryPosition')} 
                    options={POSITIONS} 
                    selected={secondaryPosition} 
                    onSelect={setSecondaryPosition}
                    icon="layers"
                />

                <PillSection 
                    title={t('footballInfo.strongFoot')} 
                    options={FEET.map(f => ({
                        value: f,
                        label: t(`footballInfo.foot${f}`)
                    }))} 
                    selected={preferredFoot} 
                    onSelect={(val) => setPreferredFoot(val)}
                    icon="zap"
                />

                <PillSection 
                    title={t('footballInfo.skillLevel')} 
                    options={LEVELS.map(l => ({
                        value: l,
                        label: t(`footballInfo.level${l}`)
                    }))} 
                    selected={skillLevel} 
                    onSelect={setSkillLevel}
                    icon="trending-up"
                />

                <PillSection 
                    title={t('footballInfo.playingStyle')} 
                    options={STYLES.map(s => ({
                        value: s,
                        label: t(`footballInfo.style${s.replace(/-/g, '')}`)
                    }))} 
                    selected={playingStyle} 
                    onSelect={setPlayingStyle}
                    icon="map"
                />

                <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={handleSave} 
                    disabled={loading}
                >
                    <LinearGradient
                        colors={[THEME.primary, THEME.dark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradient}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.saveText}>{t('footballInfo.save')}</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    backButton: {
        padding: 8,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    introCard: {
        backgroundColor: '#E8F5E9',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    introText: {
        fontSize: 14,
        color: '#2E7D32',
        textAlign: 'center',
        fontWeight: '500',
    },
    section: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionIcon: {
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    pillContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    saveButton: {
        marginTop: 10,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    gradient: {
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
