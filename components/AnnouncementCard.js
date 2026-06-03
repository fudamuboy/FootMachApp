import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Users, Clock, MapPin, MessageCircle, MoreVertical } from 'lucide-react-native';
import { THEME } from '../constants/theme';
import ReportBlockModal from './ReportBlockModal';
import { rs, isTablet } from '../constants/responsive';

const FORMAT_EMOJI = { '5v5': '5️⃣', '7v7': '7️⃣', '11v11': '🏟️' };
const SKILL_COLOR = { 'Başlangıç': '#10b981', 'Orta': '#f59e0b', 'Rekabetçi': '#ef4444' };

const AnnouncementCard = ({ announcement, onContact, isOwner, onEvaluate, onBoost, onRefresh }) => {
    const [showOptions, setShowOptions] = useState(false);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isPastMatch = new Date(announcement.match_time) < new Date();

    return (
        <View style={styles.card}>
            {/* Header row: team name + evaluate button */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={styles.teamName}>{announcement.team_name}</Text>
                    {announcement.is_boosted && (
                        <View style={styles.boostBadge}>
                            <Text style={styles.boostBadgeText}>⚡ ÖNE ÇIKAN</Text>
                        </View>
                    )}
                </View>
                {!isOwner && isPastMatch && (
                    <TouchableOpacity onPress={() => onEvaluate(announcement)}>
                        <Text style={styles.evaluateButton}>Değerlendir ⭐</Text>
                    </TouchableOpacity>
                )}
                {!isOwner && (
                    <TouchableOpacity onPress={() => setShowOptions(true)} style={{ marginLeft: rs(8) }}>
                        <MoreVertical size={rs(20)} color="#6b7280" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Badge row: format, skill, fee */}
            <View style={styles.badgeRow}>
                {announcement.match_format && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {FORMAT_EMOJI[announcement.match_format] || '⚽'} {announcement.match_format}
                        </Text>
                    </View>
                )}
                {announcement.skill_level && (
                    <View style={[styles.badge, { backgroundColor: SKILL_COLOR[announcement.skill_level] + '20', borderColor: SKILL_COLOR[announcement.skill_level] }]}>
                        <Text style={[styles.badgeText, { color: SKILL_COLOR[announcement.skill_level] }]}>
                            🏆 {announcement.skill_level}
                        </Text>
                    </View>
                )}
                {announcement.match_fee === 'paid' ? (
                    <View style={[styles.badge, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
                        <Text style={[styles.badgeText, { color: '#92400e' }]}>💰 Ücretli</Text>
                    </View>
                ) : (
                    <View style={[styles.badge, { backgroundColor: '#d1fae5', borderColor: '#10b981' }]}>
                        <Text style={[styles.badgeText, { color: '#065f46' }]}>🆓 Ücretsiz</Text>
                    </View>
                )}
            </View>

            {/* Detail rows */}
            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Users size={rs(16)} color="#3b82f6" />
                    <Text style={styles.detailText}>
                        {announcement.players_needed} oyuncu aranıyor
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Clock size={rs(16)} color="#10b981" />
                    <Text style={styles.detailText}>{formatDate(announcement.match_time)}</Text>
                </View>
                <View style={styles.detailRow}>
                    <MapPin size={rs(16)} color="#ef4444" />
                    <Text style={styles.detailText}>{announcement.location}</Text>
                </View>
            </View>

            {announcement.description && (
                <Text style={styles.description}>{announcement.description}</Text>
            )}

            {!isOwner && (
                <TouchableOpacity
                    style={styles.contactButton}
                    onPress={() => onContact(announcement)}
                >
                    <MessageCircle size={rs(18)} color="white" />
                    <Text style={styles.contactButtonText}>Ekibiyle iletişime geç</Text>
                </TouchableOpacity>
            )}

            {isOwner && !isPastMatch && !announcement.is_boosted && (
                <TouchableOpacity
                    style={styles.boostButton}
                    onPress={() => onBoost && onBoost(announcement)}
                >
                    <Text style={styles.boostButtonText}>⭐ İlanını 3 kat daha fazla göster (Ücretsiz)</Text>
                </TouchableOpacity>
            )}

            <ReportBlockModal 
                visible={showOptions}
                onClose={() => setShowOptions(false)}
                targetId={announcement.id}
                targetType="announcement"
                targetUserId={announcement.user_id}
                onBlockSuccess={onRefresh}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: rs(16),
        padding: rs(16),
        marginBottom: rs(14),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        width: isTablet ? '100%' : 'auto',
        maxWidth: isTablet ? 800 : '100%',
        alignSelf: isTablet ? 'center' : 'stretch',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: rs(10),
    },
    teamName: {
        fontSize: rs(18),
        fontWeight: 'bold',
        color: '#1f2937',
        flex: 1,
    },
    evaluateButton: {
        color: THEME.primary,
        fontWeight: 'bold',
        fontSize: rs(13),
        marginLeft: rs(8),
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: rs(6),
        marginBottom: rs(12),
    },
    badge: {
        paddingHorizontal: rs(10),
        paddingVertical: rs(4),
        borderRadius: rs(12),
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#f3f4f6',
    },
    badgeText: {
        fontSize: rs(12),
        fontWeight: '600',
        color: '#374151',
    },
    details: { marginBottom: rs(12) },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: rs(6),
    },
    detailText: {
        marginLeft: rs(8),
        color: '#6b7280',
        fontSize: rs(13),
        flex: 1,
    },
    description: {
        color: '#374151',
        fontSize: rs(13),
        lineHeight: rs(19),
        marginBottom: rs(12),
        fontStyle: 'italic',
    },
    contactButton: {
        backgroundColor: THEME.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: rs(11),
        borderRadius: rs(12),
    },
    contactButtonText: {
        color: 'white',
        fontSize: rs(15),
        fontWeight: '600',
        marginLeft: rs(8),
    },
    boostButton: {
        backgroundColor: '#fef3c7',
        borderWidth: 1,
        borderColor: '#f59e0b',
        paddingVertical: rs(10),
        borderRadius: rs(12),
        alignItems: 'center',
        marginTop: rs(4),
    },
    boostButtonText: {
        color: '#92400e',
        fontSize: rs(14),
        fontWeight: 'bold',
    },
    boostBadge: {
        backgroundColor: '#fef3c7',
        paddingHorizontal: rs(6),
        paddingVertical: rs(2),
        borderRadius: rs(4),
        marginLeft: rs(8),
    },
    boostBadgeText: {
        fontSize: rs(10),
        fontWeight: 'bold',
        color: '#d97706',
    },
});

export default AnnouncementCard;
