import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

export default function CommentsListScreen() {
    const [comments, setComments] = useState([]);

    useEffect(() => {
        // console.log("hauua");

        fetchComments();
    }, []);
    const fetchComments = async () => {
        //  console.log("📡 Chargement des commentaires...");

        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .order('rating', { ascending: false });

        // console.log("🧾 Données :", data);
        // console.log("❗Erreur :", error);

        if (error) {
            console.error('Erreur récupération commentaires :', error);
        } else {
            setComments(data);
        }
    };


    const renderItem = ({ item }) => (
        <View style={styles.commentCard}>
            <Text style={styles.commentHeader}>
                ⭐ {item.rating} | {item.team_name || 'Bilinmeyen takım'}
            </Text>
            <Text style={styles.commentUser}>
                {item.profiles?.full_name || 'anonim'}
            </Text>
            <Text style={styles.commentText}>{item.comment}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Yorumlar</Text>
            <Text>Bulunan yorumlar : {comments.length}</Text>

            <FlatList
                data={comments}
                keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
                renderItem={renderItem}
                ListEmptyComponent={<Text>Yorum bulunamadı</Text>}
            />

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f1f5f9',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        paddingTop: 20,
    },
    commentCard: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        borderColor: '#e5e7eb',
        borderWidth: 1,
    },
    commentHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    commentUser: {
        fontSize: 14,
        color: 'gray',
        marginBottom: 6,
    },
    commentText: {
        fontSize: 16,
    },
});
