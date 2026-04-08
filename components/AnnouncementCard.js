import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Users, Clock, MapPin, MessageCircle } from 'lucide-react-native';

const FORMAT_EMOJI = { '5v5': '5️⃣', '7v7': '7️⃣', '11v11': '🏟️' };
const SKILL_COLOR = { 'Başlangıç': '#10b981', 'Orta': '#f59e0b', 'Rekabetçi': '#ef4444' };

const AnnouncementCard = ({ announcement, onContact, isOwner, onEvaluate }) => {
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
                    <Users size={16} color="#3b82f6" />
                    <Text style={styles.detailText}>
                        {announcement.players_needed} oyuncu aranıyor
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Clock size={16} color="#10b981" />
                    <Text style={styles.detailText}>{formatDate(announcement.match_time)}</Text>
                </View>
                <View style={styles.detailRow}>
                    <MapPin size={16} color="#ef4444" />
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
                    <MessageCircle size={18} color="white" />
                    <Text style={styles.contactButtonText}>Ekibiyle iletişime geç</Text>
                </TouchableOpacity>
            )}

            {isOwner && !isPastMatch && !announcement.is_boosted && (
                <TouchableOpacity
                    style={styles.boostButton}
                    onPress={() => onBoost && onBoost(announcement)}
                >
                    <Text style={styles.boostButtonText}>⚡ İlanı Öne Çıkar (Reklam İzle)</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    teamName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        flex: 1,
    },
    evaluateButton: {
        color: '#9DB88D',
        fontWeight: 'bold',
        fontSize: 13,
        marginLeft: 8,
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#f3f4f6',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
    details: { marginBottom: 12 },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailText: {
        marginLeft: 8,
        color: '#6b7280',
        fontSize: 13,
        flex: 1,
    },
    description: {
        color: '#374151',
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 12,
        fontStyle: 'italic',
    },
    contactButton: {
        backgroundColor: '#9DB88D',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 11,
        borderRadius: 12,
    },
    contactButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 8,
    },
    boostButton: {
        backgroundColor: '#fef3c7',
        borderWidth: 1,
        borderColor: '#f59e0b',
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 4,
    },
    boostButtonText: {
        color: '#92400e',
        fontSize: 14,
        fontWeight: 'bold',
    },
    boostBadge: {
        backgroundColor: '#fef3c7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    boostBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#d97706',
    },
});

export default AnnouncementCard;
