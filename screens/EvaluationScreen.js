import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

export default function EvaluationScreen() {
    const route = useRoute();
    const navigation = useNavigation();

    const { announcementId, teamName } = route.params;

    const [rating, setRating] = useState('');
    const [comment, setComment] = useState('');

    const handleSubmit = async () => {
        const numericNote = parseFloat(note);
        if (isNaN(numericNote) || numericNote < 1 || numericNote > 5) {
            Alert.alert("Hata", "Lütfen 1 ile 5 arasında bir not girin.");
            return;
        }


        const { error } = await supabase.from('evaluations').insert({
            announcement_id: announcementId,
            rating: numericRating,
            comment,
        });

        if (error) {
            console.error(error);
            Alert.alert('Hata', 'Değerlendirme gönderilemedi.');
        } else {
            Alert.alert('Başarılı', 'Teşekkürler! Değerlendirmeniz kaydedildi.');
            navigation.goBack();
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{teamName} Takımını Değerlendir</Text>

            <TextInput
                style={styles.input}
                placeholder="Puan (1-5)"
                keyboardType="numeric"
                value={rating}
                onChangeText={setRating}
            />

            <TextInput
                style={[styles.input, { height: 100 }]}
                placeholder="Yorum (isteğe bağlı)"
                multiline
                value={comment}
                onChangeText={setComment}
            />

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Gönder</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f9fafb',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 10,
        marginBottom: 16,
        backgroundColor: 'white',
    },
    button: {
        backgroundColor: '#3b82f6',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
