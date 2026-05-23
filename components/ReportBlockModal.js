import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    ActivityIndicator,
    Alert
} from 'react-native';
import { X, Flag, UserX, AlertTriangle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { THEME } from '../constants/theme';

/**
 * ReportBlockModal
 * A reusable modal for reporting content and blocking users.
 * 
 * Props:
 * - visible (boolean)
 * - onClose (function)
 * - targetId (string): The ID of the item being reported or blocked
 * - targetType (string): 'user', 'announcement', 'chat'
 * - targetUserId (string): The ID of the user to block (if different from targetId)
 * - onBlockSuccess (function): Callback after successful block
 */
export default function ReportBlockModal({
    visible,
    onClose,
    targetId,
    targetType,
    targetUserId,
    onBlockSuccess
}) {
    const { t } = useTranslation();
    const [mode, setMode] = useState('menu'); // 'menu', 'report', 'block'
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleClose = () => {
        setMode('menu');
        setReason('');
        onClose();
    };

    const submitReport = async () => {
        if (!reason.trim()) {
            Alert.alert(t('errors.title'), t('moderation.provideReason'));
            return;
        }
        
        setLoading(true);
        try {
            await api.post('/reports', {
                reported_item_id: targetId,
                item_type: targetType,
                reason: reason.trim()
            });
            Alert.alert(t('moderation.success'), t('moderation.reportSuccess'));
            handleClose();
        } catch (error) {
            console.error("Report error:", error);
            Alert.alert(t('errors.title'), t('moderation.reportError'));
        } finally {
            setLoading(false);
        }
    };

    const submitBlock = async () => {
        const idToBlock = targetUserId || targetId;
        if (!idToBlock) return;

        setLoading(true);
        try {
            await api.post('/blocks', {
                blocked_id: idToBlock
            });
            Alert.alert(t('moderation.success'), t('moderation.blockSuccess'));
            handleClose();
            if (onBlockSuccess) onBlockSuccess();
        } catch (error) {
            console.error("Block error:", error);
            Alert.alert(t('errors.title'), t('moderation.blockError'));
        } finally {
            setLoading(false);
        }
    };

    const renderMenu = () => (
        <>
            <Text style={styles.modalTitle}>{t('moderation.options')}</Text>
            
            <TouchableOpacity style={styles.actionButton} onPress={() => setMode('report')}>
                <Flag size={20} color="#eab308" style={styles.actionIcon} />
                <Text style={styles.actionText}>{t('moderation.report')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => setMode('block')}>
                <UserX size={20} color="#ef4444" style={styles.actionIcon} />
                <Text style={[styles.actionText, { color: '#ef4444' }]}>{t('moderation.blockUser')}</Text>
            </TouchableOpacity>
        </>
    );

    const renderReport = () => (
        <>
            <Text style={styles.modalTitle}>{t('moderation.report')}</Text>
            <Text style={styles.description}>
                {t('moderation.reportDesc')}
            </Text>
            <TextInput
                style={styles.input}
                placeholder={t('moderation.reportPlaceholder')}
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
            />
            <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setMode('menu')}>
                    <Text style={styles.cancelButtonText}>{t('moderation.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.button, styles.submitButton]} 
                    onPress={submitReport}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.submitButtonText}>{t('moderation.submit')}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </>
    );

    const renderBlock = () => (
        <>
            <View style={styles.warningHeader}>
                <AlertTriangle size={24} color="#ef4444" />
                <Text style={styles.modalTitle}>{t('moderation.blockUser')}</Text>
            </View>
            <Text style={styles.description}>
                {t('moderation.blockWarning')}
            </Text>
            <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setMode('menu')}>
                    <Text style={styles.cancelButtonText}>{t('moderation.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.button, styles.blockButton]} 
                    onPress={submitBlock}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.submitButtonText}>{t('moderation.block')}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </>
    );

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                        <X size={24} color="#6b7280" />
                    </TouchableOpacity>

                    {mode === 'menu' && renderMenu()}
                    {mode === 'report' && renderReport()}
                    {mode === 'block' && renderBlock()}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: THEME.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: THEME.border,
    },
    actionIcon: {
        marginRight: 12,
    },
    actionText: {
        fontSize: 16,
        fontWeight: '500',
        color: THEME.text,
    },
    description: {
        fontSize: 14,
        color: THEME.subtext,
        marginBottom: 16,
        lineHeight: 20,
    },
    input: {
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        minHeight: 100,
        marginBottom: 16,
        color: THEME.text,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#e5e7eb',
    },
    cancelButtonText: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 15,
    },
    submitButton: {
        backgroundColor: THEME.primary,
    },
    blockButton: {
        backgroundColor: '#ef4444',
    },
    submitButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 15,
    },
    warningHeader: {
        alignItems: 'center',
        marginBottom: 8,
    }
});
