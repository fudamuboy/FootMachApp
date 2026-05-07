import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';

const TermsScreen = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();

    const Section = ({ title, content }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionContent}>{content}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('terms.title')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.intro}>{t('terms.intro')}</Text>

                <Section title={t('terms.section1')} content={t('terms.content1')} />
                <Section title={t('terms.section2')} content={t('terms.content2')} />
                <Section title={t('terms.section3')} content={t('terms.content3')} />
                <Section title={t('terms.section4')} content={t('terms.content4')} />

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
    scrollContent: {
        padding: 24,
    },
    intro: {
        fontSize: 15,
        color: '#757575',
        lineHeight: 22,
        marginBottom: 32,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    sectionContent: {
        fontSize: 15,
        color: '#424242',
        lineHeight: 22,
    },
    footer: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4CAF50',
        marginTop: 24,
        textAlign: 'center',
    },
    date: {
        fontSize: 12,
        color: '#BDBDBD',
        marginTop: 12,
        textAlign: 'center',
        marginBottom: 40,
    },
});

export default TermsScreen;
