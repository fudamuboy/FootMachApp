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
    Keyboard,
    ActionSheetIOS
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Users, Clock, MapPin, FileText, Trophy, Coins } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

const CreateAnnouncement = ({ visible, onClose, onSuccess }) => {
    const { profile } = useAuth();
    const [teamName, setTeamName] = useState('');
    const [playersNeeded, setPlayersNeeded] = useState(0);
    const [matchTime, setMatchTime] = useState('');
    const [tempDate, setTempDate] = useState(null);
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [matchFormat, setMatchFormat] = useState(null); // '5v5' | '7v7' | '11v11'
    const [matchFee, setMatchFee] = useState('free');     // 'free' | 'paid'
    const [skillLevel, setSkillLevel] = useState(null);   // 'Başlangıç' | 'Orta' | 'Rekabetçi'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const showPlayersPickerIOS = () => {
        const options = ['', ...Array.from({ length: 13 }, (_, i) => `${i + 1} oyuncu aranıyor`), 'İptal'];
        const cancelButtonIndex = options.length - 1;
        ActionSheetIOS.showActionSheetWithOptions(
            { options, cancelButtonIndex, title: 'Kaç oyuncu aranıyor?' },
            (buttonIndex) => {
                if (buttonIndex === cancelButtonIndex || buttonIndex === 0) return;
                setPlayersNeeded(buttonIndex);
            }
        );
    };

    const handleSubmit = async () => {
        if (!profile || !teamName || !matchTime || !location) {
            setError('Lütfen tüm zorunlu alanları doldurun');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await api.post('/announcements', {
                team_name: teamName,
                players_needed: playersNeeded || 1,
                match_time: matchTime,
                location,
                description,
                city: profile?.city,
                region: profile?.region,
                match_format: matchFormat,
                match_fee: matchFee,
                skill_level: skillLevel,
            });

            // Reset form
            setTeamName('');
            setPlayersNeeded(0);
            setMatchTime('');
            setLocation('');
            setDescription('');
            setMatchFormat(null);
            setMatchFee('free');
            setSkillLevel(null);

            onSuccess();
            onClose();
        } catch (error) {
            setError(error.message || 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const ChipSelector = ({ label, options, selected, onSelect, icon }) => (
        <View style={styles.chipSection}>
            <View style={styles.chipLabelRow}>
                {icon}
                <Text style={styles.chipLabel}>{label}</Text>
            </View>
            <View style={styles.chipRow}>
                {options.map((opt) => (
                    <TouchableOpacity
                        key={opt.value}
                        style={[styles.chip, selected === opt.value && styles.chipSelected]}
                        onPress={() => onSelect(opt.value)}
                    >
                        <Text style={[styles.chipText, selected === opt.value && styles.chipTextSelected]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} color="#6b7280" />
                    </TouchableOpacity>
                    <Text style={styles.title}>İlan oluşturma</Text>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* Team name */}
                    <View style={styles.inputContainer}>
                        <Users size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Takımın adı"
                            value={teamName}
                            onChangeText={setTeamName}
                        />
                    </View>

                    {/* Players needed */}
                    <View style={styles.inputContainer}>
                        <Users size={20} color="#666" style={styles.inputIcon} />
                        {Platform.OS === 'ios' ? (
                            <TouchableOpacity style={{ flex: 1, height: 50, justifyContent: 'center' }} onPress={showPlayersPickerIOS}>
                                <Text style={styles.inputTextButton}>
                                    {playersNeeded > 0 ? `${playersNeeded} oyuncu aranıyor` : 'Kaç oyuncu aranıyor?'}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={{ flex: 1, height: 50, justifyContent: 'center' }} onPress={showPlayersPickerIOS}>
                                <Text style={styles.inputTextButton}>
                                    {playersNeeded > 0 ? `${playersNeeded} oyuncu aranıyor` : 'Kaç oyuncu aranıyor?'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Match time */}
                    <View style={styles.inputContainer}>
                        <Clock size={20} color="#666" style={styles.inputIcon} />
                        <TouchableOpacity
                            style={{ flex: 1 }}
                            onPress={() => { Keyboard.dismiss(); setShowDatePicker(true); }}
                        >
                            <Text style={[styles.input, { paddingTop: 14, color: matchTime ? '#1f2937' : '#9ca3af' }]}>
                                {matchTime
                                    ? new Date(matchTime).toLocaleDateString('tr-TR', {
                                        weekday: 'long', day: 'numeric',
                                        month: 'long', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })
                                    : 'Maç tarihi ve saati seç'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Date picker modal */}
                    <Modal visible={showDatePicker} transparent animationType="slide">
                        <View style={styles.pickerOverlay}>
                            <View style={styles.pickerContainer}>
                                <View style={styles.pickerHeader}>
                                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                        <Text style={styles.pickerCancel}>İptal</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.pickerTitle}>Tarih Seç</Text>
                                    <View style={{ width: 50 }} />
                                </View>
                                <DateTimePicker
                                    value={matchTime ? new Date(matchTime) : new Date()}
                                    mode="date"
                                    display="spinner"
                                    locale="tr-TR"
                                    minimumDate={new Date()}
                                    maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                                    onChange={(event, selectedDate) => {
                                        if (event.type === 'set' && selectedDate) {
                                            setTempDate(selectedDate);
                                        }
                                    }}
                                    style={{ width: '100%' }}
                                />
                                <TouchableOpacity
                                    style={styles.pickerConfirm}
                                    onPress={() => {
                                        setShowDatePicker(false);
                                        setTimeout(() => setShowTimePicker(true), 100);
                                    }}
                                >
                                    <Text style={styles.pickerConfirmText}>Saati Seç →</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* Time picker modal */}
                    <Modal visible={showTimePicker} transparent animationType="slide">
                        <View style={styles.pickerOverlay}>
                            <View style={styles.pickerContainer}>
                                <View style={styles.pickerHeader}>
                                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                                        <Text style={styles.pickerCancel}>İptal</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.pickerTitle}>Saat Seç</Text>
                                    <View style={{ width: 50 }} />
                                </View>
                                <DateTimePicker
                                    value={tempDate || new Date()}
                                    mode="time"
                                    display="spinner"
                                    locale="tr-TR"
                                    onChange={(event, selectedTime) => {
                                        if (event.type === 'set' && selectedTime) {
                                            const base = new Date(tempDate || new Date());
                                            base.setHours(selectedTime.getHours());
                                            base.setMinutes(selectedTime.getMinutes());
                                            setTempDate(base);
                                        }
                                    }}
                                    style={{ width: '100%' }}
                                />
                                <TouchableOpacity
                                    style={styles.pickerConfirm}
                                    onPress={() => {
                                        setShowTimePicker(false);
                                        if (tempDate) setMatchTime(tempDate.toISOString());
                                    }}
                                >
                                    <Text style={styles.pickerConfirmText}>Tamam ✓</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* Location */}
                    <View style={styles.inputContainer}>
                        <MapPin size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Maçın yeri (örn: Buca, İzmir)"
                            value={location}
                            onChangeText={setLocation}
                        />
                    </View>

                    {/* Description */}
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

                    {/* ⚽ Match Format */}
                    <ChipSelector
                        label="Maç Formatı"
                        icon={<Text style={{ fontSize: 16, marginRight: 6 }}>⚽</Text>}
                        options={[
                            { label: '5v5', value: '5v5' },
                            { label: '7v7', value: '7v7' },
                            { label: '11v11', value: '11v11' },
                        ]}
                        selected={matchFormat}
                        onSelect={setMatchFormat}
                    />

                    {/* 🏆 Skill Level */}
                    <ChipSelector
                        label="Seviye"
                        icon={<Trophy size={16} color="#6b7280" style={{ marginRight: 6 }} />}
                        options={[
                            { label: 'Başlangıç', value: 'Başlangıç' },
                            { label: 'Orta', value: 'Orta' },
                            { label: 'Rekabetçi', value: 'Rekabetçi' },
                        ]}
                        selected={skillLevel}
                        onSelect={setSkillLevel}
                    />

                    {/* 💰 Match Fee */}
                    <ChipSelector
                        label="Katılım Ücreti"
                        icon={<Coins size={16} color="#6b7280" style={{ marginRight: 6 }} />}
                        options={[
                            { label: '🆓 Ücretsiz', value: 'free' },
                            { label: '💰 Ücretli', value: 'paid' },
                        ]}
                        selected={matchFee}
                        onSelect={setMatchFee}
                    />

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>İptal</Text>
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
    container: { flex: 1, backgroundColor: 'white' },
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
    closeButton: { padding: 4 },
    title: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    placeholder: { width: 32 },
    form: { flex: 1, padding: 20 },
    errorContainer: {
        backgroundColor: '#fee2e2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    errorText: { color: '#dc2626', fontSize: 14, textAlign: 'center' },
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
    inputIcon: { marginRight: 12 },
    input: { flex: 1, height: 50, fontSize: 16, color: '#1f2937' },
    textArea: { height: 80, paddingTop: 12 },
    inputTextButton: { height: 50, lineHeight: 50, fontSize: 16, color: '#6b7280' },
    // Chip selectors
    chipSection: { marginBottom: 16 },
    chipLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    chipLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingVertical: 7,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#d1d5db',
        backgroundColor: '#f9fafb',
    },
    chipSelected: {
        borderColor: '#9DB88D',
        backgroundColor: '#9DB88D',
    },
    chipText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
    chipTextSelected: { color: 'white', fontWeight: '700' },
    // Buttons
    buttonContainer: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 40 },
    button: { flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    cancelButton: { backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#d1d5db' },
    cancelButtonText: { color: '#374151', fontSize: 16, fontWeight: '600' },
    submitButton: { backgroundColor: '#9DB88D' },
    submitButtonDisabled: { opacity: 0.6 },
    submitButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
    // Picker modals
    pickerOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    pickerContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 34,
        paddingHorizontal: 16,
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    pickerTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
    pickerCancel: { fontSize: 15, color: '#6b7280' },
    pickerConfirm: {
        backgroundColor: '#9DB88D',
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        marginTop: 12,
    },
    pickerConfirmText: { color: 'white', fontSize: 15, fontWeight: '700' },
});

export default CreateAnnouncement;