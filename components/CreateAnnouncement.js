import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    ActivityIndicator,
    Platform,
    Keyboard
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Users, Clock, MapPin, FileText } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const CreateAnnouncement = ({ visible, onClose, onSuccess }) => {
    const { profile } = useAuth();
    const [teamName, setTeamName] = useState('');
    const [playersNeeded, setPlayersNeeded] = useState(1);
    const [matchTime, setMatchTime] = useState('');
    const [tempDate, setTempDate] = useState(null);
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const handleSubmit = async () => {
        if (!profile || !teamName || !matchTime || !location) {
            setError('Lütfen tüm zorunlu alanları doldurun');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase
                .from('announcements')
                .insert({
                    user_id: profile?.id,
                    team_name: teamName,
                    players_needed: playersNeeded,
                    match_time: matchTime,
                    location,
                    description,
                    city: profile?.city,
                    region: profile?.region,
                });

            if (error) throw error;

            setTeamName('');
            setPlayersNeeded(1);
            setMatchTime('');
            setLocation('');
            setDescription('');

            onSuccess();
            onClose();
        } catch (error) {
            setError(error.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} color="#6b7280" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Ilan oluşturma</Text>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <Users size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Takımın adı"
                            value={teamName}
                            onChangeText={setTeamName}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Users size={20} color="#666" style={styles.inputIcon} />
                        <Picker
                            selectedValue={playersNeeded}
                            onValueChange={setPlayersNeeded}
                            style={styles.picker}
                        >
                            {[...Array(11).keys()].map(i => (
                                <Picker.Item
                                    key={i + 1}
                                    label={`${i + 1} oyuncu${i > 0 ? 's' : ''} aranıyor${i > 0 ? 's' : ''}`}
                                    value={i + 1}
                                />
                            ))}
                        </Picker>
                    </View>

                    <View style={styles.inputContainer}>
                        <Clock size={20} color="#666" style={styles.inputIcon} />
                        <TouchableOpacity
                            style={{ flex: 1 }}
                            onPress={() => {
                                Keyboard.dismiss();
                                setShowDatePicker(true);
                            }}
                        >
                            <Text style={[styles.input, { paddingTop: 12 }]}>
                                {matchTime ? new Date(matchTime).toLocaleString() : 'Maç tarihi ve saati seç'}
                            </Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={matchTime ? new Date(matchTime) : new Date()}
                                mode="date"
                                display="default"
                                minimumDate={new Date()}
                                maximumDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}
                                onChange={(event, selectedDate) => {
                                    setShowDatePicker(false);
                                    if (event.type === 'set' && selectedDate) {
                                        setTempDate(selectedDate);
                                        setTimeout(() => setShowTimePicker(true), 100);
                                    }
                                }}
                            />
                        )}

                        {showTimePicker && (
                            <DateTimePicker
                                value={tempDate || new Date()}
                                mode="time"
                                display="default"
                                onChange={(event, selectedTime) => {
                                    setShowTimePicker(false);
                                    if (event.type === 'set' && selectedTime) {
                                        const finalDate = new Date(tempDate);
                                        finalDate.setHours(selectedTime.getHours());
                                        finalDate.setMinutes(selectedTime.getMinutes());
                                        setMatchTime(finalDate.toISOString());
                                    }
                                }}
                            />
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <MapPin size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Maçın yeri(örn: Buca)"
                            value={location}
                            onChangeText={setLocation}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <FileText size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Açıklama (opsiyonel)"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>iptal etmek</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.submitButtonText}>Oluştur</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    closeButton: {
        padding: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    placeholder: {
        width: 32,
    },
    form: {
        flex: 1,
        padding: 20,
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
    textArea: {
        height: 80,
        paddingTop: 12,
    },
    picker: {
        flex: 1,
        height: 50,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    button: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    cancelButtonText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#B4C8A6',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CreateAnnouncement;