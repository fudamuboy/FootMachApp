import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { rs, isTablet } from '../constants/responsive';

const TermsScreen = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();

    const Section = ({ title, content }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionContent}>{content}</Text>
        </View>
    );

    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top : rs(10) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={rs(24)} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('terms.title')}</Text>
                <View style={{ width: rs(40) }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.intro}>{t('terms.intro')}</Text>

                <Section title={t('terms.section1')} content={t('terms.content1')} />
                <Section title={t('terms.section2')} content={t('terms.content2')} />
                <Section title={t('terms.section3')} content={t('terms.content3')} />
                <Section title={t('terms.section4')} content={t('terms.content4')} />
                
                {/* Community & Anti-Abuse Rules for App Store Compliance */}
                <Section title="Community & Anti-Abuse Rules" content="Dokuz On maintains a strict zero-tolerance policy against objectionable content and abusive behavior. By using this app, you agree to:
- No harassment or bullying of any kind.
- No posting of offensive, discriminatory, or sexually explicit content.
- No spam or repetitive unauthorized messages.
Abusive users will be banned immediately, and any offensive content will be removed. You can report and block users at any time using the in-app tools." />

                <Text style={styles.footer}>{t('terms.footer')}</Text>
                <Text style={styles.date}>Last updated: May 2026</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: rs(16),
        paddingVertical: rs(12),
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: rs(18),
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    backButton: {
        padding: rs(8),
    },
    scrollContent: {
        padding: rs(24),
        width: isTablet ? '100%' : '100%',
        maxWidth: isTablet ? 700 : '100%',
        alignSelf: 'center',
    },
    intro: {
        fontSize: rs(15),
        color: '#757575',
        lineHeight: rs(22),
        marginBottom: rs(32),
    },
    section: {
        marginBottom: rs(24),
    },
    sectionTitle: {
        fontSize: rs(17),
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: rs(8),
    },
    sectionContent: {
        fontSize: rs(15),
        color: '#424242',
        lineHeight: rs(22),
    },
    footer: {
        fontSize: rs(15),
        fontWeight: '600',
        color: '#4CAF50',
        marginTop: rs(24),
        textAlign: 'center',
    },
    date: {
        fontSize: rs(12),
        color: '#BDBDBD',
        marginTop: rs(12),
        textAlign: 'center',
        marginBottom: rs(40),
    },
});

export default TermsScreen;
