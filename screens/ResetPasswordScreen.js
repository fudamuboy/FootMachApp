import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase'; // ajuste le chemin selon ton projet

export default function ResetPasswordScreen({ navigation }) {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [accessToken, setAccessToken] = useState(null);

    useEffect(() => {
        const getAccessToken = async () => {
            const initialUrl = await Linking.getInitialURL();

            if (initialUrl) {
                const parsed = Linking.parse(initialUrl);
                const token = parsed.queryParams?.access_token;
                if (token) {
                    setAccessToken(token);
                } else {
                    Alert.alert('Erreur', 'Jeton non trouvé dans le lien.');
                }
            }
        };

        getAccessToken();
    }, []);

    const handleResetPassword = async () => {
        if (!password || password.length < 6) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }

        setLoading(true);

        const { data, error } = await supabase.auth.updateUser(
            { password },
            {
                accessToken: accessToken,
            }
        );

        setLoading(false);

        if (error) {
            Alert.alert('Erreur', error.message);
        } else {
            Alert.alert('Succès', 'Votre mot de passe a été réinitialisé.', [
                { text: 'OK', onPress: () => navigation.navigate('Auth') }
            ]);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Réinitialiser le mot de passe</Text>

            <TextInput
                placeholder="Nouveau mot de passe"
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword}
            />

            <TouchableOpacity
                style={styles.button}
                onPress={handleResetPassword}
                disabled={loading || !accessToken}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Changer le mot de passe</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#f9f9f9',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 20,
        backgroundColor: '#fff',
    },
    button: {
        backgroundColor: '#007bff',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
