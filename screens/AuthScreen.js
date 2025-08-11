import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert, Modal
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, MapPin, Eye, EyeOff } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { getAllCities, getRegionsByCity } from '../lib/cities';

export default function AuthScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [region, setRegion] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('')

    const { signIn, signUp } = useAuth();
    const navigation = useNavigation()

    // Obtenir toutes les villes
    const cities = getAllCities();

    // Obtenir les régions de la ville sélectionnée
    const regions = selectedCity ? getRegionsByCity(selectedCity) : [];

    const handleSubmit = async () => {
        if (!email || !password) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        if (!isLogin && (!displayName || !selectedCity || !region)) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                await signIn(email, password);
            } else {
                await signUp(email, password, displayName, selectedCity, region, phoneNumber);
                Alert.alert("✅ Kayıt başarılı", "Şimdi giriş yapabilirsiniz.");
                navigation.navigate('Auth'); // 🔁 Redirection
            }
        } catch (error) {
            if (error.message.includes("User already registered")) {
                setError("Bu e-posta adresi zaten kullanılıyor.");
            } else {
                setError(error.message || "Une erreur est survenue");
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!resetEmail || !resetEmail.trim()) {
            Alert.alert('Erreur', 'Lütfen e-postanızı girin.');
            return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
            redirectTo: 'https://sifre-reset.netlify.app/'
        });

        if (error) {
            console.error('Erreur de réinitialisation :', error.message);
            Alert.alert('Erreur', error.message);
        } else {
            console.log('Email de réinitialisation envoyé');
            Alert.alert('başarılı', 'Sıfırlama e-postası gönderildi.');
            setShowResetModal(false);
        }
    };




    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.header}>
                <View style={styles.logo}>
                    <Text style={styles.logoText}>⚽</Text>
                </View>
                <Text style={styles.title}>Rakibim</Text>
                <Text style={styles.subtitle}>İlk golü yiyen bip'i giyer </Text>
            </View>

            <View style={styles.form}>
                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <View style={styles.inputContainer}>
                    <Mail size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Lock size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                        style={[styles.input, { paddingRight: 50 }]}
                        placeholder="Şifre"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                    />


                    <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? (
                            <EyeOff size={20} color="#666" />
                        ) : (
                            <Eye size={20} color="#666" />
                        )}
                    </TouchableOpacity>

                </View>
                {isLogin && (
                    <TouchableOpacity onPress={() => setShowResetModal(true)}>
                        <Text style={{ color: '#3b82f6', textAlign: 'right', marginBottom: 10 }}>
                            Şifremi unuttum
                        </Text>
                    </TouchableOpacity>
                )}
                {!isLogin && (
                    <>
                        <View style={styles.inputContainer}>
                            <User size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Adiniz"
                                value={displayName}
                                onChangeText={setDisplayName}
                            />
                        </View>
                        <View style={styles.phoneContainer}>
                            <Text style={styles.countryCode}>+90</Text>
                            <TextInput
                                style={styles.phoneInput}
                                placeholder="5XX XXX XX XX"
                                keyboardType="phone-pad"
                                maxLength={10} // pour ne saisir que 10 chiffres
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <MapPin size={20} color="#666" style={styles.inputIcon} />
                            <Picker
                                selectedValue={selectedCity}
                                onValueChange={(value) => {
                                    setSelectedCity(value);
                                    setRegion(''); // Réinitialiser la région quand la ville change
                                }}
                                style={styles.picker}
                            >
                                <Picker.Item label="Şehir seçin" value="" />
                                {cities.map((city) => (
                                    <Picker.Item key={city} label={city} value={city} />
                                ))}
                            </Picker>
                        </View>

                        <View style={styles.inputContainer}>
                            <MapPin size={20} color="#666" style={styles.inputIcon} />
                            <Picker
                                selectedValue={region}
                                onValueChange={setRegion}
                                style={styles.picker}
                            >
                                <Picker.Item label="Bölgenizi seçin" value="" />
                                {regions.map((r) => (
                                    <Picker.Item key={r} label={r} value={r} />
                                ))}
                            </Picker>
                        </View>
                    </>
                )}

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.submitButtonText}>
                            {isLogin ? 'Oturum aç' : 'Kayit olun'}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.switchButton}
                    onPress={() => {
                        setIsLogin(!isLogin);
                        setError(null);
                    }}
                >
                    <Text style={styles.switchButtonText}>
                        {isLogin
                            ? 'Henüz hesap yok mu? kayıt olun'
                            : 'Zaten bir hesap mı? Oturum aç'}
                    </Text>
                </TouchableOpacity>
            </View>
            <Modal visible={showResetModal} animationType="slide" transparent={true}>
                <View style={{
                    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)'
                }}>
                    <View style={{
                        backgroundColor: 'white', padding: 20, borderRadius: 10, width: '85%'
                    }}>
                        <Text style={{ fontSize: 18, marginBottom: 10, fontWeight: 'bold' }}>
                            Şifre sıfırlama
                        </Text>

                        <TextInput
                            placeholder="E-mail adresinizi girin"
                            style={{
                                borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
                                padding: 10, marginBottom: 15
                            }}
                            value={resetEmail}
                            onChangeText={setResetEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <TouchableOpacity
                            onPress={handlePasswordReset}
                            style={{
                                backgroundColor: '#3b82f6', padding: 12,
                                borderRadius: 8, alignItems: 'center', marginBottom: 10
                            }}
                        >
                            <Text style={{ color: 'white', fontWeight: '600' }}>Sıfırlama bağlantısı gönder</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setShowResetModal(false)}
                            style={{ alignItems: 'center' }}
                        >
                            <Text style={{ color: '#3b82f6' }}>İptal</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f9ff',
    },
    contentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#9DB88D',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoText: {
        fontSize: 32,
        color: 'white',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'black',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'black',
    },
    form: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    errorContainer: {
        backgroundColor: '#fee2e2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    errorText: {
        color: '#dc2626',
        fontSize: 14,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: '#f9fafb',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#1f2937',
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        padding: 4,
    },
    picker: {
        flex: 1,
        height: 50,
    },
    submitButton: {
        backgroundColor: '#9DB88D',
        borderRadius: 12,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: 'black',
        fontSize: 16,
        fontWeight: 'bold',
    },
    switchButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    switchButtonText: {
        color: 'black',
        fontSize: 14,
        fontWeight: 'bold',
    },
    phoneContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f9fafb',
        marginBottom: 16,
    },

    countryCode: {
        marginRight: 8,
        fontSize: 16,
        color: '#1f2937',
    },

    phoneInput: {
        flex: 1,
        fontSize: 16,
        color: '#1f2937',
    },

});
