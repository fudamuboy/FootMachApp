import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView, Platform, StatusBar, Alert, ActivityIndicator, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import api from '../lib/api';
import { LinearGradient } from 'expo-linear-gradient';

const ForgotPasswordScreen = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    
    const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: New Password
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendCode = async () => {
        if (!email || !email.includes('@')) {
            Alert.alert(t('userInfo.errorTitle'), t('forgotPassword.invalidEmail'));
            return;
        }

        setLoading(true);
        try {
            await api.post('auth/request-password-reset-code', { email: email.trim().toLowerCase() });
            setStep(2);
        } catch (error) {
            Alert.alert(t('userInfo.errorTitle'), error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = () => {
        if (code.length !== 6) {
            Alert.alert(t('userInfo.errorTitle'), t('forgotPassword.codeLabel'));
            return;
        }
        setStep(3);
    };

    const handleResetPassword = async () => {
        if (password.length < 6) {
            Alert.alert(t('userInfo.errorTitle'), t('resetPassword.errorTooShort'));
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert(t('userInfo.errorTitle'), t('resetPassword.errorMismatch'));
            return;
        }

        setLoading(true);
        try {
            await api.post('auth/reset-password-with-code', { 
                email: email.trim().toLowerCase(), 
                code, 
                newPassword: password 
            });
            Alert.alert(
                t('resetPassword.successTitle'),
                t('resetPassword.successDesc'),
                [{ text: 'OK', onPress: () => navigation.navigate('Auth') }]
            );
        } catch (error) {
            Alert.alert(t('userInfo.errorTitle'), error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.iconCircle}>
                            <Feather name="mail" size={40} color="#4CAF50" />
                        </View>
                        <Text style={styles.title}>{t('forgotPassword.title')}</Text>
                        <Text style={styles.description}>{t('forgotPassword.desc')}</Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('forgotPassword.emailLabel')}</Text>
                            <View style={styles.inputWrapper}>
                                <Feather name="mail" size={20} color="#9E9E9E" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="email@example.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.mainButton} onPress={handleSendCode} disabled={loading}>
                            <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.gradient}>
                                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{t('forgotPassword.sendCode')}</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                );
            case 2:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.title}>{t('forgotPassword.verifyTitle')}</Text>
                        <Text style={styles.description}>
                            {t('forgotPassword.verifyDesc')} :{"\n"}
                            <Text style={styles.emailText}>{email}</Text>
                        </Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('forgotPassword.codeLabel')}</Text>
                            <View style={styles.inputWrapper}>
                                <Feather name="hash" size={20} color="#9E9E9E" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { letterSpacing: 5, fontWeight: 'bold' }]}
                                    placeholder="000000"
                                    value={code}
                                    onChangeText={setCode}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.mainButton} onPress={handleVerifyCode}>
                            <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.gradient}>
                                <Text style={styles.buttonText}>{t('forgotPassword.verifyButton')}</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setStep(1)} style={styles.secondaryButton}>
                            <Text style={styles.secondaryButtonText}>{t('forgotPassword.changeEmail')}</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 3:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.title}>{t('resetPassword.title')}</Text>
                        <Text style={styles.description}>{t('resetPassword.desc')}</Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('resetPassword.newPasswordLabel')}</Text>
                            <View style={styles.inputWrapper}>
                                <Feather name="lock" size={20} color="#9E9E9E" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('resetPassword.confirmPasswordLabel')}</Text>
                            <View style={styles.inputWrapper}>
                                <Feather name="shield" size={20} color="#9E9E9E" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.mainButton} onPress={handleResetPassword} disabled={loading}>
                            <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.gradient}>
                                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{t('resetPassword.confirmButton')}</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('forgotPassword.title')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {renderStep()}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

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
    backBtn: {
        padding: 8,
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 30,
        paddingBottom: 40,
    },
    stepContainer: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#757575',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    emailText: {
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    inputGroup: {
        width: '100%',
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#424242',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1A1A1A',
    },
    mainButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 10,
        elevation: 5,
        shadowColor: '#4CAF50',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    gradient: {
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        marginTop: 20,
        padding: 10,
    },
    secondaryButtonText: {
        color: '#4CAF50',
        fontWeight: 'bold',
        fontSize: 15,
    }
});

export default ForgotPasswordScreen;
