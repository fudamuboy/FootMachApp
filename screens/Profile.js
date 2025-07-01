import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Profile() {

    const { profile } = useAuth()
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Bienvenue, {profile?.username} 👋</Text>
            <Text>Email: {profile?.email}</Text>
            <Text>Région: {profile?.region}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
    },
})