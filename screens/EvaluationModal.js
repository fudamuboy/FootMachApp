import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function EvaluationModal({ visible, onClose, teamId }) {
    const [note, setNote] = useState('');
    const [comment, setComment] = useState('');
    const { profile } = useAuth();

    const handleSubmit = async () => {
        if (!note || !comment) {
            Alert.alert("Hata", "Lütfen not ve yorum girin.");
            return;
        }

        const { error } = await supabase
            .from('evaluations')
            .insert([{
                team_id: teamId,
                author_id: profile.id,
                author_name: profile.username,
                note: parseFloat(note),
                comment,
            }]);

        if (error) {
            Alert.alert("Hata", "Değerlendirme kaydedilemedi.");
        } else {
            Alert.alert("Başarılı", "Değerlendirme gönderildi.");
            setNote('');
            setComment('');
            onClose();
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Text style={styles.title}>Takımı Değerlendir</Text>

                    <TextInput
                        placeholder="Puan (1-5)"
                        keyboardType="numeric"
                        value={note}
                        onChangeText={setNote}
                        style={styles.input}
                    />

                    <TextInput
                        placeholder="Yorumunuzu yazın"
                        multiline
                        value={comment}
                        onChangeText={setComment}
                        style={[styles.input, { height: 100 }]}
                    />

                    <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                        <Text style={styles.buttonText}>Gönder</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                        <Text style={styles.cancelText}>İptal</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: '#00000088',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modal: {
        backgroundColor: '#fff',
        width: '85%',
        padding: 20,
        borderRadius: 10
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        marginBottom: 15
    },
    button: {
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center'
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold'
    },
    cancelButton: {
        marginTop: 10,
        alignItems: 'center'
    },
    cancelText: {
        color: '#ef4444',
        fontWeight: '600'
    }
});
