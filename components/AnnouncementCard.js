import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Users, Clock, MapPin, MessageCircle } from 'lucide-react-native';

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
            <View style={styles.header}>
                <Text style={styles.teamName}>{announcement.team_name}</Text>

                {/* Montrer le bouton Takımı Değerlendir seulement si ce n’est PAS le propriétaire et que le match est passé */}
                {!isOwner && isPastMatch && (
                    <TouchableOpacity onPress={() => onEvaluate(announcement)}>
                        <Text style={styles.evaluateButton}>Takımı Değerlendir</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Users size={18} color="#3b82f6" />
                    <Text style={styles.detailText}>
                        {announcement.players_needed} oyuncu aranıyor
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Clock size={18} color="#10b981" />
                    <Text style={styles.detailText}>{formatDate(announcement.match_time)}</Text>
                </View>

                <View style={styles.detailRow}>
                    <MapPin size={18} color="#ef4444" />
                    <Text style={styles.detailText}>{announcement.location}</Text>
                </View>
            </View>

            {announcement.description && (
                <Text style={styles.description}>{announcement.description}</Text>
            )}

            <TouchableOpacity
                style={styles.contactButton}
                onPress={() => onContact(announcement)}
            >
                <MessageCircle size={18} color="white" />
                <Text style={styles.contactButtonText}>Ekibiyle iletişime</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    teamName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        flex: 1,
    },
    evaluateButton: {
        color: '#3b82f6',
        fontWeight: 'bold',
        marginLeft: 10,
    },
    details: {
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailText: {
        marginLeft: 8,
        color: '#6b7280',
        fontSize: 14,
        flex: 1,
    },
    description: {
        color: '#374151',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    contactButton: {
        backgroundColor: '#3b82f6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
    },
    contactButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default AnnouncementCard;
