import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

export default function ResetPasswordScreen({ navigation }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleUpdatePassword = async () => {
        if (!password || !confirmPassword) {
            Alert.alert('Erreur', 'Veuillez remplir les deux champs.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
            return;
        }

        const { error } = await supabase.auth.updateUser({
            password: password,
        });

        if (error) {
            Alert.alert('Erreur', error.message);
        } else {
            Alert.alert('Succès', 'Mot de passe mis à jour.');
            navigation.navigate('Auth'); // retour à la connexion
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                placeholder="Nouveau mot de passe"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={styles.input}
            />
            <TextInput
                placeholder="Confirmer le mot de passe"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
            />
            <Button title="Mettre à jour" onPress={handleUpdatePassword} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    input: { borderWidth: 1, padding: 8, marginBottom: 10 },
});
