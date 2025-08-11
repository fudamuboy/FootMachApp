import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ImageBackground,
    SafeAreaView,
    Platform,
    StatusBar
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function CommentsListScreen() {
    const { profile } = useAuth();
    const [comments, setComments] = useState([]);

    useEffect(() => {
        fetchComments();
    }, []);

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('city', profile?.city)
            .order('rating', { ascending: false });

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
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.title}>Yorumlar</Text>
                <Text style={styles.subtitle}>{profile?.city || 'Tüm şehirler'}</Text>
            </View>
            <View style={styles.contentContainer}>
                <Text>Bulunan yorumlar : {comments.length}</Text>
                <ImageBackground
                    source={require('../assets/logos.jpg')}
                    style={styles.imageBackground}
                    imageStyle={{
                        opacity: 0.09,
                    }}
                >
                    <FlatList
                        data={comments}
                        keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
                        renderItem={renderItem}
                        ListEmptyComponent={<Text>Yorum bulunamadı</Text>}
                    />
                </ImageBackground>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#9DB88D',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        backgroundColor: '#9DB88D',
        paddingVertical: 16,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'black',
    },
    subtitle: {
        fontSize: 16,
        color: 'gray',
        marginTop: 4,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
        backgroundColor: '#f1f5f9',
        // borderTopLeftRadius: 20,
        // borderTopRightRadius: 20,
    },
    imageBackground: {
        flex: 1,
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
